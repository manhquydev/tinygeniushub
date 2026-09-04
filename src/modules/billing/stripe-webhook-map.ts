import { payablePlanCodeSchema } from "@/modules/billing/plan-config";
import { billingWebhookSchema } from "@/modules/billing/webhook-service";
import { DomainError } from "@/modules/platform/errors";
import { z } from "zod";

type BillingWebhookPayload = z.infer<typeof billingWebhookSchema>;

const stripeEventSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  created: z.number().int().positive().optional(),
  data: z.object({
    object: z.record(z.string(), z.unknown()),
  }),
});

const EVENT_TYPE_MAP: Record<string, BillingWebhookPayload["eventType"]> = {
  "checkout.session.completed": "payment_succeeded",
  "checkout.session.async_payment_succeeded": "payment_succeeded",
  "invoice.paid": "payment_succeeded",
  "checkout.session.async_payment_failed": "payment_failed",
  "invoice.payment_failed": "payment_failed",
  "charge.refunded": "payment_refunded",
  "customer.subscription.deleted": "subscription_deleted",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function unixToDate(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return new Date(value * 1000);
  }
  return undefined;
}

function nestedRecord(object: Record<string, unknown>, key: string, index = 0) {
  const container = asRecord(object[key]);
  return Array.isArray(container?.data) ? asRecord(container.data[index]) : null;
}

function extractMetadata(object: Record<string, unknown>) {
  const subscriptionDetails = asRecord(object.subscription_details);
  const parentDetails = asRecord(asRecord(object.parent)?.subscription_details);
  const line = nestedRecord(object, "lines");
  const item = nestedRecord(object, "items");
  for (const candidate of [
    object.metadata,
    subscriptionDetails?.metadata,
    parentDetails?.metadata,
    line?.metadata,
    item?.metadata,
  ]) {
    const record = asRecord(candidate);
    if (typeof record?.planCode === "string" && record.planCode.length > 0) {
      return record;
    }
  }
  return {};
}

function extractPeriodEnd(object: Record<string, unknown>) {
  const item = nestedRecord(object, "items");
  const linePeriod = asRecord(nestedRecord(object, "lines")?.period);
  return (
    unixToDate(object.current_period_end) ??
    unixToDate(item?.current_period_end) ??
    unixToDate(linePeriod?.end)
  );
}

function extractAmount(object: Record<string, unknown>, eventType: string) {
  const price = asRecord(nestedRecord(object, "items")?.price);
  const amountRaw =
    object.amount_total ??
    object.amount_paid ??
    object.amount_due ??
    object.amount_subtotal ??
    object.amount_refunded ??
    object.amount ??
    price?.unit_amount;

  if (typeof amountRaw === "number" && Number.isInteger(amountRaw) && amountRaw >= 0) {
    return amountRaw;
  }
  if (eventType.startsWith("customer.subscription.") || eventType.startsWith("invoice.")) {
    return 0;
  }
  throw new DomainError("Stripe webhook missing amount_total", 400, "STRIPE_WEBHOOK_UNMAPPABLE");
}

function extractEmail(object: Record<string, unknown>, metadata: Record<string, unknown>) {
  const parentEmailRaw =
    metadata.parentEmail ??
    object.customer_email ??
    asRecord(object.customer_details)?.email ??
    asRecord(object.billing_details)?.email;
  if (typeof parentEmailRaw !== "string" || parentEmailRaw.length === 0) {
    throw new DomainError("Stripe webhook missing parent email", 400, "STRIPE_WEBHOOK_UNMAPPABLE");
  }
  return parentEmailRaw;
}

function extractTransactionId(object: Record<string, unknown>) {
  const sessionId = object.id;
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    throw new DomainError("Stripe webhook missing object id", 400, "STRIPE_WEBHOOK_UNMAPPABLE");
  }
  if (typeof object.payment_intent === "string" && object.payment_intent.length > 0) {
    return object.payment_intent;
  }
  if (typeof object.subscription === "string" && object.subscription.length > 0) {
    return object.subscription;
  }
  return sessionId;
}

function resolveBillingEventType(
  eventType: string,
  object: Record<string, unknown>,
): BillingWebhookPayload["eventType"] | null {
  const mapped = EVENT_TYPE_MAP[eventType];
  if (mapped) {
    return mapped;
  }
  if (eventType !== "customer.subscription.updated") {
    return null;
  }
  if (object.status === "past_due" || object.status === "unpaid") {
    return "payment_failed";
  }
  if (object.status === "canceled" || object.status === "incomplete_expired") {
    return "subscription_deleted";
  }
  if (object.status === "active" || object.status === "trialing") {
    return "payment_succeeded";
  }
  return null;
}

export function mapStripeEventToBillingWebhookPayload(
  rawEvent: unknown,
): BillingWebhookPayload | null {
  const event = stripeEventSchema.parse(rawEvent);
  const object = event.data.object;
  const billingEventType = resolveBillingEventType(event.type, object);
  if (!billingEventType) {
    return null;
  }

  const metadata = extractMetadata(object);
  const planCode = payablePlanCodeSchema.safeParse(metadata.planCode);
  if (!planCode.success) {
    throw new DomainError("Stripe webhook missing valid planCode metadata", 400, "STRIPE_WEBHOOK_UNMAPPABLE");
  }

  const parentIdRaw = metadata.parentId;
  return {
    provider: "stripe",
    eventId: event.id,
    eventType: billingEventType,
    transactionId: extractTransactionId(object),
    parentId: typeof parentIdRaw === "string" && parentIdRaw.length > 0 ? parentIdRaw : undefined,
    parentEmail: extractEmail(object, metadata),
    amountVnd: extractAmount(object, event.type),
    planCode: planCode.data,
    occurredAt: event.created ? new Date(event.created * 1000) : new Date(),
    periodEnd: extractPeriodEnd(object),
    raw: rawEvent,
  };
}

import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
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

function parseStripeSignatureHeader(signatureHeader: string | null) {
  if (!signatureHeader) {
    return null;
  }

  const segments = signatureHeader
    .split(",")
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return null;
  }

  let timestamp: number | null = null;
  const signatures: string[] = [];

  for (const segment of segments) {
    const [key, value] = segment.split("=", 2);
    if (!key || !value) {
      continue;
    }

    if (key === "t") {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        timestamp = parsed;
      }
      continue;
    }

    if (key === "v1") {
      signatures.push(value);
    }
  }

  if (!timestamp || signatures.length === 0) {
    return null;
  }

  return { timestamp, signatures };
}

function hasMatchingSignature(expected: string, candidates: string[]) {
  const expectedBuffer = Buffer.from(expected, "hex");
  for (const candidate of candidates) {
    const candidateBuffer = Buffer.from(candidate, "hex");
    if (candidateBuffer.length !== expectedBuffer.length) {
      continue;
    }

    if (timingSafeEqual(expectedBuffer, candidateBuffer)) {
      return true;
    }
  }

  return false;
}

export function isValidStripeWebhookSignature(input: {
  rawBody: string;
  signatureHeader: string | null;
  secrets?: string[];
  toleranceSeconds?: number;
  nowMs?: number;
}) {
  const parsedSignature = parseStripeSignatureHeader(input.signatureHeader);
  if (!parsedSignature) {
    return false;
  }

  const nowMs = input.nowMs ?? Date.now();
  const toleranceSeconds = input.toleranceSeconds ?? env.STRIPE_WEBHOOK_TOLERANCE_SECONDS;
  const ageSeconds = Math.floor(Math.abs(nowMs - parsedSignature.timestamp * 1000) / 1000);
  if (ageSeconds > toleranceSeconds) {
    return false;
  }

  const secrets = (input.secrets ?? env.STRIPE_WEBHOOK_SECRETS).filter((item) => item.length > 0);
  if (secrets.length === 0) {
    return false;
  }

  const signedPayload = `${parsedSignature.timestamp}.${input.rawBody}`;
  for (const secret of secrets) {
    const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");
    if (hasMatchingSignature(expected, parsedSignature.signatures)) {
      return true;
    }
  }

  return false;
}

const payablePlanCodeSchema = z.enum(["YEARLY_STANDARD", "YEARLY_FAMILY_PLUS"]);

export function mapStripeEventToBillingWebhookPayload(
  rawEvent: unknown,
): BillingWebhookPayload | null {
  const event = stripeEventSchema.parse(rawEvent);
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded" &&
    event.type !== "checkout.session.async_payment_failed" &&
    event.type !== "charge.refunded"
  ) {
    return null;
  }

  const object = event.data.object;
  const metadataRaw = object.metadata;
  const metadata =
    metadataRaw && typeof metadataRaw === "object" && !Array.isArray(metadataRaw)
      ? (metadataRaw as Record<string, unknown>)
      : {};

  const planCodeRaw = metadata.planCode;
  const planCode = payablePlanCodeSchema.safeParse(planCodeRaw);
  if (!planCode.success) {
    throw new DomainError("Stripe webhook missing valid planCode metadata", 400, "STRIPE_WEBHOOK_UNMAPPABLE");
  }

  const parentEmailRaw =
    metadata.parentEmail ??
    (object.customer_email as unknown) ??
    ((object.customer_details as { email?: unknown } | undefined)?.email as unknown) ??
    ((object.billing_details as { email?: unknown } | undefined)?.email as unknown);
  if (typeof parentEmailRaw !== "string" || parentEmailRaw.length === 0) {
    throw new DomainError("Stripe webhook missing parent email", 400, "STRIPE_WEBHOOK_UNMAPPABLE");
  }

  const amountRaw = object.amount_total ?? object.amount_subtotal ?? object.amount_refunded ?? object.amount;
  if (typeof amountRaw !== "number" || !Number.isInteger(amountRaw) || amountRaw < 0) {
    throw new DomainError("Stripe webhook missing amount_total", 400, "STRIPE_WEBHOOK_UNMAPPABLE");
  }

  const sessionId = object.id;
  if (typeof sessionId !== "string" || sessionId.length === 0) {
    throw new DomainError("Stripe webhook missing checkout session id", 400, "STRIPE_WEBHOOK_UNMAPPABLE");
  }

  const paymentIntentRaw = object.payment_intent;
  const transactionId =
    typeof paymentIntentRaw === "string" && paymentIntentRaw.length > 0 ? paymentIntentRaw : sessionId;

  const parentIdRaw = metadata.parentId;
  const parentId = typeof parentIdRaw === "string" && parentIdRaw.length > 0 ? parentIdRaw : undefined;

  const occurredAt = event.created ? new Date(event.created * 1000) : new Date();
  const paymentSucceeded =
    event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded";
  const paymentRefunded = event.type === "charge.refunded";

  return {
    provider: "stripe",
    eventId: event.id,
    eventType: paymentSucceeded ? "payment_succeeded" : paymentRefunded ? "payment_refunded" : "payment_failed",
    transactionId,
    parentId,
    parentEmail: parentEmailRaw,
    amountVnd: amountRaw,
    planCode: planCode.data,
    occurredAt,
    raw: rawEvent,
  };
}

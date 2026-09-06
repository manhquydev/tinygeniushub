import { PaymentStatus, Prisma, WebhookStatus } from "@prisma/client";
import { DomainError } from "@/modules/platform/errors";

function asRecord(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

export function appendManualReconcileAudit(input: {
  rawPayload: unknown;
  entry: {
    action: string;
    actor: string;
    at: string;
    note: string | null;
    previousStatus: PaymentStatus;
    nextStatus: PaymentStatus;
    syncedCourseIds: string[];
    syncedEnrollmentCount: number;
    webhookEventId: string | null;
    webhookResolution: WebhookStatus | null;
  };
}) {
  const base = asRecord(input.rawPayload) ?? {};
  const currentHistory = Array.isArray(base.manualReconcileHistory)
    ? base.manualReconcileHistory.filter((item) => asRecord(item))
    : [];
  const nextHistory = [...currentHistory, input.entry].slice(-20);

  return {
    ...base,
    manualReconcileLast: input.entry,
    manualReconcileHistory: nextHistory,
  } satisfies Prisma.JsonObject;
}

function normalizeStringOrNumber(value: unknown) {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function collectWebhookTransactionHints(input: {
  eventId: string;
  payload: unknown;
  auditTrail: unknown;
}) {
  const hints = new Set<string>();
  const addHint = (value: unknown) => {
    const normalized = normalizeStringOrNumber(value);
    if (normalized) {
      hints.add(normalized);
    }
  };

  const payload = asRecord(input.payload);
  const payloadData = asRecord(payload?.data);
  const auditTrail = asRecord(input.auditTrail);

  addHint(payload?.transactionId);
  addHint(payload?.orderCode);
  addHint(payloadData?.transactionId);
  addHint(payloadData?.orderCode);
  addHint(auditTrail?.transactionId);
  addHint(auditTrail?.orderCode);

  if (input.eventId.includes(":")) {
    addHint(input.eventId.split(":", 1)[0]);
  }

  return hints;
}

export async function resolveWebhookUpdate(input: {
  tx: Prisma.TransactionClient;
  paymentRecord: {
    id: string;
    provider: string;
    providerTransactionId: string;
  };
  webhookEventId?: string;
  webhookResolution?: WebhookStatus;
  note?: string;
  actorEmail: string;
  action: string;
}) {
  if (!input.webhookEventId || !input.webhookResolution) {
    return null;
  }

  const webhook = await input.tx.webhookEvent.findUnique({
    where: {
      id: input.webhookEventId,
    },
    select: {
      id: true,
      provider: true,
      eventId: true,
      payload: true,
      auditTrail: true,
    },
  });

  if (!webhook) {
    throw new DomainError("Webhook event does not exist.", 404, "WEBHOOK_EVENT_NOT_FOUND");
  }

  if (webhook.provider !== input.paymentRecord.provider) {
    throw new DomainError("Webhook provider does not match payment.", 400, "WEBHOOK_PROVIDER_MISMATCH");
  }

  const auditTrail = asRecord(webhook.auditTrail);
  const linkedPaymentRecordId = normalizeStringOrNumber(auditTrail?.paymentRecordId);
  if (linkedPaymentRecordId && linkedPaymentRecordId !== input.paymentRecord.id) {
    throw new DomainError(
      "Webhook event is being attached to another payment.",
      400,
      "WEBHOOK_EVENT_PAYMENT_MISMATCH",
    );
  }

  const transactionHints = collectWebhookTransactionHints({
    eventId: webhook.eventId,
    payload: webhook.payload,
    auditTrail: webhook.auditTrail,
  });
  if (transactionHints.size === 0) {
    throw new DomainError(
      "Webhook events have no transaction traces to verify.",
      409,
      "WEBHOOK_EVENT_TRANSACTION_UNVERIFIABLE",
    );
  }

  if (!transactionHints.has(input.paymentRecord.providerTransactionId)) {
    throw new DomainError(
      "Webhook event is not part of this transaction payment.",
      400,
      "WEBHOOK_EVENT_TRANSACTION_MISMATCH",
    );
  }

  await input.tx.webhookEvent.update({
    where: {
      id: webhook.id,
    },
    data: {
      status: input.webhookResolution,
      processedAt: new Date(),
      errorMessage:
        input.webhookResolution === WebhookStatus.IGNORED
          ? input.note ?? "Ignored by admin manual reconcile"
          : null,
      auditTrail: {
        paymentRecordId: input.paymentRecord.id,
        manualReconcileBy: input.actorEmail,
        manualReconcileAction: input.action,
      },
    },
  });

  return {
    id: webhook.id,
    status: input.webhookResolution,
  };
}

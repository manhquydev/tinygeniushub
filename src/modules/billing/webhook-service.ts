import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import {
  PaymentStatus,
  SubscriptionStatus,
  WebhookStatus,
} from "@prisma/client";
import { addYears } from "date-fns";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { isPrismaUniqueConstraintError } from "@/lib/prisma-error";
import { getPayablePlanConfig, toPrismaPlanCode } from "@/modules/billing/plan-config";
import { createAuditLog } from "@/modules/platform/audit-service";
import { z } from "zod";

export const billingWebhookSchema = z.object({
  provider: z.string().min(1),
  eventId: z.string().min(1),
  eventType: z.enum(["payment_succeeded", "payment_failed", "payment_refunded"]),
  transactionId: z.string().min(1),
  parentId: z.string().min(1).optional(),
  parentEmail: z.string().email(),
  amountVnd: z.number().int().min(0),
  planCode: z.enum(["YEARLY_STANDARD", "YEARLY_FAMILY_PLUS"]),
  occurredAt: z.coerce.date().optional(),
  raw: z.unknown().optional(),
});

export function isValidBillingSignature(rawBody: string, signature: string | null) {
  if (!signature) {
    return false;
  }

  const expected = createHmac("sha256", env.BILLING_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function resolveSubscriptionPlanConfig(
  planCode: z.infer<typeof billingWebhookSchema>["planCode"],
) {
  const planConfig = getPayablePlanConfig(planCode);
  return {
    childProfileLimit: planConfig.childProfileLimit,
    caregiverLimit: planConfig.caregiverLimit,
    portfolioRetentionMaxDays: planConfig.portfolioRetentionMaxDays,
    status: planConfig.status,
  };
}

function resolvePaymentStatus(eventType: z.infer<typeof billingWebhookSchema>["eventType"]) {
  if (eventType === "payment_succeeded") {
    return PaymentStatus.SUCCEEDED;
  }

  if (eventType === "payment_failed") {
    return PaymentStatus.FAILED;
  }

  return PaymentStatus.REFUNDED;
}

function hashWebhookLockKey(provider: string, eventId: string): bigint {
  const hash = createHash("sha256").update(`${provider}:${eventId}`).digest();
  return hash.readBigInt64BE(0);
}

export async function processBillingWebhook(params: {
  payload: z.infer<typeof billingWebhookSchema>;
}) {
  const payload = billingWebhookSchema.parse(params.payload);

  return prisma.$transaction(async (tx) => {
    // Serialize concurrent replay attempts for the same event via advisory lock
    const lockKey = hashWebhookLockKey(payload.provider, payload.eventId);
    await tx.$queryRawUnsafe(`SELECT pg_advisory_xact_lock($1)`, lockKey);

    const existingEvent = await tx.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: payload.provider,
          eventId: payload.eventId,
        },
      },
    });

    if (existingEvent?.status === WebhookStatus.PROCESSED) {
      return {
        duplicate: true,
        message: "Webhook already processed",
      };
    }

    let webhookEvent = existingEvent;

    if (webhookEvent) {
      webhookEvent = await tx.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          payload: payload.raw ?? payload,
          signatureValid: true,
          status: WebhookStatus.RECEIVED,
          errorMessage: null,
        },
      });
    } else {
      try {
        webhookEvent = await tx.webhookEvent.create({
          data: {
            provider: payload.provider,
            eventId: payload.eventId,
            payload: payload.raw ?? payload,
            signatureValid: true,
            status: WebhookStatus.RECEIVED,
          },
        });
      } catch (error) {
        if (!isPrismaUniqueConstraintError(error, ["provider", "eventid"])) {
          throw error;
        }

        webhookEvent = await tx.webhookEvent.findUnique({
          where: {
            provider_eventId: {
              provider: payload.provider,
              eventId: payload.eventId,
            },
          },
        });

        if (!webhookEvent) {
          throw error;
        }

        if (webhookEvent.status === WebhookStatus.PROCESSED) {
          return {
            duplicate: true,
            message: "Webhook already processed",
          };
        }

        webhookEvent = await tx.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: {
            payload: payload.raw ?? payload,
            signatureValid: true,
            status: WebhookStatus.RECEIVED,
            errorMessage: null,
          },
        });
      }
    }

    const parent = payload.parentId
      ? await tx.parentAccount.findUnique({ where: { id: payload.parentId }, include: { subscription: true } })
      : await tx.parentAccount.findUnique({ where: { email: payload.parentEmail }, include: { subscription: true } });

    if (!parent) {
      await tx.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookStatus.IGNORED,
          errorMessage: "Parent account not found",
          processedAt: new Date(),
        },
      });

      return {
        duplicate: false,
        message: "Parent not found. Event ignored.",
      };
    }

    const paymentStatus = resolvePaymentStatus(payload.eventType);
    const planCode = toPrismaPlanCode(payload.planCode);

    const periodStart = payload.occurredAt ?? new Date();
    const periodEnd = addYears(periodStart, 1);

    const planConfig = resolveSubscriptionPlanConfig(payload.planCode);
    let subscription = parent.subscription;

    if (paymentStatus === PaymentStatus.SUCCEEDED) {
      subscription = parent.subscription
        ? await tx.subscription.update({
            where: { parentId: parent.id },
            data: {
              planCode,
              ...planConfig,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              autoRenew: true,
            },
          })
        : await tx.subscription.create({
            data: {
              parentId: parent.id,
              planCode,
              ...planConfig,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              autoRenew: true,
            },
          });
    }

    if (paymentStatus === PaymentStatus.FAILED && subscription) {
      subscription = await tx.subscription.update({
        where: { parentId: parent.id },
        data: {
          status: SubscriptionStatus.GRACE,
        },
      });
    }

    if (paymentStatus === PaymentStatus.REFUNDED && subscription) {
      subscription = await tx.subscription.update({
        where: { parentId: parent.id },
        data: {
          status: SubscriptionStatus.REFUNDED,
          autoRenew: false,
        },
      });
    }

    await tx.paymentRecord.upsert({
      where: {
        provider_providerTransactionId: {
          provider: payload.provider,
          providerTransactionId: payload.transactionId,
        },
      },
      update: {
        amountVnd: payload.amountVnd,
        status: paymentStatus,
        rawPayload: payload.raw ?? payload,
        processedAt: new Date(),
        subscriptionId: subscription?.id,
      },
      create: {
        parentId: parent.id,
        subscriptionId: subscription?.id,
        provider: payload.provider,
        providerTransactionId: payload.transactionId,
        amountVnd: payload.amountVnd,
        status: paymentStatus,
        rawPayload: payload.raw ?? payload,
      },
    });

    await tx.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        status: WebhookStatus.PROCESSED,
        processedAt: new Date(),
        auditTrail: {
          parentId: parent.id,
          transactionId: payload.transactionId,
          status: paymentStatus,
          planCode,
        },
      },
    });

    await createAuditLog({
      dbClient: tx,
      actorType: "system",
      action: "billing.webhook.processed",
      resourceType: "payment",
      resourceId: payload.transactionId,
      metadata: {
        parentId: parent.id,
        provider: payload.provider,
        eventId: payload.eventId,
        planCode,
        paymentStatus,
      },
    });

    return {
      duplicate: false,
      message: "Webhook processed",
      parentId: parent.id,
      planCode,
      paymentStatus,
    };
  });
}

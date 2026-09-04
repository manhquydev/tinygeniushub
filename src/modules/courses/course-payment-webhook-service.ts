import { PaymentStatus, Prisma, WebhookStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isValidPayosSignature } from "@/modules/billing/payos-client";
import { getPublishedCoursesByBundleSlug } from "@/modules/courses/course-bundle-service";
import { parsePilotAttributionSnapshot } from "@/modules/courses/pilot-attribution";
import { trackPilotPurchaseSucceeded } from "@/modules/courses/pilot-funnel-tracking-service";
import { grantCourseOfferingInTx } from "@/modules/entitlement/grant-from-billing";
import { createAuditLog } from "@/modules/platform/audit-service";

const payosWebhookDataSchema = z.object({
  orderCode: z.union([z.number(), z.string()]),
  amount: z.coerce.number().int().nonnegative(),
  paymentLinkId: z.string().optional(),
  code: z.string().optional(),
  desc: z.string().optional(),
  reference: z.string().optional(),
  transactionDateTime: z.string().optional(),
});

export const payosWebhookPayloadSchema = z.object({
  code: z.string().optional(),
  desc: z.string().optional(),
  success: z.boolean().optional(),
  data: payosWebhookDataSchema,
  signature: z.string().min(1).optional(),
});

function resolveWebhookEventId(payload: z.infer<typeof payosWebhookPayloadSchema>) {
  const orderCode = String(payload.data.orderCode);
  if (payload.data.reference) {
    return `${orderCode}:${payload.data.reference}`;
  }

  if (payload.data.transactionDateTime) {
    return `${orderCode}:${payload.data.transactionDateTime}`;
  }

  return `${orderCode}:${payload.data.code ?? payload.code ?? "unknown"}`;
}

function isPaymentSucceeded(payload: z.infer<typeof payosWebhookPayloadSchema>) {
  if (payload.data.code === "00") {
    return true;
  }

  return payload.success === true && payload.code === "00";
}

export async function processPayosCourseWebhook(rawPayload: unknown) {
  const payload = payosWebhookPayloadSchema.parse(rawPayload);
  const signatureValid = isValidPayosSignature({
    signature: payload.signature,
    data: payload.data as Record<string, unknown>,
  });

  if (!signatureValid) {
    return {
      accepted: false,
      status: 401,
      message: "Invalid PayOS signature",
    };
  }

  const orderCode = String(payload.data.orderCode);
  const eventId = resolveWebhookEventId(payload);
  const paymentSucceeded = isPaymentSucceeded(payload);

  const result = await prisma.$transaction(async (tx) => {
    const existingEvent = await tx.webhookEvent.findUnique({
      where: {
        provider_eventId: {
          provider: "payos",
          eventId,
        },
      },
    });

    if (existingEvent?.status === WebhookStatus.PROCESSED) {
      return {
        duplicate: true,
        message: "Webhook already processed",
      };
    }

    const webhookEvent = existingEvent
      ? await tx.webhookEvent.update({
          where: { id: existingEvent.id },
          data: {
            signatureValid: true,
            payload,
            status: WebhookStatus.RECEIVED,
            errorMessage: null,
          },
        })
      : await tx.webhookEvent.create({
          data: {
            provider: "payos",
            eventId,
            signatureValid: true,
            payload,
            status: WebhookStatus.RECEIVED,
          },
        });

    const paymentRecord = await tx.paymentRecord.findUnique({
      where: {
        provider_providerTransactionId: {
          provider: "payos",
          providerTransactionId: orderCode,
        },
      },
      select: {
        id: true,
        parentId: true,
        amountVnd: true,
        status: true,
        rawPayload: true,
      },
    });

    if (!paymentRecord) {
      await tx.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookStatus.IGNORED,
          errorMessage: "Payment record not found",
          processedAt: new Date(),
        },
      });

      return {
        duplicate: false,
        message: "Payment record not found",
      };
    }

    if (paymentRecord.status === PaymentStatus.SUCCEEDED) {
      await tx.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookStatus.PROCESSED,
          processedAt: new Date(),
          auditTrail: {
            orderCode,
            paymentRecordId: paymentRecord.id,
            paymentStatus: PaymentStatus.SUCCEEDED,
            ignoredReason: "payment_already_succeeded",
          },
        },
      });

      return {
        duplicate: true,
        message: "Payment already succeeded",
        paymentStatus: PaymentStatus.SUCCEEDED,
      };
    }

    if (paymentSucceeded && payload.data.amount !== paymentRecord.amountVnd) {
      await tx.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: WebhookStatus.IGNORED,
          errorMessage: "Webhook amount mismatch",
          processedAt: new Date(),
          auditTrail: {
            orderCode,
            paymentRecordId: paymentRecord.id,
            expectedAmountVnd: paymentRecord.amountVnd,
            receivedAmountVnd: payload.data.amount,
          },
        },
      });

      return {
        duplicate: false,
        message: "Webhook amount mismatch",
      };
    }

    const mergedRawPayload: Record<string, unknown> = {
      ...(typeof paymentRecord.rawPayload === "object" && paymentRecord.rawPayload !== null
        ? (paymentRecord.rawPayload as Record<string, unknown>)
        : {}),
      payosWebhook: payload,
    };

    const nextPaymentStatus = paymentSucceeded ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED;

    await tx.paymentRecord.update({
      where: { id: paymentRecord.id },
      data: {
        status: nextPaymentStatus,
        processedAt: new Date(),
        rawPayload: mergedRawPayload as Prisma.InputJsonValue,
      },
    });

    if (paymentSucceeded) {
      const raw = mergedRawPayload;
      const target = raw.target && typeof raw.target === "object" ? (raw.target as Record<string, unknown>) : null;
      const targetKind = typeof target?.kind === "string" ? target.kind : null;
      const attribution = parsePilotAttributionSnapshot(raw.attribution);
      const targetSlug =
        targetKind === "bundle"
          ? typeof target?.bundleSlug === "string"
            ? target.bundleSlug
            : null
          : typeof target?.courseSlug === "string"
            ? target.courseSlug
            : null;
      const purchaseResourceId = `${paymentRecord.parentId}:${paymentRecord.id}`;

      const existingPurchaseAudit = await tx.auditLog.findFirst({
        where: {
          actorType: "parent",
          actorId: paymentRecord.parentId,
          action: "course_purchase_succeeded",
          resourceType: "course_checkout",
          resourceId: purchaseResourceId,
        },
        select: { id: true },
      });

      if (!existingPurchaseAudit) {
        await createAuditLog({
          dbClient: tx,
          actorType: "parent",
          actorId: paymentRecord.parentId,
          action: "course_purchase_succeeded",
          resourceType: "course_checkout",
          resourceId: purchaseResourceId,
          metadata: {
            provider: "payos",
            amountVnd: payload.data.amount,
            paymentRecordId: paymentRecord.id,
            sessionId: orderCode,
            targetKind,
            targetSlug,
            attributionChannel: attribution?.channel ?? "unknown",
            attributionExperimentCoursesVariant: attribution?.experimentCoursesVariant ?? null,
            attributionExperimentPricingVariant: attribution?.experimentPricingVariant ?? null,
          } satisfies Prisma.JsonObject,
        });
      }

      if (targetKind === "bundle") {
        const bundleSlug = typeof target?.bundleSlug === "string" ? target.bundleSlug : null;
        if (bundleSlug) {
          const bundleResult = await getPublishedCoursesByBundleSlug(bundleSlug);
          const checkoutCourses =
            bundleResult.courses.length > 0 ? bundleResult.courses : bundleResult.legacyCourses;

          for (const course of checkoutCourses) {
            await tx.courseEnrollment.upsert({
              where: {
                courseId_parentId: {
                  courseId: course.id,
                  parentId: paymentRecord.parentId,
                },
              },
              update: {
                paymentId: paymentRecord.id,
              },
              create: {
                courseId: course.id,
                parentId: paymentRecord.parentId,
                paymentId: paymentRecord.id,
              },
            });
            await grantCourseOfferingInTx(tx, {
              parentId: paymentRecord.parentId,
              courseId: course.id,
              sourcePaymentId: paymentRecord.id,
            });

            await trackPilotPurchaseSucceeded({
              dbClient: tx,
              parentId: paymentRecord.parentId,
              paymentRecordId: paymentRecord.id,
              courseId: course.id,
              courseSlug: course.slug,
              provider: "payos",
              amountVnd: payload.data.amount,
              source: "payos_webhook",
              attribution,
            });
          }
        }
      }

      if (targetKind === "course") {
        const courseId = typeof target?.courseId === "string" ? target.courseId : null;
        if (courseId) {
          const courseSlugFromTarget =
            typeof target?.courseSlug === "string" && target.courseSlug.length > 0
              ? target.courseSlug
              : null;
          const courseSlug =
            courseSlugFromTarget ??
            (
              await tx.course.findUnique({
                where: { id: courseId },
                select: { slug: true },
              })
            )?.slug;

          await tx.courseEnrollment.upsert({
            where: {
              courseId_parentId: {
                courseId,
                parentId: paymentRecord.parentId,
              },
            },
            update: {
              paymentId: paymentRecord.id,
            },
            create: {
              courseId,
              parentId: paymentRecord.parentId,
              paymentId: paymentRecord.id,
            },
          });
          await grantCourseOfferingInTx(tx, {
            parentId: paymentRecord.parentId,
            courseId,
            sourcePaymentId: paymentRecord.id,
          });

          if (courseSlug) {
            await trackPilotPurchaseSucceeded({
              dbClient: tx,
              parentId: paymentRecord.parentId,
              paymentRecordId: paymentRecord.id,
              courseId,
              courseSlug,
              provider: "payos",
              amountVnd: payload.data.amount,
              source: "payos_webhook",
              attribution,
            });
          }
        }
      }
    }

    await tx.webhookEvent.update({
      where: { id: webhookEvent.id },
      data: {
        status: WebhookStatus.PROCESSED,
        processedAt: new Date(),
        auditTrail: {
          orderCode,
          paymentRecordId: paymentRecord.id,
          paymentStatus: nextPaymentStatus,
        },
      },
    });

    return {
      duplicate: false,
      message: "Webhook processed",
      paymentStatus: nextPaymentStatus,
    };
  });

  return {
    accepted: true,
    status: 200,
    ...result,
  };
}


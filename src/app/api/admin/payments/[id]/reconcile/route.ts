import type { NextRequest } from "next/server";
import { PaymentStatus } from "@prisma/client";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { syncEnrollmentsFromPaymentTarget } from "@/modules/admin/payment-reconcile-sync";
import {
  appendManualReconcileAudit,
  resolveWebhookUpdate,
} from "@/modules/admin/payment-reconcile-webhook";
import { DomainError } from "@/modules/platform/errors";

const reconcileActionSchema = z
  .object({
    action: z.enum([
      "MARK_SUCCEEDED_AND_SYNC",
      "SYNC_ENROLLMENTS",
      "MARK_FAILED",
      "MARK_PENDING",
    ]),
    note: z.string().trim().min(3).max(1000).optional(),
    webhookEventId: z.string().min(1).max(191).optional(),
    webhookResolution: z.enum(["PROCESSED", "IGNORED"]).optional(),
  })
  .superRefine((value, ctx) => {
    if ((value.webhookEventId && !value.webhookResolution) || (!value.webhookEventId && value.webhookResolution)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["webhookResolution"],
        message: "webhookEventId and webhookResolution must go together.",
      });
    }
  });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;

    const admin = await requireAdminFromRequest(request, ["SUPER_ADMIN", "SUPPORT_AGENT"]);
    const { id } = await params;
    const body = reconcileActionSchema.parse(await request.json());

    const result = await prisma.$transaction(async (tx) => {
      const paymentRecord = await tx.paymentRecord.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          parentId: true,
          provider: true,
          providerTransactionId: true,
          status: true,
          rawPayload: true,
        },
      });

      if (!paymentRecord) {
        throw new DomainError("Payment does not exist.", 404, "PAYMENT_NOT_FOUND");
      }

      let nextStatus = paymentRecord.status;
      let syncedEnrollmentCount = 0;
      let syncedCourseIds: string[] = [];

      if (body.action === "MARK_FAILED") {
        nextStatus = PaymentStatus.FAILED;
      }

      if (body.action === "MARK_PENDING") {
        nextStatus = PaymentStatus.PENDING;
      }

      if (body.action === "MARK_SUCCEEDED_AND_SYNC") {
        nextStatus = PaymentStatus.SUCCEEDED;
        const syncResult = await syncEnrollmentsFromPaymentTarget({
          tx,
          parentId: paymentRecord.parentId,
          paymentRecordId: paymentRecord.id,
          rawPayload: paymentRecord.rawPayload,
        });
        syncedEnrollmentCount = syncResult.syncedEnrollmentCount;
        syncedCourseIds = syncResult.courseIds;
      }

      if (body.action === "SYNC_ENROLLMENTS") {
        if (paymentRecord.status !== PaymentStatus.SUCCEEDED) {
          throw new DomainError(
            "Payment is not in SUCCEEDED status. Use MARK_SUCCEEDED_AND_SYNC first.",
            409,
            "PAYMENT_NOT_SUCCEEDED",
          );
        }
        const syncResult = await syncEnrollmentsFromPaymentTarget({
          tx,
          parentId: paymentRecord.parentId,
          paymentRecordId: paymentRecord.id,
          rawPayload: paymentRecord.rawPayload,
        });
        syncedEnrollmentCount = syncResult.syncedEnrollmentCount;
        syncedCourseIds = syncResult.courseIds;
      }

      const webhookUpdate = await resolveWebhookUpdate({
        tx,
        paymentRecord: {
          id: paymentRecord.id,
          provider: paymentRecord.provider,
          providerTransactionId: paymentRecord.providerTransactionId,
        },
        webhookEventId: body.webhookEventId,
        webhookResolution: body.webhookResolution,
        note: body.note,
        actorEmail: admin.email,
        action: body.action,
      });

      const reconcileEntry = {
        action: body.action,
        actor: admin.email,
        at: new Date().toISOString(),
        note: body.note ?? null,
        previousStatus: paymentRecord.status,
        nextStatus,
        syncedCourseIds,
        syncedEnrollmentCount,
        webhookEventId: webhookUpdate?.id ?? null,
        webhookResolution: webhookUpdate?.status ?? null,
      };

      const shouldTouchProcessedAt =
        body.action === "MARK_FAILED" ||
        body.action === "MARK_PENDING" ||
        body.action === "MARK_SUCCEEDED_AND_SYNC";

      const updatedPayment = await tx.paymentRecord.update({
        where: {
          id: paymentRecord.id,
        },
        data: {
          status: nextStatus,
          ...(shouldTouchProcessedAt ? { processedAt: new Date() } : {}),
          rawPayload: appendManualReconcileAudit({
            rawPayload: paymentRecord.rawPayload,
            entry: reconcileEntry,
          }),
        },
        select: {
          id: true,
          status: true,
          processedAt: true,
        },
      });

      await tx.adminActionLog.create({
        data: {
          adminEmail: admin.email,
          action: "payment_manual_reconcile",
          target: paymentRecord.id,
          detail: {
            action: body.action,
            note: body.note ?? null,
            previousStatus: paymentRecord.status,
            nextStatus,
            syncedEnrollmentCount,
            syncedCourseIds,
            webhookEventId: webhookUpdate?.id ?? null,
            webhookResolution: webhookUpdate?.status ?? null,
          },
        },
      });

      return {
        payment: updatedPayment,
        syncedEnrollmentCount,
        syncedCourseIds,
        webhookUpdate,
      };
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

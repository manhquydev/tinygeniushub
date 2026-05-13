import type { NextRequest } from "next/server";
import { PaymentStatus, Prisma, WebhookStatus } from "@prisma/client";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import {
  getBundleCourseSlugFilters,
  getCourseBundleByBundleSlug,
  isCanonicalSplitCourseSlug,
  isLegacyMonolithCourseSlug,
} from "@/modules/courses/course-bundles";
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

function asRecord(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

function appendManualReconcileAudit(input: {
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

function uniqueStringList(values: unknown[]) {
  const set = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }
    const normalized = value.trim();
    if (!normalized) {
      continue;
    }
    set.add(normalized);
  }

  return [...set];
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

async function resolveCourseIdsFromCheckoutTarget(tx: Prisma.TransactionClient, rawPayload: unknown) {
  const raw = asRecord(rawPayload);
  const target = asRecord(raw?.target);
  if (!target) {
    return [];
  }

  const targetKind = typeof target.kind === "string" ? target.kind : null;
  if (targetKind === "course") {
    const courseId = typeof target.courseId === "string" ? target.courseId.trim() : "";
    return courseId ? [courseId] : [];
  }

  if (targetKind !== "bundle") {
    return [];
  }

  const targetCourseIds = Array.isArray(target.courseIds)
    ? uniqueStringList(target.courseIds)
    : [];
  if (targetCourseIds.length > 0) {
    const rows = await tx.course.findMany({
      where: {
        id: {
          in: targetCourseIds,
        },
      },
      select: {
        id: true,
      },
    });
    return rows.map((row) => row.id);
  }

  const bundleSlug = typeof target.bundleSlug === "string" ? target.bundleSlug.trim() : "";
  if (!bundleSlug) {
    return [];
  }

  const bundle = getCourseBundleByBundleSlug(bundleSlug);
  if (!bundle) {
    return [];
  }

  const rows = await tx.course.findMany({
    where: {
      OR: getBundleCourseSlugFilters(bundle),
    },
    select: {
      id: true,
      slug: true,
    },
  });

  if (rows.length === 0) {
    return [];
  }

  const splitRows = rows.filter((row) => isCanonicalSplitCourseSlug(bundle, row.slug));
  if (splitRows.length > 0) {
    return splitRows.map((row) => row.id);
  }

  const nonLegacyRows = rows.filter((row) => !isLegacyMonolithCourseSlug(bundle, row.slug));
  if (nonLegacyRows.length > 0) {
    return nonLegacyRows.map((row) => row.id);
  }

  return rows.map((row) => row.id);
}

async function syncEnrollmentsFromPaymentTarget(input: {
  tx: Prisma.TransactionClient;
  parentId: string;
  paymentRecordId: string;
  rawPayload: unknown;
}) {
  const courseIds = await resolveCourseIdsFromCheckoutTarget(input.tx, input.rawPayload);
  if (courseIds.length === 0) {
    throw new DomainError(
      "Unable to resolve course list from payment target.",
      409,
      "PAYMENT_RECONCILE_TARGET_INVALID",
    );
  }

  let syncedEnrollmentCount = 0;
  for (const courseId of courseIds) {
    await input.tx.courseEnrollment.upsert({
      where: {
        courseId_parentId: {
          courseId,
          parentId: input.parentId,
        },
      },
      update: {
        paymentId: input.paymentRecordId,
      },
      create: {
        courseId,
        parentId: input.parentId,
        paymentId: input.paymentRecordId,
      },
    });
    syncedEnrollmentCount += 1;
  }

  return {
    courseIds,
    syncedEnrollmentCount,
  };
}

async function resolveWebhookUpdate(input: {
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

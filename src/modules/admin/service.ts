import { PaymentStatus, WebhookStatus } from "@prisma/client";
import { subDays } from "date-fns";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/modules/platform/audit-service";
import { DomainError } from "@/modules/platform/errors";
import { z } from "zod";

type CountByStatus = Record<string, number>;

function toStatusMap(input: Array<{ status: string; _count: { _all: number } }>): CountByStatus {
  return input.reduce<CountByStatus>((acc, item) => {
    acc[item.status] = item._count._all;
    return acc;
  }, {});
}

export const adminPaymentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(PaymentStatus).optional(),
});

export const adminWebhookQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(WebhookStatus).optional(),
});

export const adminLessonTrialFlagSchema = z.object({
  trialEnabled: z.boolean(),
});

export async function getAdminOverview() {
  const since30d = subDays(new Date(), 30);

  const [
    parentsCount,
    childrenCount,
    subscriptionsByStatusRaw,
    payments30d,
    webhooksByStatusRaw,
    recentPayments,
    recentWebhookEvents,
    referralCodesCount,
    referralAttributionsCount,
    paidReferralsCount,
    rewardedReferralsCount,
  ] = await Promise.all([
    prisma.parentAccount.count(),
    prisma.childProfile.count(),
    prisma.subscription.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.paymentRecord.aggregate({
      where: {
        processedAt: { gte: since30d },
        status: PaymentStatus.SUCCEEDED,
      },
      _count: { _all: true },
      _sum: { amountVnd: true },
    }),
    prisma.webhookEvent.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.paymentRecord.findMany({
      orderBy: { processedAt: "desc" },
      take: 8,
      select: {
        id: true,
        provider: true,
        providerTransactionId: true,
        amountVnd: true,
        status: true,
        processedAt: true,
        parent: {
          select: {
            email: true,
          },
        },
      },
    }),
    prisma.webhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        provider: true,
        eventId: true,
        status: true,
        signatureValid: true,
        processedAt: true,
        createdAt: true,
      },
    }),
    prisma.referralCode.count(),
    prisma.referralAttribution.count(),
    prisma.referralAttribution.count({
      where: {
        paidAt: { not: null },
      },
    }),
    prisma.referralAttribution.count({
      where: {
        rewardGranted: true,
      },
    }),
  ]);

  return {
    counts: {
      parents: parentsCount,
      children: childrenCount,
      successfulPayments30d: payments30d._count._all,
      successfulRevenueVnd30d: payments30d._sum.amountVnd ?? 0,
      referralCodes: referralCodesCount,
      referralAttributions: referralAttributionsCount,
      paidReferrals: paidReferralsCount,
      rewardedReferrals: rewardedReferralsCount,
    },
    subscriptionsByStatus: toStatusMap(
      subscriptionsByStatusRaw.map((item) => ({ status: item.status, _count: item._count })),
    ),
    webhooksByStatus: toStatusMap(
      webhooksByStatusRaw.map((item) => ({ status: item.status, _count: item._count })),
    ),
    recentPayments,
    recentWebhookEvents,
  };
}

export async function listPaymentRecordsAdmin(input: unknown) {
  const query = adminPaymentQuerySchema.parse(input);

  return prisma.paymentRecord.findMany({
    where: {
      ...(query.status ? { status: query.status } : {}),
    },
    orderBy: {
      processedAt: "desc",
    },
    take: query.limit,
    select: {
      id: true,
      parentId: true,
      provider: true,
      providerTransactionId: true,
      amountVnd: true,
      currency: true,
      status: true,
      processedAt: true,
      parent: {
        select: {
          email: true,
        },
      },
    },
  });
}

export async function listWebhookEventsAdmin(input: unknown) {
  const query = adminWebhookQuerySchema.parse(input);

  return prisma.webhookEvent.findMany({
    where: {
      ...(query.status ? { status: query.status } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: query.limit,
    select: {
      id: true,
      provider: true,
      eventId: true,
      signatureValid: true,
      status: true,
      errorMessage: true,
      processedAt: true,
      createdAt: true,
    },
  });
}

export async function updateLessonTrialFlagAdmin(params: {
  lessonId: string;
  actorId: string;
  input: unknown;
}) {
  const payload = adminLessonTrialFlagSchema.parse(params.input);

  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },
    select: {
      id: true,
      slug: true,
      trialEnabled: true,
    },
  });

  if (!lesson) {
    throw new DomainError("Lesson not found", 404, "LESSON_NOT_FOUND");
  }

  const updatedLesson = await prisma.lesson.update({
    where: { id: params.lessonId },
    data: {
      trialEnabled: payload.trialEnabled,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      trialEnabled: true,
    },
  });

  await createAuditLog({
    actorType: "admin",
    actorId: params.actorId,
    action: "content.lesson.trial_flag.updated",
    resourceType: "lesson",
    resourceId: updatedLesson.id,
    metadata: {
      slug: updatedLesson.slug,
      previousTrialEnabled: lesson.trialEnabled,
      nextTrialEnabled: updatedLesson.trialEnabled,
    },
  });

  return updatedLesson;
}

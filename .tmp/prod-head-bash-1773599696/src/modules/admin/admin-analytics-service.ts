import { PaymentStatus, SubscriptionStatus } from "@prisma/client";
import { differenceInCalendarDays, subDays } from "date-fns";
import { prisma } from "@/lib/db";

type CountByStatus = Record<string, number>;

function toStatusMap(input: Array<{ status: string; _count: { _all: number } }>): CountByStatus {
  return input.reduce<CountByStatus>((acc, item) => {
    acc[item.status] = item._count._all;
    return acc;
  }, {});
}

export type AdminLearningAnalytics = {
  activeChildrenLast7d: number;
  activeChildrenLast30d: number;
  totalLessonsCompleted30d: number;
  avgMinutesPerChildPerDay: number;
  topLessons: Array<{
    lessonId: string;
    title: string;
    completionCount: number;
  }>;
  streakDistribution: {
    zero: number;
    low: number;
    medium: number;
    high: number;
  };
};

export type AdminRetentionAnalytics = {
  newParents7d: number;
  newParents30d: number;
  churned30d: number;
  retentionRate: number;
  avgDaysToFirstLesson: number;
  avgLessonsPerChildPerWeek: number;
};

export const ADMIN_ANALYTICS_PERIODS = ["7d", "30d", "90d"] as const;
export type AdminAnalyticsPeriod = (typeof ADMIN_ANALYTICS_PERIODS)[number];

export type AdminAnalyticsTopLesson = {
  id: string;
  slug: string;
  title: string;
  completionCount: number;
  avgMinutes: number;
};

export type AdminAnalyticsSnapshot = {
  period: AdminAnalyticsPeriod;
  learningStats: {
    activeChildren: number;
    totalLessonsCompleted: number;
    avgMinutesPerChildPerDay: number;
  };
  streakBuckets: {
    zero: number;
    low: number;
    medium: number;
    high: number;
  };
  topLessons: AdminAnalyticsTopLesson[];
  retentionMetrics: AdminRetentionAnalytics;
};

function periodToDays(period: AdminAnalyticsPeriod) {
  switch (period) {
    case "7d":
      return 7;
    case "90d":
      return 90;
    case "30d":
    default:
      return 30;
  }
}

export function parseAdminAnalyticsPeriod(value: string | null | undefined): AdminAnalyticsPeriod {
  if (value === "7d" || value === "30d" || value === "90d") {
    return value;
  }
  return "30d";
}

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

export async function getAdminLearningAnalytics(): Promise<AdminLearningAnalytics> {
  const since7d = subDays(new Date(), 7);
  const since30d = subDays(new Date(), 30);

  const [
    totalChildren,
    activeChildren7d,
    activeChildren30d,
    completedLessons30dAggregate,
    topLessonCompletionRows,
    progressStates,
  ] = await Promise.all([
    prisma.childProfile.count(),
    prisma.lessonCompletion.groupBy({
      by: ["childId"],
      where: {
        completedAt: { gte: since7d },
      },
    }),
    prisma.lessonCompletion.groupBy({
      by: ["childId"],
      where: {
        completedAt: { gte: since30d },
      },
    }),
    prisma.lessonCompletion.aggregate({
      where: {
        completedAt: { gte: since30d },
      },
      _count: { _all: true },
      _sum: { minutesLearned: true },
    }),
    prisma.lessonCompletion.groupBy({
      by: ["lessonId"],
      where: {
        completedAt: { gte: since30d },
      },
      _count: { lessonId: true },
      orderBy: [{ _count: { lessonId: "desc" } }, { lessonId: "asc" }],
      take: 10,
    }),
    prisma.progressState.findMany({
      select: {
        childId: true,
        streakCount: true,
      },
    }),
  ]);

  const topLessonIds = topLessonCompletionRows.map((row) => row.lessonId);
  const topLessonTitleRows =
    topLessonIds.length === 0
      ? []
      : await prisma.lesson.findMany({
          where: {
            id: { in: topLessonIds },
          },
          select: {
            id: true,
            title: true,
          },
        });

  const titleByLessonId = new Map(topLessonTitleRows.map((lesson) => [lesson.id, lesson.title]));
  const topLessons = topLessonCompletionRows.map((row) => ({
    lessonId: row.lessonId,
    title: titleByLessonId.get(row.lessonId) ?? "Unknown lesson",
    completionCount: row._count.lessonId,
  }));

  const maxStreakByChild = new Map<string, number>();
  for (const progressState of progressStates) {
    const existingMax = maxStreakByChild.get(progressState.childId) ?? 0;
    if (progressState.streakCount > existingMax) {
      maxStreakByChild.set(progressState.childId, progressState.streakCount);
    }
  }

  let zero = Math.max(totalChildren - maxStreakByChild.size, 0);
  let low = 0;
  let medium = 0;
  let high = 0;

  for (const streakCount of maxStreakByChild.values()) {
    if (streakCount <= 0) {
      zero += 1;
      continue;
    }

    if (streakCount <= 3) {
      low += 1;
      continue;
    }

    if (streakCount <= 7) {
      medium += 1;
      continue;
    }

    high += 1;
  }

  const totalMinutes30d = completedLessons30dAggregate._sum.minutesLearned ?? 0;
  const averageMinutesPerChildPerDay =
    totalChildren > 0 ? Number((totalMinutes30d / totalChildren / 30).toFixed(2)) : 0;

  return {
    activeChildrenLast7d: activeChildren7d.length,
    activeChildrenLast30d: activeChildren30d.length,
    totalLessonsCompleted30d: completedLessons30dAggregate._count._all,
    avgMinutesPerChildPerDay: averageMinutesPerChildPerDay,
    topLessons,
    streakDistribution: {
      zero,
      low,
      medium,
      high,
    },
  };
}

export async function getAdminRetentionAnalytics(): Promise<AdminRetentionAnalytics> {
  const since7d = subDays(new Date(), 7);
  const since30d = subDays(new Date(), 30);

  const [newParents7d, newParents30d, churned30d, activeSubscriptionCount, totalSubscriptionCount, childrenCount, lessons30dCount] =
    await Promise.all([
      prisma.parentAccount.count({
        where: {
          createdAt: {
            gte: since7d,
          },
        },
      }),
      prisma.parentAccount.count({
        where: {
          createdAt: {
            gte: since30d,
          },
        },
      }),
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.CANCELED_AT_PERIOD_END,
          updatedAt: {
            gte: since30d,
          },
        },
      }),
      prisma.subscription.count({
        where: {
          status: {
            in: [
              SubscriptionStatus.TRIALING,
              SubscriptionStatus.ACTIVE_STANDARD,
              SubscriptionStatus.ACTIVE_FAMILYPLUS,
              SubscriptionStatus.GRACE,
            ],
          },
        },
      }),
      prisma.subscription.count(),
      prisma.childProfile.count(),
      prisma.lessonCompletion.count({
        where: {
          completedAt: {
            gte: since30d,
          },
        },
      }),
    ]);

  const firstCompletions = await prisma.lessonCompletion.groupBy({
    by: ["childId"],
    _min: {
      completedAt: true,
    },
  });

  const firstCompletionChildIds = firstCompletions.map((item) => item.childId);
  const childRows =
    firstCompletionChildIds.length === 0
      ? []
      : await prisma.childProfile.findMany({
          where: {
            id: {
              in: firstCompletionChildIds,
            },
          },
          select: {
            id: true,
            createdAt: true,
          },
        });

  const childCreatedAtById = new Map(childRows.map((child) => [child.id, child.createdAt]));
  const daysToFirstLesson: number[] = [];

  for (const completion of firstCompletions) {
    if (!completion._min.completedAt) {
      continue;
    }

    const childCreatedAt = childCreatedAtById.get(completion.childId);
    if (!childCreatedAt) {
      continue;
    }

    daysToFirstLesson.push(
      Math.max(0, differenceInCalendarDays(completion._min.completedAt, childCreatedAt)),
    );
  }

  const avgDaysToFirstLesson =
    daysToFirstLesson.length > 0
      ? Number(
          (daysToFirstLesson.reduce((sum, current) => sum + current, 0) / daysToFirstLesson.length).toFixed(1),
        )
      : 0;

  const retentionRate =
    totalSubscriptionCount > 0 ? Number(((activeSubscriptionCount / totalSubscriptionCount) * 100).toFixed(1)) : 0;
  const avgLessonsPerChildPerWeek =
    childrenCount > 0 ? Number((lessons30dCount / childrenCount / (30 / 7)).toFixed(2)) : 0;

  return {
    newParents7d,
    newParents30d,
    churned30d,
    retentionRate,
    avgDaysToFirstLesson,
    avgLessonsPerChildPerWeek,
  };
}

export async function getAdminAnalyticsSnapshot(
  period: AdminAnalyticsPeriod = "30d",
): Promise<AdminAnalyticsSnapshot> {
  const days = periodToDays(period);
  const since = subDays(new Date(), days);

  const [
    totalChildren,
    activeChildrenRows,
    completedAggregate,
    topLessonCompletionRows,
    progressStates,
    retentionMetrics,
  ] = await Promise.all([
    prisma.childProfile.count(),
    prisma.lessonCompletion.groupBy({
      by: ["childId"],
      where: {
        completedAt: { gte: since },
      },
    }),
    prisma.lessonCompletion.aggregate({
      where: {
        completedAt: { gte: since },
      },
      _count: { _all: true },
      _sum: { minutesLearned: true },
    }),
    prisma.lessonCompletion.groupBy({
      by: ["lessonId"],
      where: {
        completedAt: { gte: since },
      },
      _count: { lessonId: true },
      _sum: { minutesLearned: true },
      orderBy: [{ _count: { lessonId: "desc" } }, { lessonId: "asc" }],
      take: 10,
    }),
    prisma.progressState.findMany({
      select: {
        childId: true,
        streakCount: true,
      },
    }),
    getAdminRetentionAnalytics(),
  ]);

  const topLessonIds = topLessonCompletionRows.map((row) => row.lessonId);
  const topLessonRows =
    topLessonIds.length === 0
      ? []
      : await prisma.lesson.findMany({
          where: {
            id: { in: topLessonIds },
          },
          select: {
            id: true,
            slug: true,
            title: true,
          },
        });

  const lessonById = new Map(topLessonRows.map((row) => [row.id, row]));
  const topLessons: AdminAnalyticsTopLesson[] = topLessonCompletionRows.map((row) => {
    const lesson = lessonById.get(row.lessonId);
    const completionCount = row._count.lessonId;
    const totalMinutes = row._sum.minutesLearned ?? 0;

    return {
      id: row.lessonId,
      slug: lesson?.slug ?? "",
      title: lesson?.title ?? "Unknown lesson",
      completionCount,
      avgMinutes: completionCount > 0 ? Number((totalMinutes / completionCount).toFixed(2)) : 0,
    };
  });

  const maxStreakByChild = new Map<string, number>();
  for (const progressState of progressStates) {
    const existingMax = maxStreakByChild.get(progressState.childId) ?? 0;
    if (progressState.streakCount > existingMax) {
      maxStreakByChild.set(progressState.childId, progressState.streakCount);
    }
  }

  let zero = Math.max(totalChildren - maxStreakByChild.size, 0);
  let low = 0;
  let medium = 0;
  let high = 0;

  for (const streakCount of maxStreakByChild.values()) {
    if (streakCount <= 0) {
      zero += 1;
      continue;
    }
    if (streakCount <= 3) {
      low += 1;
      continue;
    }
    if (streakCount <= 7) {
      medium += 1;
      continue;
    }
    high += 1;
  }

  const totalMinutes = completedAggregate._sum.minutesLearned ?? 0;
  const avgMinutesPerChildPerDay =
    totalChildren > 0 ? Number((totalMinutes / totalChildren / days).toFixed(2)) : 0;

  return {
    period,
    learningStats: {
      activeChildren: activeChildrenRows.length,
      totalLessonsCompleted: completedAggregate._count._all,
      avgMinutesPerChildPerDay,
    },
    streakBuckets: {
      zero,
      low,
      medium,
      high,
    },
    topLessons,
    retentionMetrics,
  };
}

export async function getAdminTopLessonsAnalytics(
  period: AdminAnalyticsPeriod = "30d",
): Promise<AdminAnalyticsTopLesson[]> {
  const snapshot = await getAdminAnalyticsSnapshot(period);
  return snapshot.topLessons;
}


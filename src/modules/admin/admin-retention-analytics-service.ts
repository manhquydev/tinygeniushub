import { SubscriptionStatus } from "@prisma/client";
import { differenceInCalendarDays, subDays } from "date-fns";
import { prisma } from "@/lib/db";

export type AdminRetentionAnalytics = {
  newParents7d: number;
  newParents30d: number;
  churned30d: number;
  retentionRate: number;
  avgDaysToFirstLesson: number;
  avgLessonsPerChildPerWeek: number;
};

export async function getAdminRetentionAnalytics(): Promise<AdminRetentionAnalytics> {
  const since7d = subDays(new Date(), 7);
  const since30d = subDays(new Date(), 30);

  const [newParents7d, newParents30d, churned30d, activeSubscriptionCount, totalSubscriptionCount, childrenCount, lessons30dCount] =
    await Promise.all([
      prisma.parentAccount.count({ where: { createdAt: { gte: since7d } } }),
      prisma.parentAccount.count({ where: { createdAt: { gte: since30d } } }),
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.CANCELED_AT_PERIOD_END,
          updatedAt: { gte: since30d },
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
      prisma.lessonCompletion.count({ where: { completedAt: { gte: since30d } } }),
    ]);

  const firstCompletions = await prisma.lessonCompletion.groupBy({
    by: ["childId"],
    _min: { completedAt: true },
  });

  const firstCompletionChildIds = firstCompletions.map((item) => item.childId);
  const childRows =
    firstCompletionChildIds.length === 0
      ? []
      : await prisma.childProfile.findMany({
          where: { id: { in: firstCompletionChildIds } },
          select: { id: true, createdAt: true },
        });

  const childCreatedAtById = new Map(childRows.map((child) => [child.id, child.createdAt]));
  const daysToFirstLesson: number[] = [];

  for (const completion of firstCompletions) {
    if (!completion._min.completedAt) continue;
    const childCreatedAt = childCreatedAtById.get(completion.childId);
    if (!childCreatedAt) continue;
    daysToFirstLesson.push(
      Math.max(0, differenceInCalendarDays(completion._min.completedAt, childCreatedAt)),
    );
  }

  const avgDaysToFirstLesson =
    daysToFirstLesson.length > 0
      ? Number((daysToFirstLesson.reduce((sum, current) => sum + current, 0) / daysToFirstLesson.length).toFixed(1))
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

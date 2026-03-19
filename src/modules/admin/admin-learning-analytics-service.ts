import { subDays } from "date-fns";
import { prisma } from "@/lib/db";
import { computeStreakBuckets, periodToDays, type AdminAnalyticsPeriod } from "./admin-analytics-shared-helpers";
import { getAdminRetentionAnalytics, type AdminRetentionAnalytics } from "./admin-retention-analytics-service";

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
      where: { completedAt: { gte: since7d } },
    }),
    prisma.lessonCompletion.groupBy({
      by: ["childId"],
      where: { completedAt: { gte: since30d } },
    }),
    prisma.lessonCompletion.aggregate({
      where: { completedAt: { gte: since30d } },
      _count: { _all: true },
      _sum: { minutesLearned: true },
    }),
    prisma.lessonCompletion.groupBy({
      by: ["lessonId"],
      where: { completedAt: { gte: since30d } },
      _count: { lessonId: true },
      orderBy: [{ _count: { lessonId: "desc" } }, { lessonId: "asc" }],
      take: 10,
    }),
    prisma.progressState.findMany({
      select: { childId: true, streakCount: true },
    }),
  ]);

  const topLessonIds = topLessonCompletionRows.map((row) => row.lessonId);
  const topLessonTitleRows =
    topLessonIds.length === 0
      ? []
      : await prisma.lesson.findMany({
          where: { id: { in: topLessonIds } },
          select: { id: true, title: true },
        });

  const titleByLessonId = new Map(topLessonTitleRows.map((lesson) => [lesson.id, lesson.title]));
  const topLessons = topLessonCompletionRows.map((row) => ({
    lessonId: row.lessonId,
    title: titleByLessonId.get(row.lessonId) ?? "Unknown lesson",
    completionCount: row._count.lessonId,
  }));

  const streakDistribution = computeStreakBuckets(totalChildren, progressStates);

  const totalMinutes30d = completedLessons30dAggregate._sum.minutesLearned ?? 0;
  const avgMinutesPerChildPerDay =
    totalChildren > 0 ? Number((totalMinutes30d / totalChildren / 30).toFixed(2)) : 0;

  return {
    activeChildrenLast7d: activeChildren7d.length,
    activeChildrenLast30d: activeChildren30d.length,
    totalLessonsCompleted30d: completedLessons30dAggregate._count._all,
    avgMinutesPerChildPerDay,
    topLessons,
    streakDistribution,
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
      where: { completedAt: { gte: since } },
    }),
    prisma.lessonCompletion.aggregate({
      where: { completedAt: { gte: since } },
      _count: { _all: true },
      _sum: { minutesLearned: true },
    }),
    prisma.lessonCompletion.groupBy({
      by: ["lessonId"],
      where: { completedAt: { gte: since } },
      _count: { lessonId: true },
      _sum: { minutesLearned: true },
      orderBy: [{ _count: { lessonId: "desc" } }, { lessonId: "asc" }],
      take: 10,
    }),
    prisma.progressState.findMany({
      select: { childId: true, streakCount: true },
    }),
    getAdminRetentionAnalytics(),
  ]);

  const topLessonIds = topLessonCompletionRows.map((row) => row.lessonId);
  const topLessonRows =
    topLessonIds.length === 0
      ? []
      : await prisma.lesson.findMany({
          where: { id: { in: topLessonIds } },
          select: { id: true, slug: true, title: true },
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

  const streakBuckets = computeStreakBuckets(totalChildren, progressStates);
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
    streakBuckets,
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

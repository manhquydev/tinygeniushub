import { subDays } from "date-fns";
import { prisma } from "@/lib/db";

export interface LessonPerformance {
  lessonId: string;
  title: string;
  totalViews: number;
  totalCompletions: number;
  completionRate: number;
  avgWatchTime: number;
  avgCompletionTime: number;
  totalTimeSpent: number;
  uniqueChildren: number;
  helpfulnessScore: number;
}

export interface TrackPerformance {
  trackId: string;
  title: string;
  lessonCount: number;
  totalCompletions: number;
  avgCompletionRate: number;
}

export interface ContentEngagementMetrics {
  totalLessons: number;
  totalTracks: number;
  totalCompletions30d: number;
  totalWatchTime30d: number;
  avgCompletionRate: number;
  avgWatchTime: number;
  topPerformingLessons: LessonPerformance[];
  underperformingLessons: LessonPerformance[];
}

export async function getLessonPerformance(
  lessonId: string,
  days: number = 30,
): Promise<LessonPerformance | null> {
  const since = subDays(new Date(), days);

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, title: true },
  });

  if (!lesson) return null;

  const completions = await prisma.lessonCompletion.findMany({
    where: {
      lessonId,
      completedAt: { gte: since },
    },
    select: {
      minutesLearned: true,
      childId: true,
    },
  });

  const uniqueChildren = new Set(completions.map((c) => c.childId)).size;
  const totalCompletions = completions.length;
  const totalTimeSpent = completions.reduce(
    (sum, c) => sum + (c.minutesLearned || 0),
    0,
  );

  const totalViews = totalCompletions;

  const avgWatchTime =
    totalCompletions > 0 ? totalTimeSpent / totalCompletions : 0;
  const completionRate = totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0;

  return {
    lessonId: lesson.id,
    title: lesson.title,
    totalViews,
    totalCompletions,
    completionRate,
    avgWatchTime,
    avgCompletionTime: avgWatchTime,
    totalTimeSpent,
    uniqueChildren,
    helpfulnessScore: 0,
  };
}

export async function getTopPerformingLessons(
  limit: number = 20,
  days: number = 30,
): Promise<LessonPerformance[]> {
  const since = subDays(new Date(), days);

  const topCompletions = await prisma.lessonCompletion.groupBy({
    by: ["lessonId"],
    where: { completedAt: { gte: since } },
    _count: { lessonId: true, _all: true },
    _sum: { minutesLearned: true },
    orderBy: [{ _count: { lessonId: "desc" } }],
    take: limit,
  });

  const lessonIds = topCompletions.map((c) => c.lessonId);
  const lessons = await prisma.lesson.findMany({
    where: { id: { in: lessonIds } },
    select: { id: true, title: true },
  });

  const lessonById = new Map(lessons.map((l) => [l.id, l]));

  return topCompletions.map((completion) => {
    const lesson = lessonById.get(completion.lessonId);
    const totalCompletions = completion._count.lessonId;
    const totalTime = completion._sum.minutesLearned || 0;

    return {
      lessonId: completion.lessonId,
      title: lesson?.title || "Unknown",
      totalViews: totalCompletions,
      totalCompletions,
      completionRate: 100,
      avgWatchTime: totalCompletions > 0 ? totalTime / totalCompletions : 0,
      avgCompletionTime: totalCompletions > 0 ? totalTime / totalCompletions : 0,
      totalTimeSpent: totalTime,
      uniqueChildren: totalCompletions,
      helpfulnessScore: 0,
    };
  });
}

export async function getContentEngagementMetrics(
  days: number = 30,
): Promise<ContentEngagementMetrics> {
  const since = subDays(new Date(), days);

  const [totalLessons, totalTracks, completionsAggregate, topLessons] =
    await Promise.all([
      prisma.lesson.count(),
      prisma.track.count(),
      prisma.lessonCompletion.aggregate({
        where: { completedAt: { gte: since } },
        _count: { _all: true },
        _sum: { minutesLearned: true },
      }),
      getTopPerformingLessons(10, days),
    ]);

  const totalCompletions = completionsAggregate._count._all;
  const totalWatchTime = completionsAggregate._sum.minutesLearned || 0;

  return {
    totalLessons,
    totalTracks,
    totalCompletions30d: totalCompletions,
    totalWatchTime30d: totalWatchTime,
    avgCompletionRate: 0,
    avgWatchTime: totalCompletions > 0 ? totalWatchTime / totalCompletions : 0,
    topPerformingLessons: topLessons,
    underperformingLessons: [],
  };
}

export async function getTrackPerformance(
  trackId: string,
  days: number = 30,
): Promise<TrackPerformance | null> {
  const since = subDays(new Date(), days);

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: { id: true, title: true },
  });

  if (!track) return null;

  // Get all lessons in this track through the relationship chain: Track -> Level -> Unit -> Lesson
  const lessonsInTrack = await prisma.lesson.findMany({
    where: {
      unit: {
        level: {
          trackId,
        },
      },
    },
    select: { id: true },
  });

  const lessonCount = lessonsInTrack.length;
  const lessonIds = lessonsInTrack.map((l) => l.id);

  const completions = await prisma.lessonCompletion.count({
    where: {
      lessonId: { in: lessonIds },
      completedAt: { gte: since },
    },
  });

  return {
    trackId: track.id,
    title: track.title,
    lessonCount,
    totalCompletions: completions,
    avgCompletionRate: 0,
  };
}

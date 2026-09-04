import { TrackCode } from "@prisma/client";
import { prisma } from "@/lib/db";

export type MissionTrack = Extract<TrackCode, "ENGLISH" | "MATH">;

export type MissionCard = {
  id: string;
  slug: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  videoSource: string | null;
  bunnyVideoId: string | null;
  videoStatus: string | null;
  trialEnabled: boolean;
  isCompleted: boolean;
  trackCode: string;
  unitTitle: string;
  journeyTitle?: string;
  tierIndex?: number;
};

const LESSON_SEQUENCE = [
  { unit: { level: { orderNo: "asc" as const } } },
  { unit: { orderNo: "asc" as const } },
  { orderNo: "asc" as const },
];

const lessonSelect = {
  id: true,
  slug: true,
  title: true,
  objective: true,
  estimatedMinutes: true,
  videoSource: true,
  bunnyVideoId: true,
  videoStatus: true,
  trialEnabled: true,
  unit: {
    select: {
      title: true,
      level: { select: { title: true, track: { select: { code: true } } } },
    },
  },
} as const;

async function findFirstLessonByTrack(input: {
  trackCode: MissionTrack;
  isTrial: boolean;
  excludeLessonIds: string[];
}) {
  return prisma.lesson.findFirst({
    where: {
      ...(input.isTrial ? { trialEnabled: true } : {}),
      ...(input.excludeLessonIds.length > 0 ? { id: { notIn: input.excludeLessonIds } } : {}),
      unit: { level: { track: { code: input.trackCode } } },
    },
    orderBy: LESSON_SEQUENCE,
    select: lessonSelect,
  });
}

export async function listEntitledTrackMissions(input: {
  childId: string;
  trackCodes: MissionTrack[];
  trialOnly: boolean;
}): Promise<MissionCard[]> {
  if (input.trackCodes.length === 0) {
    return [];
  }
  const completions = await prisma.lessonCompletion.findMany({
    where: { childId: input.childId },
    select: { lessonId: true },
  });
  const completedLessonIds = completions.map((row) => row.lessonId);
  const lessons = await Promise.all(
    input.trackCodes.map(async (trackCode) => {
      const nextIncomplete = await findFirstLessonByTrack({
        trackCode,
        isTrial: input.trialOnly,
        excludeLessonIds: completedLessonIds,
      });
      if (nextIncomplete) {
        return nextIncomplete;
      }
      return findFirstLessonByTrack({ trackCode, isTrial: input.trialOnly, excludeLessonIds: [] });
    }),
  );
  return lessons.filter((lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson)).map((lesson) => ({
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    objective: lesson.objective,
    estimatedMinutes: lesson.estimatedMinutes,
    videoSource: lesson.videoSource,
    bunnyVideoId: lesson.bunnyVideoId,
    videoStatus: lesson.videoStatus,
    trialEnabled: lesson.trialEnabled,
    isCompleted: completedLessonIds.includes(lesson.id),
    trackCode: lesson.unit.level.track.code,
    unitTitle: lesson.unit.title,
    journeyTitle: lesson.unit.level.track.code,
  }));
}

async function listWindowForCourse(input: {
  childId: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
}): Promise<MissionCard[]> {
  const firstUncompleted = await prisma.courseLesson.findFirst({
    where: {
      courseId: input.courseId,
      lesson: { completions: { none: { childId: input.childId } } },
    },
    orderBy: { orderNo: "asc" },
  });
  const currentOrderNo = firstUncompleted?.orderNo || 1;
  const courseLessons = await prisma.courseLesson.findMany({
    where: {
      courseId: input.courseId,
      orderNo: { gte: Math.max(1, currentOrderNo - 10), lte: currentOrderNo + 40 },
    },
    orderBy: { orderNo: "asc" },
    select: {
      orderNo: true,
      lesson: {
        select: {
          ...lessonSelect,
          completions: { where: { childId: input.childId }, select: { id: true }, take: 1 },
        },
      },
    },
  });
  return courseLessons.map((courseLesson) => {
    const lesson = courseLesson.lesson;
    return {
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      objective: lesson.objective,
      estimatedMinutes: lesson.estimatedMinutes,
      videoSource: lesson.videoSource,
      bunnyVideoId: lesson.bunnyVideoId,
      videoStatus: lesson.videoStatus,
      trialEnabled: lesson.trialEnabled,
      isCompleted: lesson.completions.length > 0,
      trackCode: input.courseSlug,
      unitTitle: lesson.unit.title,
      journeyTitle: input.courseTitle,
      tierIndex: courseLesson.orderNo,
    };
  });
}

export async function listEntitledCourseMissions(input: {
  childId: string;
  courseIds: string[];
}): Promise<MissionCard[]> {
  if (input.courseIds.length === 0) {
    return [];
  }
  const courses = await prisma.course.findMany({
    where: { id: { in: input.courseIds }, isPublished: true },
    select: { id: true, slug: true, title: true },
    orderBy: { id: "asc" },
  });
  const windows = await Promise.all(
    courses.map((course) =>
      listWindowForCourse({
        childId: input.childId,
        courseId: course.id,
        courseSlug: course.slug,
        courseTitle: course.title,
      }),
    ),
  );
  return windows.flat();
}

export function unionMissions(primary: MissionCard[], extra: MissionCard[]) {
  const byId = new Map<string, MissionCard>();
  for (const card of primary) {
    byId.set(card.id, card);
  }
  for (const card of extra) {
    if (!byId.has(card.id)) {
      byId.set(card.id, card);
    }
  }
  return [...byId.values()];
}

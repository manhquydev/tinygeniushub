import { SubscriptionStatus, TrackCode } from "@prisma/client";
import { prisma } from "@/lib/db";
import { parseActivitySpec, parseActivityType } from "@/modules/content/activity-types";
import { DomainError } from "@/modules/platform/errors";

type MissionTrack = Extract<TrackCode, "ENGLISH" | "MATH">;

function orderByLessonSequence() {
  return [
    { unit: { level: { orderNo: "asc" as const } } },
    { unit: { orderNo: "asc" as const } },
    { orderNo: "asc" as const },
  ];
}

async function findFirstLessonByTrack(input: {
  trackCode: MissionTrack;
  isTrial: boolean;
  excludeLessonIds: string[];
}) {
  return prisma.lesson.findFirst({
    where: {
      ...(input.isTrial ? { trialEnabled: true } : {}),
      ...(input.excludeLessonIds.length > 0
        ? {
            id: {
              notIn: input.excludeLessonIds,
            },
          }
        : {}),
      unit: {
        level: {
          track: {
            code: input.trackCode,
          },
        },
      },
    },
    orderBy: orderByLessonSequence(),
    select: {
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
          level: {
            select: {
              track: {
                select: {
                  code: true,
                },
              },
            },
          },
        },
      },
    },
  });
}

export async function getTodayMission(input: {
  parentId: string;
  childId: string;
  subscriptionStatus?: SubscriptionStatus | null;
}) {
  const child = await prisma.childProfile.findFirst({
    where: {
      id: input.childId,
      parentId: input.parentId,
    },
    select: {
      id: true,
    },
  });

  if (!child) {
    throw new DomainError("Child profile not found", 404, "CHILD_NOT_FOUND");
  }

  const isTrial = input.subscriptionStatus === SubscriptionStatus.TRIALING;
  const completions = await prisma.lessonCompletion.findMany({
    where: { childId: input.childId },
    select: { lessonId: true },
  });

  const completedLessonIds = completions.map((completion) => completion.lessonId);

  const [nextEnglish, nextMath] = await Promise.all(
    [TrackCode.ENGLISH, TrackCode.MATH].map(async (trackCode) => {
      const nextIncomplete = await findFirstLessonByTrack({
        trackCode,
        isTrial,
        excludeLessonIds: completedLessonIds,
      });
      if (nextIncomplete) {
        return nextIncomplete;
      }

      return findFirstLessonByTrack({
        trackCode,
        isTrial,
        excludeLessonIds: [],
      });
    }),
  );

  return [nextEnglish, nextMath]
    .filter((lesson): lesson is NonNullable<typeof lesson> => Boolean(lesson))
    .map((lesson) => ({
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
    }));
}

export async function listLessonActivitiesForPlayer(lessonId: string) {
  const activities = await prisma.activity.findMany({
    where: {
      lessonId,
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      type: true,
      prompt: true,
      spec: true,
      passCriteria: true,
    },
  });

  return activities.map((activity) => {
    const type = parseActivityType(activity.type);
    return {
      ...activity,
      type,
      spec: parseActivitySpec(activity.spec, type),
    };
  });
}

export async function getRealKidGardenMission(input: {
  parentId: string;
  childId: string;
}) {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { parentId: input.parentId, course: { isPublished: true } },
    orderBy: { enrolledAt: "asc" },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
        },
      },
    },
  });

  const coursesToLessons = await Promise.all(
    enrollments.map(async (enrollment) => {
      const firstUncompleted = await prisma.courseLesson.findFirst({
        where: {
          courseId: enrollment.courseId,
          lesson: {
            completions: {
              none: { childId: input.childId },
            },
          },
        },
        orderBy: { orderNo: "asc" },
      });

      const currentOrderNo = firstUncompleted?.orderNo || 1;
      const startOrderNo = Math.max(1, currentOrderNo - 10);
      const endOrderNo = currentOrderNo + 40;

      const courseLessons = await prisma.courseLesson.findMany({
        where: {
          courseId: enrollment.courseId,
          orderNo: {
            gte: startOrderNo,
            lte: endOrderNo,
          },
        },
        orderBy: { orderNo: "asc" },
        select: {
          orderNo: true,
          lesson: {
            select: {
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
                  level: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
              completions: {
                where: { childId: input.childId },
                select: { id: true },
                take: 1,
              },
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
          trackCode: enrollment.course.slug,
          unitTitle: lesson.unit.title,
          journeyTitle: enrollment.course.title,
          tierIndex: courseLesson.orderNo,
        };
      });
    }),
  );

  return coursesToLessons.flat();
}

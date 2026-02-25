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

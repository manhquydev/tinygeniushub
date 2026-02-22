import { SubscriptionStatus, TrackCode } from "@prisma/client";
import { prisma } from "@/lib/db";
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
      title: true,
      objective: true,
      estimatedMinutes: true,
      videoSource: true,
      trialEnabled: true,
      unit: {
        select: {
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
      title: lesson.title,
      objective: lesson.objective,
      estimatedMinutes: lesson.estimatedMinutes,
      videoSource: lesson.videoSource,
      trialEnabled: lesson.trialEnabled,
      trackCode: lesson.unit.level.track.code,
    }));
}

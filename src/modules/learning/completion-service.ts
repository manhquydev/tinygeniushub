import { RetentionPolicy, RewardType, SubscriptionStatus } from "@prisma/client";
import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";
import { prisma } from "@/lib/db";
import { isPrismaUniqueConstraintError } from "@/lib/prisma-error";
import { assertLessonVideoWatchCompleted } from "@/modules/learning/video-watch-service";
import { trackPilotLessonCompletedForParent } from "@/modules/courses/pilot-funnel-tracking-service";
import { DomainError } from "@/modules/platform/errors";
import { recordSkillAttempt } from "@/modules/adaptive/skill-attempt-service";
import { syncJourneyProgress } from "@/modules/garden/journey-service";
import { z } from "zod";

export const completeLessonSchema = z.object({
  childId: z.string().min(1),
  quizScore: z.number().int().min(0).max(100),
  minutesLearned: z.number().int().min(1).max(180).default(15),
  checklist: z.array(z.string().min(1)).min(1),
  useExtendedRetention: z.boolean().optional(),
});

export function computeStreakCount(params: {
  previousCompletionAt: Date | null;
  currentCompletionAt: Date;
  existingStreakCount: number;
}) {
  const { previousCompletionAt, currentCompletionAt, existingStreakCount } = params;

  if (!previousCompletionAt) {
    return 1;
  }

  const dayDiff = differenceInCalendarDays(startOfDay(currentCompletionAt), startOfDay(previousCompletionAt));

  if (dayDiff === 0) {
    return existingStreakCount;
  }

  if (dayDiff === 1) {
    return Math.max(existingStreakCount, 1) + 1;
  }

  return 1;
}

type JourneySyncImpact = {
  journeyId: string;
  completedLessonDelta: number;
  unlockedTierNos: number[];
  becameCompleted: boolean;
};

type JourneySyncSummary = {
  attempted: number;
  synced: number;
  failed: number;
  impacts: JourneySyncImpact[];
};

async function syncJourneysForCompletedLesson(params: {
  parentId: string;
  childId: string;
  lessonId: string;
}): Promise<JourneySyncSummary | null> {
  const journeys = await prisma.childCourseJourney.findMany({
    where: {
      childId: params.childId,
      course: {
        lessons: {
          some: {
            lessonId: params.lessonId,
          },
        },
      },
    },
    select: {
      id: true,
    },
  });

  if (journeys.length === 0) {
    return null;
  }

  const settled = await Promise.allSettled(
    journeys.map((journey) =>
      syncJourneyProgress({
        parentId: params.parentId,
        childId: params.childId,
        journeyId: journey.id,
      }),
    ),
  );

  const impacts: JourneySyncImpact[] = [];
  let failed = 0;

  for (let index = 0; index < settled.length; index += 1) {
    const item = settled[index];
    if (!item) continue;
    if (item.status === "fulfilled") {
      impacts.push({
        journeyId: journeys[index]!.id,
        completedLessonDelta: item.value.metrics.completedLessonDelta,
        unlockedTierNos: item.value.metrics.unlockedTierNos,
        becameCompleted: item.value.metrics.becameCompleted,
      });
      continue;
    }
    failed += 1;
  }

  return {
    attempted: journeys.length,
    synced: impacts.length,
    failed,
    impacts,
  };
}

export async function completeLesson(params: {
  parentId: string;
  lessonId: string;
  payload: z.infer<typeof completeLessonSchema>;
}) {
  const payload = completeLessonSchema.parse(params.payload);

  const [child, lesson, subscription] = await Promise.all([
    prisma.childProfile.findFirst({
      where: {
        id: payload.childId,
        parentId: params.parentId,
      },
      select: {
        id: true,
        parentId: true,
        adaptiveEnabled: true,
      },
    }),
    prisma.lesson.findUnique({
      where: { id: params.lessonId },
      include: {
        unit: {
          include: {
            level: {
              include: {
                track: true,
              },
            },
          },
        },
      },
    }),
    prisma.subscription.findUnique({ where: { parentId: params.parentId } }),
  ]);

  if (!child) {
    throw new DomainError("Child profile not found", 404, "CHILD_NOT_FOUND");
  }

  if (!lesson) {
    throw new DomainError("Lesson not found", 404, "LESSON_NOT_FOUND");
  }

  if (!subscription) {
    throw new DomainError("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND");
  }

  const activeStatuses = new Set<SubscriptionStatus>([
    SubscriptionStatus.TRIALING,
    SubscriptionStatus.ACTIVE_STANDARD,
    SubscriptionStatus.ACTIVE_FAMILYPLUS,
    SubscriptionStatus.GRACE,
    SubscriptionStatus.CANCELED_AT_PERIOD_END,
  ]);

  if (!activeStatuses.has(subscription.status)) {
    throw new DomainError("Subscription is not eligible for lesson completion", 403, "SUBSCRIPTION_INACTIVE");
  }

  if (subscription.status === SubscriptionStatus.TRIALING && !lesson.trialEnabled) {
    throw new DomainError("Trial account can only access trial-enabled lessons", 403, "TRIAL_LESSON_RESTRICTED");
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.lessonCompletion.findUnique({
        where: {
          childId_lessonId: {
            childId: payload.childId,
            lessonId: params.lessonId,
          },
        },
        include: {
          evidence: true,
        },
      });

      if (existing) {
        return {
          idempotent: true,
          completion: existing,
        };
      }

      await assertLessonVideoWatchCompleted({
        parentId: params.parentId,
        childId: payload.childId,
        lessonId: params.lessonId,
        requiresVideoWatch: Boolean(lesson.videoSource),
      });

      const completion = await tx.lessonCompletion.create({
        data: {
          childId: payload.childId,
          lessonId: params.lessonId,
          quizScore: payload.quizScore,
          minutesLearned: payload.minutesLearned,
          checklist: payload.checklist,
        },
      });

      const canUseExtendedRetention = subscription.portfolioRetentionMaxDays >= 365;
      const useExtendedRetention = payload.useExtendedRetention && canUseExtendedRetention;
      const retentionDays = useExtendedRetention ? 365 : 90;

      const evidence = await tx.evidence.create({
        data: {
          childId: payload.childId,
          lessonId: params.lessonId,
          completionId: completion.id,
          checklist: payload.checklist,
          quizScore: payload.quizScore,
          retentionPolicy: useExtendedRetention
            ? RetentionPolicy.EXTENDED_365D
            : RetentionPolicy.DEFAULT_90D,
          expiresAt: addDays(new Date(), retentionDays),
        },
      });

      await tx.rewardGrant.create({
        data: {
          childId: payload.childId,
          lessonId: params.lessonId,
          type: RewardType.LESSON_COMPLETED,
          name: "lesson_completed",
        },
      });

      const previousCompletion = await tx.lessonCompletion.findFirst({
        where: {
          childId: payload.childId,
          NOT: {
            id: completion.id,
          },
        },
        orderBy: {
          completedAt: "desc",
        },
      });

      const existingProgress = await tx.progressState.findUnique({
        where: {
          childId_trackCode: {
            childId: payload.childId,
            trackCode: lesson.unit.level.track.code,
          },
        },
      });

      const streakCount = computeStreakCount({
        previousCompletionAt: previousCompletion?.completedAt ?? null,
        currentCompletionAt: completion.completedAt,
        existingStreakCount: existingProgress?.streakCount ?? 1,
      });

      await tx.progressState.upsert({
        where: {
          childId_trackCode: {
            childId: payload.childId,
            trackCode: lesson.unit.level.track.code,
          },
        },
        create: {
          childId: payload.childId,
          trackCode: lesson.unit.level.track.code,
          currentLevelId: lesson.unit.level.id,
          currentUnitId: lesson.unit.id,
          lastLessonCompletedAt: completion.completedAt,
          streakCount,
        },
        update: {
          currentLevelId: lesson.unit.level.id,
          currentUnitId: lesson.unit.id,
          lastLessonCompletedAt: completion.completedAt,
          streakCount,
        },
      });

      return {
        idempotent: false,
        completion,
        evidence,
      };
    });

    // After transaction: record skill attempts for adaptive learning
    if (!result.idempotent && child.adaptiveEnabled) {
      const lessonSkills = await prisma.lessonSkill.findMany({
        where: { lessonId: params.lessonId },
        select: { skillId: true, isPrimary: true },
      });

      const isCorrect = payload.quizScore >= 80;

      // Fire-and-forget: don't block response on skill recording
      Promise.all(
        lessonSkills.map((ls) =>
          recordSkillAttempt({
            childId: payload.childId,
            skillId: ls.skillId,
            isCorrect,
          }).catch(() => {
            // Non-critical: log silently
          }),
        ),
      ).catch(() => {});
    }

    if (!result.idempotent) {
      const journeySync = await syncJourneysForCompletedLesson({
        parentId: params.parentId,
        childId: payload.childId,
        lessonId: params.lessonId,
      });

      await trackPilotLessonCompletedForParent({
        parentId: params.parentId,
        childId: payload.childId,
        lessonId: params.lessonId,
        completionId: result.completion.id,
      });

      return {
        ...result,
        journeySync,
      };
    }

    return result;
  } catch (error) {
    if (isPrismaUniqueConstraintError(error, ["childid", "lessonid"])) {
      const existing = await prisma.lessonCompletion.findUnique({
        where: {
          childId_lessonId: {
            childId: payload.childId,
            lessonId: params.lessonId,
          },
        },
        include: {
          evidence: true,
        },
      });

      if (existing) {
        return {
          idempotent: true,
          completion: existing,
        };
      }
    }

    throw error;
  }
}

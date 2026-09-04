import { RetentionPolicy, SubscriptionStatus } from "@prisma/client";
import { subDays } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  prismaMock,
  assertLessonVideoWatchCompletedMock,
  isPrismaUniqueConstraintErrorMock,
  syncJourneyProgressMock,
  assertCanLearnMock,
} = vi.hoisted(() => ({
  prismaMock: {
    childProfile: {
      findFirst: vi.fn(),
    },
    lesson: {
      findUnique: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
    },
    lessonCompletion: {
      findUnique: vi.fn(),
    },
    childCourseJourney: {
      findMany: vi.fn(),
    },
    course: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    $transaction: vi.fn(),
  },
  assertLessonVideoWatchCompletedMock: vi.fn(),
  isPrismaUniqueConstraintErrorMock: vi.fn(),
  syncJourneyProgressMock: vi.fn(),
  assertCanLearnMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/prisma-error", () => ({
  isPrismaUniqueConstraintError: isPrismaUniqueConstraintErrorMock,
}));

vi.mock("@/modules/garden/journey-service", () => ({
  syncJourneyProgress: syncJourneyProgressMock,
}));
vi.mock("@/modules/entitlement/assert-can-learn", () => ({
  assertCanLearn: assertCanLearnMock,
}));

vi.mock("@/modules/learning/video-watch-service", async () => {
  const actual = await vi.importActual<typeof import("@/modules/learning/video-watch-service")>(
    "@/modules/learning/video-watch-service",
  );
  return {
    ...actual,
    assertLessonVideoWatchCompleted: assertLessonVideoWatchCompletedMock,
  };
});

import { DomainError } from "@/modules/platform/errors";
import { completeLesson, computeStreakCount } from "@/modules/learning/completion-service";

type TxContext = {
  lessonCompletion: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
  };
  evidence: {
    create: ReturnType<typeof vi.fn>;
  };
  rewardGrant: {
    create: ReturnType<typeof vi.fn>;
  };
  progressState: {
    findUnique: ReturnType<typeof vi.fn>;
    upsert: ReturnType<typeof vi.fn>;
  };
};

function createTxContext(): TxContext {
  return {
    lessonCompletion: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
    },
    evidence: {
      create: vi.fn(),
    },
    rewardGrant: {
      create: vi.fn(),
    },
    progressState: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  };
}

const lessonFixture = {
  id: "lesson-1",
  trialEnabled: true,
  videoSource: "https://cdn.example.com/video.mp4",
  unit: {
    id: "unit-1",
    level: {
      id: "level-1",
      track: {
        code: "MATH",
      },
    },
  },
};

describe("computeStreakCount", () => {
  it("starts streak at 1 when no previous completion", () => {
    expect(
      computeStreakCount({
        previousCompletionAt: null,
        currentCompletionAt: new Date("2026-02-20T10:00:00.000Z"),
        existingStreakCount: 0,
      }),
    ).toBe(1);
  });

  it("keeps streak when completion happens on same day", () => {
    expect(
      computeStreakCount({
        previousCompletionAt: new Date("2026-02-20T07:00:00"),
        currentCompletionAt: new Date("2026-02-20T22:00:00"),
        existingStreakCount: 3,
      }),
    ).toBe(3);
  });

  it("increments streak when completion happens next day", () => {
    expect(
      computeStreakCount({
        previousCompletionAt: subDays(new Date("2026-02-20T22:00:00.000Z"), 1),
        currentCompletionAt: new Date("2026-02-20T22:00:00.000Z"),
        existingStreakCount: 3,
      }),
    ).toBe(4);
  });

  it("resets streak when completion gap is more than one day", () => {
    expect(
      computeStreakCount({
        previousCompletionAt: subDays(new Date("2026-02-20T22:00:00.000Z"), 3),
        currentCompletionAt: new Date("2026-02-20T22:00:00.000Z"),
        existingStreakCount: 7,
      }),
    ).toBe(1);
  });
});

describe("completeLesson", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    prismaMock.childProfile.findFirst.mockResolvedValue({
      id: "child-1",
      parentId: "parent-1",
    });
    prismaMock.lesson.findUnique.mockResolvedValue(lessonFixture);
    prismaMock.subscription.findUnique.mockResolvedValue({
      status: SubscriptionStatus.ACTIVE_STANDARD,
      portfolioRetentionMaxDays: 365,
    });
    prismaMock.childCourseJourney.findMany.mockResolvedValue([]);
    assertCanLearnMock.mockResolvedValue({
      child: { id: "child-1", parentId: "parent-1", adaptiveEnabled: false },
      lesson: lessonFixture,
    });
    assertLessonVideoWatchCompletedMock.mockResolvedValue(undefined);
    isPrismaUniqueConstraintErrorMock.mockReturnValue(false);
    syncJourneyProgressMock.mockResolvedValue({
      metrics: {
        completedLessonDelta: 0,
        unlockedTierNos: [],
        becameCompleted: false,
      },
    });
  });

  it("returns CHILD_NOT_FOUND when child does not belong to parent", async () => {
    assertCanLearnMock.mockRejectedValueOnce(new DomainError("Child profile not found", 404, "CHILD_NOT_FOUND"));

    await expect(
      completeLesson({
        parentId: "parent-1",
        lessonId: "lesson-1",
        payload: {
          childId: "child-1",
          quizScore: 90,
          minutesLearned: 15,
          checklist: ["task-1"],
        },
      }),
    ).rejects.toMatchObject({
      code: "CHILD_NOT_FOUND",
      status: 404,
    });
  });

  it("returns idempotent completion when child already completed lesson", async () => {
    const tx = createTxContext();
    tx.lessonCompletion.findUnique.mockResolvedValueOnce({
      id: "completion-existing",
      evidence: { id: "evidence-existing" },
    });
    prismaMock.$transaction.mockImplementationOnce(
      async (callback: (input: TxContext) => Promise<unknown>) => callback(tx),
    );

    const result = await completeLesson({
      parentId: "parent-1",
      lessonId: "lesson-1",
      payload: {
        childId: "child-1",
        quizScore: 90,
        minutesLearned: 15,
        checklist: ["task-1"],
      },
    });

    expect(result).toEqual({
      idempotent: true,
      completion: {
        id: "completion-existing",
        evidence: { id: "evidence-existing" },
      },
    });
    expect(assertLessonVideoWatchCompletedMock).not.toHaveBeenCalled();
  });

  it("creates completion + evidence + reward + progress on first completion", async () => {
    const tx = createTxContext();
    tx.lessonCompletion.findUnique.mockResolvedValueOnce(null);
    tx.lessonCompletion.create.mockResolvedValueOnce({
      id: "completion-1",
      completedAt: new Date("2026-02-20T10:00:00.000Z"),
    });
    tx.evidence.create.mockResolvedValueOnce({
      id: "evidence-1",
    });
    tx.rewardGrant.create.mockResolvedValueOnce({
      id: "reward-1",
    });
    tx.lessonCompletion.findFirst.mockResolvedValueOnce({
      id: "completion-prev",
      completedAt: new Date("2026-02-19T10:00:00.000Z"),
    });
    tx.progressState.findUnique.mockResolvedValueOnce({
      streakCount: 2,
    });
    tx.progressState.upsert.mockResolvedValueOnce({
      id: "progress-1",
    });
    prismaMock.$transaction.mockImplementationOnce(
      async (callback: (input: TxContext) => Promise<unknown>) => callback(tx),
    );

    const result = await completeLesson({
      parentId: "parent-1",
      lessonId: "lesson-1",
      payload: {
        childId: "child-1",
        quizScore: 95,
        minutesLearned: 20,
        checklist: ["task-1", "task-2"],
        useExtendedRetention: true,
      },
    });

    expect(result).toMatchObject({
      idempotent: false,
      completion: {
        id: "completion-1",
      },
      evidence: {
        id: "evidence-1",
      },
    });
    expect(assertLessonVideoWatchCompletedMock).toHaveBeenCalledWith({
      parentId: "parent-1",
      childId: "child-1",
      lessonId: "lesson-1",
      requiresVideoWatch: true,
    });
    expect(tx.evidence.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          retentionPolicy: RetentionPolicy.EXTENDED_365D,
        }),
      }),
    );
    expect(tx.progressState.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          streakCount: 3,
        }),
      }),
    );
  });

  it("blocks trial users from non-trial lessons", async () => {
    assertCanLearnMock.mockRejectedValueOnce(
      new DomainError("Trial account can only access trial-enabled lessons", 403, "TRIAL_LESSON_RESTRICTED"),
    );

    await expect(
      completeLesson({
        parentId: "parent-1",
        lessonId: "lesson-1",
        payload: {
          childId: "child-1",
          quizScore: 95,
          minutesLearned: 20,
          checklist: ["task-1", "task-2"],
        },
      }),
    ).rejects.toMatchObject({
      code: "TRIAL_LESSON_RESTRICTED",
      status: 403,
    });
  });

  it("denies complete without a household ticket", async () => {
    assertCanLearnMock.mockRejectedValueOnce(
      new DomainError("Household ticket required to learn this lesson", 403, "LEARN_ACCESS_DENIED"),
    );

    await expect(
      completeLesson({
        parentId: "parent-1",
        lessonId: "lesson-1",
        payload: {
          childId: "child-1",
          quizScore: 95,
          minutesLearned: 20,
          checklist: ["task-1"],
        },
      }),
    ).rejects.toMatchObject({
      code: "LEARN_ACCESS_DENIED",
      status: 403,
    });
  });

  it("stores independent completions for two children in the same household", async () => {
    assertCanLearnMock.mockImplementation(async ({ childId }: { childId: string }) => ({
      child: { id: childId, parentId: "parent-1", adaptiveEnabled: false },
      lesson: lessonFixture,
    }));

    async function completeFor(childId: string, completionId: string) {
      const tx = createTxContext();
      tx.lessonCompletion.findUnique.mockResolvedValueOnce(null);
      tx.lessonCompletion.create.mockResolvedValueOnce({
        id: completionId,
        completedAt: new Date("2026-02-20T10:00:00.000Z"),
      });
      tx.evidence.create.mockResolvedValueOnce({ id: `evidence-${childId}` });
      tx.rewardGrant.create.mockResolvedValueOnce({ id: `reward-${childId}` });
      tx.lessonCompletion.findFirst.mockResolvedValueOnce(null);
      tx.progressState.findUnique.mockResolvedValueOnce({ streakCount: 0 });
      tx.progressState.upsert.mockResolvedValueOnce({ id: `progress-${childId}` });
      prismaMock.$transaction.mockImplementationOnce(
        async (callback: (input: TxContext) => Promise<unknown>) => callback(tx),
      );

      const result = await completeLesson({
        parentId: "parent-1",
        lessonId: "lesson-1",
        payload: {
          childId,
          quizScore: 90,
          minutesLearned: 15,
          checklist: ["task-1"],
        },
      });

      expect(tx.lessonCompletion.findUnique).toHaveBeenCalledWith({
        where: { childId_lessonId: { childId, lessonId: "lesson-1" } },
        include: { evidence: true },
      });
      expect(tx.lessonCompletion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ childId, lessonId: "lesson-1" }),
      });
      return result;
    }

    await expect(completeFor("child-a", "completion-a")).resolves.toMatchObject({
      idempotent: false,
      completion: { id: "completion-a" },
    });
    await expect(completeFor("child-b", "completion-b")).resolves.toMatchObject({
      idempotent: false,
      completion: { id: "completion-b" },
    });
  });

  it("returns idempotent result on unique constraint race fallback", async () => {
    const uniqueError = new Error("duplicate child/lesson");
    prismaMock.$transaction.mockRejectedValueOnce(uniqueError);
    isPrismaUniqueConstraintErrorMock.mockReturnValueOnce(true);
    prismaMock.lessonCompletion.findUnique.mockResolvedValueOnce({
      id: "completion-race",
      evidence: { id: "evidence-race" },
    });

    const result = await completeLesson({
      parentId: "parent-1",
      lessonId: "lesson-1",
      payload: {
        childId: "child-1",
        quizScore: 95,
        minutesLearned: 20,
        checklist: ["task-1", "task-2"],
      },
    });

    expect(result).toEqual({
      idempotent: true,
      completion: {
        id: "completion-race",
        evidence: { id: "evidence-race" },
      },
    });
    expect(isPrismaUniqueConstraintErrorMock).toHaveBeenCalledWith(uniqueError, ["childid", "lessonid"]);
  });

  it("syncs related course journeys after a new completion", async () => {
    const tx = createTxContext();
    tx.lessonCompletion.findUnique.mockResolvedValueOnce(null);
    tx.lessonCompletion.create.mockResolvedValueOnce({
      id: "completion-1",
      completedAt: new Date("2026-02-20T10:00:00.000Z"),
    });
    tx.evidence.create.mockResolvedValueOnce({
      id: "evidence-1",
    });
    tx.rewardGrant.create.mockResolvedValueOnce({
      id: "reward-1",
    });
    tx.lessonCompletion.findFirst.mockResolvedValueOnce(null);
    tx.progressState.findUnique.mockResolvedValueOnce({
      streakCount: 1,
    });
    tx.progressState.upsert.mockResolvedValueOnce({
      id: "progress-1",
    });
    prismaMock.$transaction.mockImplementationOnce(
      async (callback: (input: TxContext) => Promise<unknown>) => callback(tx),
    );

    prismaMock.childCourseJourney.findMany.mockResolvedValueOnce([
      { id: "journey-1" },
      { id: "journey-2" },
    ]);
    syncJourneyProgressMock.mockResolvedValueOnce({
      metrics: {
        completedLessonDelta: 1,
        unlockedTierNos: [2],
        becameCompleted: false,
      },
    });
    syncJourneyProgressMock.mockRejectedValueOnce(new Error("sync failed"));

    const result = await completeLesson({
      parentId: "parent-1",
      lessonId: "lesson-1",
      payload: {
        childId: "child-1",
        quizScore: 90,
        minutesLearned: 15,
        checklist: ["task-1"],
      },
    });

    expect(result).toMatchObject({
      idempotent: false,
      journeySync: {
        attempted: 2,
        synced: 1,
        failed: 1,
        impacts: [
          {
            journeyId: "journey-1",
            completedLessonDelta: 1,
            unlockedTierNos: [2],
            becameCompleted: false,
          },
        ],
      },
    });
    expect(syncJourneyProgressMock).toHaveBeenCalledWith({
      parentId: "parent-1",
      childId: "child-1",
      journeyId: "journey-1",
    });
    expect(syncJourneyProgressMock).toHaveBeenCalledWith({
      parentId: "parent-1",
      childId: "child-1",
      journeyId: "journey-2",
    });
  });
});

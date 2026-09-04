import { PlanCode, SubscriptionStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/modules/platform/errors";

const { prismaMock, canAccessMock } = vi.hoisted(() => ({
  prismaMock: {
    childProfile: { findFirst: vi.fn() },
    lesson: { findUnique: vi.fn() },
    subscription: { findUnique: vi.fn() },
    entitlement: { findMany: vi.fn() },
  },
  canAccessMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/modules/entitlement/entitlement-service", () => ({
  canAccess: canAccessMock,
}));

import { assertCanLearn, loadHouseholdLearnAccess } from "@/modules/entitlement/assert-can-learn";

const parentId = "parent-1";
const lessonId = "lesson-1";
const child = { id: "child-a", parentId, adaptiveEnabled: false };
const lesson = {
  id: lessonId,
  trialEnabled: false,
  estimatedMinutes: 10,
  videoSource: null,
};

describe("assertCanLearn", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.childProfile.findFirst.mockResolvedValue(child);
    prismaMock.lesson.findUnique.mockResolvedValue(lesson);
    prismaMock.subscription.findUnique.mockResolvedValue(null);
    canAccessMock.mockResolvedValue(false);
  });

  it("allows both children of a household with a ticket", async () => {
    canAccessMock.mockResolvedValue(true);
    prismaMock.childProfile.findFirst.mockImplementation(
      async ({ where }: { where: { id: string; parentId: string } }) =>
        where.parentId === parentId ? { ...child, id: where.id } : null,
    );

    await expect(assertCanLearn({ parentId, childId: "child-a", lessonId })).resolves.toMatchObject({
      child: { id: "child-a" },
    });
    await expect(assertCanLearn({ parentId, childId: "child-b", lessonId })).resolves.toMatchObject({
      child: { id: "child-b" },
    });
  });

  it("denies complete without a household ticket", async () => {
    prismaMock.subscription.findUnique.mockResolvedValueOnce({
      status: SubscriptionStatus.TRIALING,
      planCode: PlanCode.TRIAL,
    });
    await expect(assertCanLearn({ parentId, childId: "child-a", lessonId })).rejects.toMatchObject({
      code: "LEARN_ACCESS_DENIED",
      status: 403,
    } satisfies Partial<DomainError>);
    expect(canAccessMock).toHaveBeenCalledWith({ parentId, lessonId });
  });

  it("denies a course enrollment without a ticket", async () => {
    await expect(assertCanLearn({ parentId, childId: "child-a", lessonId })).rejects.toMatchObject({
      code: "LEARN_ACCESS_DENIED",
      status: 403,
    } satisfies Partial<DomainError>);
  });

  it("allows trialEnabled lessons when the household trial ticket is ACTIVE", async () => {
    canAccessMock.mockResolvedValueOnce(true);
    prismaMock.lesson.findUnique.mockResolvedValueOnce({ ...lesson, trialEnabled: true });
    prismaMock.subscription.findUnique.mockResolvedValueOnce({
      status: SubscriptionStatus.TRIALING,
      planCode: PlanCode.TRIAL,
    });
    await expect(assertCanLearn({ parentId, childId: "child-a", lessonId })).resolves.toMatchObject({
      lesson: { trialEnabled: true },
    });
  });

  it("restricts trial households from non-trial lessons even with a pass ticket", async () => {
    canAccessMock.mockResolvedValueOnce(true);
    prismaMock.subscription.findUnique.mockResolvedValueOnce({
      status: SubscriptionStatus.TRIALING,
      planCode: PlanCode.TRIAL,
    });
    await expect(assertCanLearn({ parentId, childId: "child-a", lessonId })).rejects.toMatchObject({
      code: "TRIAL_LESSON_RESTRICTED",
      status: 403,
    });
  });
});

describe("loadHouseholdLearnAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.entitlement.findMany.mockResolvedValue([]);
    prismaMock.subscription.findUnique.mockResolvedValue(null);
  });

  it("uses ticket catalog keys for tracks and course ids, not enrollments", async () => {
    prismaMock.entitlement.findMany.mockResolvedValueOnce([
      {
        validFrom: new Date("2020-01-01"),
        validUntil: null,
        offering: { catalogKey: "platform:pass" },
      },
      {
        validFrom: new Date("2020-01-01"),
        validUntil: null,
        offering: { catalogKey: "course:course-2" },
      },
    ]);
    prismaMock.subscription.findUnique.mockResolvedValueOnce({
      status: SubscriptionStatus.ACTIVE_STANDARD,
      planCode: PlanCode.YEARLY_STANDARD,
    });

    await expect(loadHouseholdLearnAccess(parentId)).resolves.toMatchObject({
      hasPlatformPass: true,
      hasPaidPlatformPass: true,
      isTrialHousehold: false,
      trackCodes: ["ENGLISH", "MATH"],
      courseIds: ["course-2"],
    });
  });
});

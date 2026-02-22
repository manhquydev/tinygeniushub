import { PaymentStatus, WebhookStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, createAuditLogMock } = vi.hoisted(() => ({
  prismaMock: {
    parentAccount: {
      count: vi.fn(),
    },
    childProfile: {
      count: vi.fn(),
    },
    subscription: {
      groupBy: vi.fn(),
    },
    paymentRecord: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    webhookEvent: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    referralCode: {
      count: vi.fn(),
    },
    referralAttribution: {
      count: vi.fn(),
    },
    lesson: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
  createAuditLogMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/modules/platform/audit-service", () => ({
  createAuditLog: createAuditLogMock,
}));

import {
  adminLessonTrialFlagSchema,
  adminPaymentQuerySchema,
  adminWebhookQuerySchema,
  getAdminOverview,
  listPaymentRecordsAdmin,
  listWebhookEventsAdmin,
  updateLessonTrialFlagAdmin,
} from "@/modules/admin/service";

describe("adminPaymentQuerySchema", () => {
  it("applies default limit", () => {
    const parsed = adminPaymentQuerySchema.parse({});
    expect(parsed.limit).toBe(20);
  });

  it("rejects out-of-range limit", () => {
    expect(() => adminPaymentQuerySchema.parse({ limit: "0" })).toThrow();
    expect(() => adminPaymentQuerySchema.parse({ limit: "999" })).toThrow();
  });
});

describe("adminWebhookQuerySchema", () => {
  it("accepts known status filter", () => {
    const parsed = adminWebhookQuerySchema.parse({ status: "PROCESSED" });
    expect(parsed.status).toBe("PROCESSED");
  });
});

describe("adminLessonTrialFlagSchema", () => {
  it("requires trialEnabled boolean", () => {
    expect(adminLessonTrialFlagSchema.parse({ trialEnabled: true })).toEqual({ trialEnabled: true });
    expect(() => adminLessonTrialFlagSchema.parse({ trialEnabled: "true" })).toThrow();
  });
});

describe("getAdminOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.parentAccount.count.mockResolvedValue(10);
    prismaMock.childProfile.count.mockResolvedValue(16);
    prismaMock.subscription.groupBy.mockResolvedValue([
      { status: "TRIALING", _count: { _all: 4 } },
      { status: "ACTIVE_STANDARD", _count: { _all: 6 } },
    ]);
    prismaMock.paymentRecord.aggregate.mockResolvedValue({
      _count: { _all: 11 },
      _sum: { amountVnd: 9_900_000 },
    });
    prismaMock.webhookEvent.groupBy.mockResolvedValue([
      { status: "PROCESSED", _count: { _all: 8 } },
      { status: "FAILED", _count: { _all: 2 } },
    ]);
    prismaMock.paymentRecord.findMany.mockResolvedValue([{ id: "pay-1" }]);
    prismaMock.webhookEvent.findMany.mockResolvedValue([{ id: "wh-1" }]);
    prismaMock.referralCode.count.mockResolvedValue(7);
    prismaMock.referralAttribution.count
      .mockResolvedValueOnce(13)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3);
  });

  it("aggregates dashboard stats and maps grouped status counts", async () => {
    const result = await getAdminOverview();

    expect(result.counts).toEqual({
      parents: 10,
      children: 16,
      successfulPayments30d: 11,
      successfulRevenueVnd30d: 9_900_000,
      referralCodes: 7,
      referralAttributions: 13,
      paidReferrals: 5,
      rewardedReferrals: 3,
    });
    expect(result.subscriptionsByStatus).toEqual({
      TRIALING: 4,
      ACTIVE_STANDARD: 6,
    });
    expect(result.webhooksByStatus).toEqual({
      PROCESSED: 8,
      FAILED: 2,
    });
    expect(result.recentPayments).toEqual([{ id: "pay-1" }]);
    expect(result.recentWebhookEvents).toEqual([{ id: "wh-1" }]);
  });
});

describe("listPaymentRecordsAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries payments with optional status filter and limit", async () => {
    prismaMock.paymentRecord.findMany.mockResolvedValue([{ id: "pay-1" }]);

    const result = await listPaymentRecordsAdmin({
      limit: "5",
      status: PaymentStatus.SUCCEEDED,
    });

    expect(result).toEqual([{ id: "pay-1" }]);
    expect(prismaMock.paymentRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: PaymentStatus.SUCCEEDED },
        take: 5,
      }),
    );
  });

  it("uses default limit when omitted", async () => {
    prismaMock.paymentRecord.findMany.mockResolvedValue([]);

    await listPaymentRecordsAdmin({});

    expect(prismaMock.paymentRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 20,
      }),
    );
  });
});

describe("listWebhookEventsAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries webhook events with optional status filter and limit", async () => {
    prismaMock.webhookEvent.findMany.mockResolvedValue([{ id: "wh-1" }]);

    const result = await listWebhookEventsAdmin({
      limit: 8,
      status: WebhookStatus.PROCESSED,
    });

    expect(result).toEqual([{ id: "wh-1" }]);
    expect(prismaMock.webhookEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: WebhookStatus.PROCESSED },
        take: 8,
      }),
    );
  });
});

describe("updateLessonTrialFlagAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAuditLogMock.mockResolvedValue(undefined);
  });

  it("throws LESSON_NOT_FOUND when lesson does not exist", async () => {
    prismaMock.lesson.findUnique.mockResolvedValueOnce(null);

    await expect(
      updateLessonTrialFlagAdmin({
        lessonId: "lesson-missing",
        actorId: "admin-1",
        input: { trialEnabled: true },
      }),
    ).rejects.toMatchObject({
      code: "LESSON_NOT_FOUND",
      status: 404,
    });

    expect(prismaMock.lesson.update).not.toHaveBeenCalled();
    expect(createAuditLogMock).not.toHaveBeenCalled();
  });

  it("updates trial flag and writes audit log", async () => {
    prismaMock.lesson.findUnique.mockResolvedValueOnce({
      id: "lesson-1",
      slug: "alphabet-1",
      trialEnabled: false,
    });
    prismaMock.lesson.update.mockResolvedValueOnce({
      id: "lesson-1",
      slug: "alphabet-1",
      title: "Alphabet",
      trialEnabled: true,
    });

    const result = await updateLessonTrialFlagAdmin({
      lessonId: "lesson-1",
      actorId: "admin-1",
      input: { trialEnabled: true },
    });

    expect(result).toEqual({
      id: "lesson-1",
      slug: "alphabet-1",
      title: "Alphabet",
      trialEnabled: true,
    });
    expect(prismaMock.lesson.update).toHaveBeenCalledWith({
      where: { id: "lesson-1" },
      data: {
        trialEnabled: true,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        trialEnabled: true,
      },
    });
    expect(createAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: "admin",
        actorId: "admin-1",
        action: "content.lesson.trial_flag.updated",
        resourceId: "lesson-1",
        metadata: {
          slug: "alphabet-1",
          previousTrialEnabled: false,
          nextTrialEnabled: true,
        },
      }),
    );
  });
});

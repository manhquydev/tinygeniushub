import { PaymentStatus, SubscriptionStatus, WebhookStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, createAuditLogMock, createNotificationForParentMock, resolveUserIdForParentMock } = vi.hoisted(
  () => ({
  prismaMock: {
    parentAccount: {
      count: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    childProfile: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    subscription: {
      groupBy: vi.fn(),
      count: vi.fn(),
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
      findMany: vi.fn(),
    },
    lessonCompletion: {
      count: vi.fn(),
      aggregate: vi.fn(),
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    progressState: {
      findMany: vi.fn(),
    },
    adminActionLog: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      findMany: vi.fn(),
    },
  },
  createAuditLogMock: vi.fn(),
  createNotificationForParentMock: vi.fn(),
  resolveUserIdForParentMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/modules/platform/audit-service", () => ({
  createAuditLog: createAuditLogMock,
}));

vi.mock("@/modules/platform/notification-service", () => ({
  createNotificationForParent: createNotificationForParentMock,
  resolveUserIdForParent: resolveUserIdForParentMock,
}));

import {
  adminLessonTrialFlagSchema,
  adminPaymentQuerySchema,
  adminWebhookQuerySchema,
  createAdminActionLog,
  executeAdminBulkUsersAction,
  getAdminActionLogs,
  getAdminUnifiedLogs,
  getAdminLearningAnalytics,
  getAdminOverview,
  getAdminRetentionAnalytics,
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

describe("getAdminLearningAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns zeros when there is no data", async () => {
    prismaMock.childProfile.count.mockResolvedValue(0);
    prismaMock.lessonCompletion.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    prismaMock.lessonCompletion.aggregate.mockResolvedValue({
      _count: { _all: 0 },
      _sum: { minutesLearned: null },
    });
    prismaMock.progressState.findMany.mockResolvedValue([]);

    const result = await getAdminLearningAnalytics();

    expect(result).toEqual({
      activeChildrenLast7d: 0,
      activeChildrenLast30d: 0,
      totalLessonsCompleted30d: 0,
      avgMinutesPerChildPerDay: 0,
      topLessons: [],
      streakDistribution: {
        zero: 0,
        low: 0,
        medium: 0,
        high: 0,
      },
    });
    expect(prismaMock.lesson.findMany).not.toHaveBeenCalled();
  });

  it("correctly calculates activeChildrenLast7d from distinct childId count", async () => {
    prismaMock.childProfile.count.mockResolvedValue(4);
    prismaMock.lessonCompletion.groupBy
      .mockResolvedValueOnce([{ childId: "child-1" }, { childId: "child-2" }])
      .mockResolvedValueOnce([{ childId: "child-1" }, { childId: "child-2" }, { childId: "child-3" }])
      .mockResolvedValueOnce([]);
    prismaMock.lessonCompletion.aggregate.mockResolvedValue({
      _count: { _all: 12 },
      _sum: { minutesLearned: 240 },
    });
    prismaMock.progressState.findMany.mockResolvedValue([]);

    const result = await getAdminLearningAnalytics();

    expect(result.activeChildrenLast7d).toBe(2);
    expect(result.activeChildrenLast30d).toBe(3);
  });

  it("correctly calculated streakDistribution: zero=streak0, low=1-3, medium=4-7, high>7", async () => {
    prismaMock.childProfile.count.mockResolvedValue(6);
    prismaMock.lessonCompletion.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    prismaMock.lessonCompletion.aggregate.mockResolvedValue({
      _count: { _all: 0 },
      _sum: { minutesLearned: 0 },
    });
    prismaMock.progressState.findMany.mockResolvedValue([
      { childId: "child-a", streakCount: 0 },
      { childId: "child-b", streakCount: 3 },
      { childId: "child-c", streakCount: 5 },
      { childId: "child-d", streakCount: 2 },
      { childId: "child-d", streakCount: 9 },
    ]);

    const result = await getAdminLearningAnalytics();

    expect(result.streakDistribution).toEqual({
      zero: 3,
      low: 1,
      medium: 1,
      high: 1,
    });
  });

  it("topLessons sorted descending by completionCount, max 10 items", async () => {
    prismaMock.childProfile.count.mockResolvedValue(10);
    prismaMock.lessonCompletion.groupBy
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { lessonId: "l1", _count: { lessonId: 20 } },
        { lessonId: "l2", _count: { lessonId: 18 } },
        { lessonId: "l3", _count: { lessonId: 15 } },
        { lessonId: "l4", _count: { lessonId: 14 } },
        { lessonId: "l5", _count: { lessonId: 12 } },
        { lessonId: "l6", _count: { lessonId: 10 } },
        { lessonId: "l7", _count: { lessonId: 9 } },
        { lessonId: "l8", _count: { lessonId: 8 } },
        { lessonId: "l9", _count: { lessonId: 7 } },
        { lessonId: "l10", _count: { lessonId: 6 } },
      ]);
    prismaMock.lessonCompletion.aggregate.mockResolvedValue({
      _count: { _all: 119 },
      _sum: { minutesLearned: 600 },
    });
    prismaMock.progressState.findMany.mockResolvedValue([]);
    prismaMock.lesson.findMany.mockResolvedValue([
      { id: "l1", title: "Lesson 1" },
      { id: "l2", title: "Lesson 2" },
      { id: "l3", title: "Lesson 3" },
      { id: "l4", title: "Lesson 4" },
      { id: "l5", title: "Lesson 5" },
      { id: "l6", title: "Lesson 6" },
      { id: "l7", title: "Lesson 7" },
      { id: "l8", title: "Lesson 8" },
      { id: "l9", title: "Lesson 9" },
      { id: "l10", title: "Lesson 10" },
    ]);

    const result = await getAdminLearningAnalytics();

    expect(result.topLessons).toHaveLength(10);
    expect(result.topLessons[0]).toEqual({
      lessonId: "l1",
      title: "Lesson 1",
      completionCount: 20,
    });
    expect(result.topLessons[9]).toEqual({
      lessonId: "l10",
      title: "Lesson 10",
      completionCount: 6,
    });
    expect(prismaMock.lessonCompletion.groupBy).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        take: 10,
        orderBy: [{ _count: { lessonId: "desc" } }, { lessonId: "asc" }],
      }),
    );
  });
});

describe("getAdminRetentionAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retentionRate = 0 when totalHistoricalSubscriptions = 0 (avoid dividing by 0)", async () => {
    prismaMock.parentAccount.count.mockResolvedValue(0);
    prismaMock.subscription.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    prismaMock.childProfile.count.mockResolvedValue(0);
    prismaMock.lessonCompletion.count.mockResolvedValue(0);
    prismaMock.lessonCompletion.groupBy.mockResolvedValue([]);

    const result = await getAdminRetentionAnalytics();

    expect(result.retentionRate).toBe(0);
  });

  it("correctly calculated retentionRate = (active/total)*100 rounded to 1 digit", async () => {
    prismaMock.parentAccount.count.mockResolvedValue(2);
    prismaMock.subscription.count.mockResolvedValueOnce(1).mockResolvedValueOnce(7).mockResolvedValueOnce(13);
    prismaMock.childProfile.count.mockResolvedValue(5);
    prismaMock.lessonCompletion.count.mockResolvedValue(20);
    prismaMock.lessonCompletion.groupBy.mockResolvedValue([]);

    const result = await getAdminRetentionAnalytics();

    expect(result.retentionRate).toBe(53.8);
  });

  it("churned30d correctly counted CANCELED subscriptions in the last 30 days", async () => {
    prismaMock.parentAccount.count.mockResolvedValue(1);
    prismaMock.subscription.count.mockResolvedValueOnce(4).mockResolvedValueOnce(6).mockResolvedValueOnce(10);
    prismaMock.childProfile.count.mockResolvedValue(3);
    prismaMock.lessonCompletion.count.mockResolvedValue(9);
    prismaMock.lessonCompletion.groupBy.mockResolvedValue([]);

    const result = await getAdminRetentionAnalytics();

    expect(result.churned30d).toBe(4);
    expect(prismaMock.subscription.count).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          status: SubscriptionStatus.CANCELED_AT_PERIOD_END,
          updatedAt: expect.objectContaining({
            gte: expect.any(Date),
          }),
        }),
      }),
    );
  });
});

describe("getAdminActionLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls findMany with orderBy createdAt desc and the correct limit", async () => {
    prismaMock.adminActionLog.findMany.mockResolvedValue([{ id: "log-1" }]);

    const result = await getAdminActionLogs(12);

    expect(result).toEqual([{ id: "log-1" }]);
    expect(prismaMock.adminActionLog.findMany).toHaveBeenCalledWith({
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
      select: {
        id: true,
        adminEmail: true,
        action: true,
        target: true,
        detail: true,
        createdAt: true,
      },
    });
  });

  it("default limit = 50 when not transmitting", async () => {
    prismaMock.adminActionLog.findMany.mockResolvedValue([]);

    await getAdminActionLogs();

    expect(prismaMock.adminActionLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 50,
      }),
    );
  });
});

describe("getAdminUnifiedLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("merges AdminActionLog and AuditLog, sorts by createdAt desc, and limits results", async () => {
    prismaMock.adminActionLog.findMany.mockResolvedValue([
      {
        id: "admin-1",
        adminEmail: "admin@example.com",
        action: "ADMIN_ACTION_ONE",
        target: "parent:1",
        detail: { source: "admin" },
        createdAt: new Date("2026-04-08T10:00:00.000Z"),
      },
    ]);
    prismaMock.auditLog.findMany.mockResolvedValue([
      {
        id: "audit-1",
        actorType: "parent",
        actorId: "parent-123",
        action: "PARENT_LOGIN",
        resourceType: "parent_account",
        resourceId: "parent-123",
        metadata: { ip: "127.0.0.1" },
        createdAt: new Date("2026-04-08T11:00:00.000Z"),
      },
      {
        id: "audit-2",
        actorType: "system",
        actorId: null,
        action: "SYSTEM_CRON",
        resourceType: "cron",
        resourceId: null,
        metadata: null,
        createdAt: new Date("2026-04-08T09:00:00.000Z"),
      },
    ]);

    const result = await getAdminUnifiedLogs(2);

    expect(prismaMock.adminActionLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 2,
      }),
    );
    expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 2,
      }),
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: "audit:audit-1",
        source: "AUDIT_LOG",
        actor: "parent:parent-123",
        action: "PARENT_LOGIN",
        target: "parent_account:parent-123",
      }),
    );
    expect(result[1]).toEqual(
      expect.objectContaining({
        id: "admin:admin-1",
        source: "ADMIN_ACTION",
        actor: "admin@example.com",
        action: "ADMIN_ACTION_ONE",
      }),
    );
  });
});

describe("createAdminActionLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("correctly save adminEmail + action + target + detail to DB", async () => {
    prismaMock.adminActionLog.create.mockResolvedValue({
      id: "log-1",
      adminEmail: "admin@example.com",
      action: "EXPORT_CSV",
      target: "payments",
      detail: { from: "2026-01-01", to: "2026-01-31" },
      createdAt: new Date("2026-01-31T00:00:00.000Z"),
    });

    const detail = { from: "2026-01-01", to: "2026-01-31" };
    const result = await createAdminActionLog({
      adminEmail: "admin@example.com",
      action: "EXPORT_CSV",
      target: "payments",
      detail,
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: "log-1",
        adminEmail: "admin@example.com",
        action: "EXPORT_CSV",
        target: "payments",
        detail,
      }),
    );
    expect(prismaMock.adminActionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          adminEmail: "admin@example.com",
          action: "EXPORT_CSV",
          target: "payments",
          detail,
        },
      }),
    );
  });

  it("target and detail are optional (undefined ok)", async () => {
    prismaMock.adminActionLog.create.mockResolvedValue({
      id: "log-2",
      adminEmail: "admin@example.com",
      action: "IMPERSONATE_STOP",
      target: null,
      detail: null,
      createdAt: new Date("2026-02-01T00:00:00.000Z"),
    });

    await createAdminActionLog({
      adminEmail: "admin@example.com",
      action: "IMPERSONATE_STOP",
    });

    expect(prismaMock.adminActionLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          adminEmail: "admin@example.com",
          action: "IMPERSONATE_STOP",
          target: null,
          detail: undefined,
        }),
      }),
    );
  });
});

describe("executeBulkAdminAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("SUSPEND: update suspendedMany=true for correct parentIds", async () => {
    prismaMock.parentAccount.findMany.mockResolvedValue([
      { id: "parent-1", email: "one@example.com", displayName: "One" },
      { id: "parent-2", email: "two@example.com", displayName: "Two" },
    ]);
    prismaMock.parentAccount.updateMany.mockResolvedValue({ count: 2 });

    const result = await executeAdminBulkUsersAction({
      parentIds: ["parent-1", "parent-2"],
      action: "SUSPEND",
    });

    expect(prismaMock.parentAccount.updateMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["parent-1", "parent-2"],
        },
      },
      data: {
        suspended: true,
      },
    });
    expect(result).toEqual({ succeeded: 2, failed: 0 });
  });

  it("ACTIVATE: updateMany suspended=false", async () => {
    prismaMock.parentAccount.findMany.mockResolvedValue([
      { id: "parent-1", email: "one@example.com", displayName: "One" },
    ]);
    prismaMock.parentAccount.updateMany.mockResolvedValue({ count: 1 });

    const result = await executeAdminBulkUsersAction({
      parentIds: ["parent-1"],
      action: "ACTIVATE",
    });

    expect(prismaMock.parentAccount.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          suspended: false,
        },
      }),
    );
    expect(result).toEqual({ succeeded: 1, failed: 0 });
  });

  it("SEND_NOTIFICATION: create notification for each parentId", async () => {
    prismaMock.parentAccount.findMany.mockResolvedValue([
      { id: "parent-1", email: "one@example.com", displayName: "One" },
      { id: "parent-2", email: "two@example.com", displayName: "Two" },
    ]);
    createNotificationForParentMock.mockResolvedValue({ id: "notification-1" });

    const result = await executeAdminBulkUsersAction({
      parentIds: ["parent-1", "parent-2"],
      action: "SEND_NOTIFICATION",
      payload: {
        message: "Reminder from admin",
      },
    });

    expect(createNotificationForParentMock).toHaveBeenCalledTimes(2);
    expect(createNotificationForParentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        parentId: "parent-1",
        notification: expect.objectContaining({
          type: "TIP",
          message: "Reminder from admin",
        }),
      }),
    );
    expect(result).toEqual({ succeeded: 2, failed: 0 });
  });

  it("throws when parentIds is empty", async () => {
    await expect(
      executeAdminBulkUsersAction({
        parentIds: [],
        action: "SUSPEND",
      }),
    ).rejects.toThrow();
  });

  it("throws khi parentIds.length > 100", async () => {
    const parentIds = Array.from({ length: 101 }, (_, index) => `parent-${index + 1}`);

    await expect(
      executeAdminBulkUsersAction({
        parentIds,
        action: "SUSPEND",
      }),
    ).rejects.toThrow();
  });
});


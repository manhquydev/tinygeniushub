import { PaymentStatus, WebhookStatus } from "@prisma/client";
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


import { EmailStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    weeklyReport: {
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

const sendTransactionalEmailMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/env", () => ({
  env: {
    REPORT_EMAIL_PROVIDER: "mock_email",
    REPORT_EMAIL_TO_OVERRIDE: undefined,
  },
}));

vi.mock("@/lib/email/transactional-email-sender", () => ({
  sendTransactionalEmail: sendTransactionalEmailMock,
}));

import {
  canSendWeeklyEmail,
  deliverQueuedWeeklyReportEmails,
} from "@/modules/reports/email-delivery-service";

const baseReport = {
  id: "report-1",
  childId: "child-1",
  child: {
    nickname: "Kid A",
    parent: {
      email: "parent@example.com",
      preferences: {
        id: "pref-1",
        parentId: "parent-1",
        weeklyReportChannel: "IN_APP_AND_EMAIL",
        weeklyReportEmailEnabled: true,
        marketingEmailOptIn: false,
        timezone: "Asia/Bangkok",
      },
      weeklyEmailOptIns: [],
    },
  },
};

describe("canSendWeeklyEmail", () => {
  it("returns true when preferences are missing", () => {
    expect(canSendWeeklyEmail({ preferences: null, childOptIn: null })).toBe(true);
  });

  it("returns false when parent disabled weekly report email", () => {
    expect(
      canSendWeeklyEmail({
        preferences: {
          id: "pref-1",
          parentId: "parent-1",
          weeklyReportChannel: "IN_APP_AND_EMAIL",
          weeklyReportEmailEnabled: false,
          marketingEmailOptIn: false,
          timezone: "Asia/Bangkok",
        },
        childOptIn: null,
      }),
    ).toBe(false);
  });

  it("returns false when channel is in-app only", () => {
    expect(
      canSendWeeklyEmail({
        preferences: {
          id: "pref-1",
          parentId: "parent-1",
          weeklyReportChannel: "IN_APP_ONLY",
          weeklyReportEmailEnabled: true,
          marketingEmailOptIn: false,
          timezone: "Asia/Bangkok",
        },
        childOptIn: null,
      }),
    ).toBe(false);
  });

  it("returns false when child-specific opt-in is disabled", () => {
    expect(
      canSendWeeklyEmail({
        preferences: {
          id: "pref-1",
          parentId: "parent-1",
          weeklyReportChannel: "IN_APP_AND_EMAIL",
          weeklyReportEmailEnabled: true,
          marketingEmailOptIn: false,
          timezone: "Asia/Bangkok",
        },
        childOptIn: {
          id: "optin-1",
          parentId: "parent-1",
          childId: "child-1",
          enabled: false,
        },
      }),
    ).toBe(false);
  });
});

describe("deliverQueuedWeeklyReportEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.weeklyReport.updateMany.mockReset();
    prismaMock.weeklyReport.findMany.mockReset();
    sendTransactionalEmailMock.mockResolvedValue({ sent: true, provider: "mock_email" });
  });

  it("skips report when another worker already claimed it", async () => {
    prismaMock.weeklyReport.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 0 });
    prismaMock.weeklyReport.findMany.mockResolvedValueOnce([baseReport]);

    const result = await deliverQueuedWeeklyReportEmails();

    expect(result).toEqual({
      provider: "mock_email",
      queued: 1,
      sent: 0,
      skipped: 0,
      bounced: 0,
      claimedByOtherWorker: 1,
      requeuedStaleClaims: 0,
    });
  });

  it("marks report as sent after a successful claim", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    prismaMock.weeklyReport.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });
    prismaMock.weeklyReport.findMany.mockResolvedValueOnce([baseReport]);

    const result = await deliverQueuedWeeklyReportEmails();

    expect(result.sent).toBe(1);
    expect(result.claimedByOtherWorker).toBe(0);
    expect(prismaMock.weeklyReport.updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: {
          id: "report-1",
          emailStatus: EmailStatus.QUEUED,
          deliveredEmailAt: null,
        },
        data: expect.objectContaining({
          emailStatus: EmailStatus.PROCESSING,
        }),
      }),
    );
    expect(prismaMock.weeklyReport.updateMany).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        where: {
          id: "report-1",
          emailStatus: EmailStatus.PROCESSING,
        },
        data: expect.objectContaining({
          emailStatus: EmailStatus.SENT,
          emailClaimedAt: null,
        }),
      }),
    );

    logSpy.mockRestore();
  });

  it("marks report as bounced when email is not allowed for child", async () => {
    prismaMock.weeklyReport.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });
    prismaMock.weeklyReport.findMany.mockResolvedValueOnce([
      {
        ...baseReport,
        child: {
          ...baseReport.child,
          parent: {
            ...baseReport.child.parent,
            weeklyEmailOptIns: [
              {
                id: "optin-1",
                parentId: "parent-1",
                childId: "child-1",
                enabled: false,
              },
            ],
          },
        },
      },
    ]);

    const result = await deliverQueuedWeeklyReportEmails();

    expect(result).toEqual({
      provider: "mock_email",
      queued: 1,
      sent: 0,
      skipped: 1,
      bounced: 0,
      claimedByOtherWorker: 0,
      requeuedStaleClaims: 0,
    });
    expect(prismaMock.weeklyReport.updateMany).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        where: {
          id: "report-1",
          emailStatus: EmailStatus.PROCESSING,
        },
        data: {
          emailStatus: EmailStatus.BOUNCED,
          emailClaimedAt: null,
        },
      }),
    );
  });

  it("requeues stale processing claims before scanning queued reports", async () => {
    prismaMock.weeklyReport.updateMany.mockResolvedValueOnce({ count: 3 });
    prismaMock.weeklyReport.findMany.mockResolvedValueOnce([]);

    const result = await deliverQueuedWeeklyReportEmails();

    expect(result).toEqual({
      provider: "mock_email",
      queued: 0,
      sent: 0,
      skipped: 0,
      bounced: 0,
      claimedByOtherWorker: 0,
      requeuedStaleClaims: 3,
    });
    expect(prismaMock.weeklyReport.updateMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.weeklyReport.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          emailStatus: EmailStatus.PROCESSING,
          deliveredEmailAt: null,
        }),
        data: {
          emailStatus: EmailStatus.QUEUED,
          emailClaimedAt: null,
        },
      }),
    );
  });
});

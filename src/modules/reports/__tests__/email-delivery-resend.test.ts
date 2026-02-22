import { EmailStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, envMock } = vi.hoisted(() => ({
  prismaMock: {
    weeklyReport: {
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
  },
  envMock: {
    REPORT_EMAIL_PROVIDER: "resend",
    REPORT_EMAIL_RESEND_API_KEY: "re_test_123",
    REPORT_EMAIL_RESEND_API_BASE_URL: "https://api.resend.com",
    REPORT_EMAIL_FROM: "no-reply@example.com",
    REPORT_EMAIL_REPLY_TO: "support@example.com",
    REPORT_EMAIL_TO_OVERRIDE: "qa-inbox@example.com",
    NODE_ENV: "test",
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/lib/env", () => ({
  env: envMock,
}));

import { deliverQueuedWeeklyReportEmails } from "@/modules/reports/email-delivery-service";

describe("deliverQueuedWeeklyReportEmails with resend provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends weekly report through resend and marks report as SENT", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
    } as Response);

    prismaMock.weeklyReport.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });
    prismaMock.weeklyReport.findMany.mockResolvedValueOnce([
      {
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
      },
    ]);

    const result = await deliverQueuedWeeklyReportEmails();

    expect(result).toEqual({
      provider: "resend",
      queued: 1,
      sent: 1,
      skipped: 0,
      bounced: 0,
      claimedByOtherWorker: 0,
      requeuedStaleClaims: 0,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
      }),
    );

    const [, fetchOptions] = fetchMock.mock.calls[0] ?? [];
    const body = JSON.parse(String(fetchOptions?.body ?? "{}"));
    expect(body.from).toBe("no-reply@example.com");
    expect(body.to).toEqual(["qa-inbox@example.com"]);
    expect(body.reply_to).toBe("support@example.com");
    expect(prismaMock.weeklyReport.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          id: "report-1",
          emailStatus: EmailStatus.PROCESSING,
        },
        data: expect.objectContaining({
          emailStatus: EmailStatus.SENT,
        }),
      }),
    );
  });

  it("marks report as BOUNCED when resend delivery fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    prismaMock.weeklyReport.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 1 });
    prismaMock.weeklyReport.findMany.mockResolvedValueOnce([
      {
        id: "report-2",
        childId: "child-1",
        child: {
          nickname: "Kid B",
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
      },
    ]);

    const result = await deliverQueuedWeeklyReportEmails();

    expect(result).toEqual({
      provider: "resend",
      queued: 1,
      sent: 0,
      skipped: 0,
      bounced: 1,
      claimedByOtherWorker: 0,
      requeuedStaleClaims: 0,
    });
    expect(prismaMock.weeklyReport.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          id: "report-2",
          emailStatus: EmailStatus.PROCESSING,
        },
        data: {
          emailStatus: EmailStatus.BOUNCED,
          emailClaimedAt: null,
        },
      }),
    );
  });
});

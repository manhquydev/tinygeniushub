import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  updateManyMock,
  upsertMock,
  logWarnMock,
} = vi.hoisted(() => ({
  updateManyMock: vi.fn(),
  upsertMock: vi.fn(),
  logWarnMock: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  env: {
    REPORT_EMAIL_PROVIDER: "brevo",
    REPORT_EMAIL_BREVO_WEBHOOK_SECRET: "brevo-secret",
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    weeklyReport: {
      updateMany: updateManyMock,
    },
    webhookEvent: {
      upsert: upsertMock,
    },
  },
}));

vi.mock("@/lib/observability/logger", () => ({
  logWarn: logWarnMock,
}));

import { POST } from "@/app/api/webhooks/brevo/route";

describe("brevo webhook route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateManyMock.mockResolvedValue({ count: 1 });
    upsertMock.mockResolvedValue({});
  });

  it("returns 401 when webhook secret is missing", async () => {
    const response = await POST(
      new Request("http://localhost/api/webhooks/brevo", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ event: "opened" }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("updates weekly report on opened event with weekly_report_id tag", async () => {
    const response = await POST(
      new Request("http://localhost/api/webhooks/brevo?token=brevo-secret", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          event: "opened",
          tags: ["feature:weekly_report", "weekly_report_id:wr_123"],
          "message-id": "msg-1",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.processed).toBe(1);
    expect(updateManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: "wr_123",
        }),
      }),
    );
    expect(upsertMock).toHaveBeenCalledTimes(1);
  });

  it("marks event ignored when there is no weekly_report_id tag", async () => {
    const response = await POST(
      new Request("http://localhost/api/webhooks/brevo?token=brevo-secret", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          event: "opened",
          tags: ["feature:lifecycle"],
          "message-id": "msg-2",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.ignored).toBe(1);
    expect(updateManyMock).not.toHaveBeenCalled();
    expect(upsertMock).toHaveBeenCalledTimes(1);
  });
});


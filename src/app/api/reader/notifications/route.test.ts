import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireReaderFromRequestMock,
  assertTrustedOriginMock,
  enforceRateLimitMock,
  listNotificationsMock,
  markAllNotificationsReadMock,
} = vi.hoisted(() => ({
  requireReaderFromRequestMock: vi.fn(),
  assertTrustedOriginMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  listNotificationsMock: vi.fn(),
  markAllNotificationsReadMock: vi.fn(),
}));

vi.mock("@/lib/auth/reader", () => ({
  requireReaderFromRequest: requireReaderFromRequestMock,
}));

vi.mock("@/lib/security/csrf", () => ({
  assertTrustedOrigin: assertTrustedOriginMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
}));

vi.mock("@/modules/reader/reader-service", () => ({
  listNotifications: listNotificationsMock,
  markAllNotificationsRead: markAllNotificationsReadMock,
}));

import { GET, POST } from "@/app/api/reader/notifications/route";

describe("reader notifications route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireReaderFromRequestMock.mockResolvedValue({ id: "reader-1" });
    assertTrustedOriginMock.mockImplementation(() => {});
    enforceRateLimitMock.mockResolvedValue({ allowed: true, remaining: 59 });
  });

  it("returns reader notifications", async () => {
    listNotificationsMock.mockResolvedValue([{ id: "n1", title: "A" }]);

    const response = await GET(
      new Request("http://localhost/api/reader/notifications?limit=10") as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.notifications).toHaveLength(1);
    expect(listNotificationsMock).toHaveBeenCalledWith("reader-1", 10);
  });

  it("marks all notifications as read", async () => {
    markAllNotificationsReadMock.mockResolvedValue({ updated: 3 });

    const response = await POST(
      new Request("http://localhost/api/reader/notifications", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({ action: "mark_all_read" }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.updated).toBe(3);
    expect(markAllNotificationsReadMock).toHaveBeenCalledWith("reader-1");
  });
});

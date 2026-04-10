import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAdminMock,
  getActiveUserCountMock,
  getActiveSessionCountMock,
  getHourlyStatsMock,
} = vi.hoisted(() => ({
  requireAdminMock: vi.fn(),
  getActiveUserCountMock: vi.fn(),
  getActiveSessionCountMock: vi.fn(),
  getHourlyStatsMock: vi.fn(),
}));

vi.mock("@/lib/auth/admin-guard", () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock("@/lib/analytics/realtime/counters-service", () => ({
  getActiveUserCount: getActiveUserCountMock,
  getActiveSessionCount: getActiveSessionCountMock,
}));

vi.mock("@/lib/analytics/realtime/aggregator", () => ({
  getHourlyStats: getHourlyStatsMock,
}));

import { GET } from "@/app/api/admin/analytics/realtime/route";

describe("admin realtime analytics route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue(null);
  });

  it("returns realtime stats when dependencies are healthy", async () => {
    getActiveUserCountMock.mockResolvedValue(12);
    getActiveSessionCountMock.mockResolvedValue(20);
    getHourlyStatsMock.mockResolvedValue([{ hour: "2026-04-10T00:00:00.000Z", login: 3 }]);

    const response = await GET(new Request("http://localhost/api/admin/analytics/realtime") as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.activeUsers).toBe(12);
    expect(body.activeSessions).toBe(20);
    expect(body.degraded).toBeUndefined();
  });

  it("returns degraded payload instead of 500 when realtime source fails", async () => {
    getActiveUserCountMock.mockResolvedValue(5);
    getActiveSessionCountMock.mockResolvedValue(7);
    getHourlyStatsMock.mockRejectedValue(new Error("redis connection is closed"));

    const response = await GET(new Request("http://localhost/api/admin/analytics/realtime") as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.activeUsers).toBe(0);
    expect(body.activeSessions).toBe(0);
    expect(body.hourlyStats).toEqual([]);
    expect(body.degraded).toBe(true);
  });
});

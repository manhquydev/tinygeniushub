import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { DomainError } from "@/modules/platform/errors";

const {
  requireAdminFromRequestMock,
  assertTrustedOriginMock,
  enforceAdminMutationRateLimitMock,
  getAdminActionLogsMock,
  createAdminActionLogMock,
} = vi.hoisted(() => ({
  requireAdminFromRequestMock: vi.fn(),
  assertTrustedOriginMock: vi.fn(),
  enforceAdminMutationRateLimitMock: vi.fn(),
  getAdminActionLogsMock: vi.fn(),
  createAdminActionLogMock: vi.fn(),
}));

vi.mock("@/lib/auth/admin", () => ({
  requireAdminFromRequest: requireAdminFromRequestMock,
}));

vi.mock("@/lib/security/csrf", () => ({
  assertTrustedOrigin: assertTrustedOriginMock,
}));

vi.mock("@/lib/security/admin-rate-limit", () => ({
  enforceAdminMutationRateLimit: enforceAdminMutationRateLimitMock,
}));

vi.mock("@/modules/admin/service", () => ({
  getAdminActionLogs: getAdminActionLogsMock,
  createAdminActionLog: createAdminActionLogMock,
}));

import { GET, POST } from "@/app/api/admin/log/route";

const ADMIN_LOG_ROLES = ["SUPER_ADMIN"];

describe("admin log route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminFromRequestMock.mockResolvedValue({
      id: "admin-1",
      email: "admin@example.com",
      role: "SUPER_ADMIN",
    });
    assertTrustedOriginMock.mockImplementation(() => {});
    enforceAdminMutationRateLimitMock.mockResolvedValue(null);
    getAdminActionLogsMock.mockResolvedValue([
      {
        id: "log-1",
        adminEmail: "admin@example.com",
        action: "TEST_ACTION",
        target: "target-1",
        detail: null,
        createdAt: new Date("2026-03-25T00:00:00.000Z"),
      },
    ]);
    createAdminActionLogMock.mockResolvedValue({
      id: "log-2",
      adminEmail: "admin@example.com",
      action: "CREATE_TEST",
      target: "target-2",
      detail: { ok: true },
      createdAt: new Date("2026-03-25T01:00:00.000Z"),
    });
  });

  it("GET returns logs and clamps limit", async () => {
    const request = new NextRequest("http://localhost/api/admin/log?limit=250");
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(requireAdminFromRequestMock).toHaveBeenCalledWith(request, ADMIN_LOG_ROLES);
    expect(getAdminActionLogsMock).toHaveBeenCalledWith(200);
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.data.logs)).toBe(true);
  });

  it("GET falls back to default limit when query is invalid", async () => {
    const request = new NextRequest("http://localhost/api/admin/log?limit=abc");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(getAdminActionLogsMock).toHaveBeenCalledWith(50);
  });

  it("GET maps auth errors via route error handler", async () => {
    requireAdminFromRequestMock.mockRejectedValueOnce(
      new DomainError("Forbidden: Insufficient permissions", 403, "FORBIDDEN"),
    );

    const response = await GET(new NextRequest("http://localhost/api/admin/log"));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.ok).toBe(false);
    expect(body.error.message).toBe("Forbidden: Insufficient permissions");
  });

  it("POST returns early when mutation is rate limited", async () => {
    const rateLimited = new Response(
      JSON.stringify({
        ok: false,
        error: { message: "Too many requests" },
      }),
      {
        status: 429,
        headers: { "content-type": "application/json" },
      },
    );
    enforceAdminMutationRateLimitMock.mockResolvedValueOnce(rateLimited);

    const response = await POST(
      new NextRequest("http://localhost/api/admin/log", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          action: "A",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.message).toBe("Too many requests");
    expect(createAdminActionLogMock).not.toHaveBeenCalled();
  });

  it("POST validates payload and returns 400 for empty action", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/admin/log", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          action: "   ",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.message).toBe("Invalid request payload");
    expect(createAdminActionLogMock).not.toHaveBeenCalled();
  });

  it("POST creates admin action log with current admin identity", async () => {
    const request = new NextRequest("http://localhost/api/admin/log", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
        host: "localhost",
      },
      body: JSON.stringify({
        action: "PAYMENT_EXPORT",
        target: "pay-123",
        detail: { source: "operations" },
      }),
    });
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(assertTrustedOriginMock).toHaveBeenCalledWith(request);
    expect(requireAdminFromRequestMock).toHaveBeenCalledWith(request, ADMIN_LOG_ROLES);
    expect(createAdminActionLogMock).toHaveBeenCalledWith({
      adminEmail: "admin@example.com",
      action: "PAYMENT_EXPORT",
      target: "pay-123",
      detail: { source: "operations" },
    });
    expect(body.ok).toBe(true);
    expect(body.data.entry.id).toBe("log-2");
  });
});

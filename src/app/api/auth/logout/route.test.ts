import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  assertTrustedOriginMock,
  signOutMock,
  assertRequestAllowedBySecurityControlsMock,
  getRateLimitPolicyMock,
  getRequestIpMock,
  enforceRateLimitMock,
  logInfoMock,
  logWarnMock,
} = vi.hoisted(() => ({
  assertTrustedOriginMock: vi.fn(),
  signOutMock: vi.fn(),
  assertRequestAllowedBySecurityControlsMock: vi.fn(),
  getRateLimitPolicyMock: vi.fn(),
  getRequestIpMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  logInfoMock: vi.fn(),
  logWarnMock: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  assertTrustedOrigin: assertTrustedOriginMock,
}));

vi.mock("@/lib/auth/better-auth", () => ({
  auth: {
    api: {
      signOut: signOutMock,
    },
  },
}));

vi.mock("@/modules/platform/security-access-guard", () => ({
  assertRequestAllowedBySecurityControls: assertRequestAllowedBySecurityControlsMock,
}));

vi.mock("@/modules/platform/security-policy-service", () => ({
  getRateLimitPolicy: getRateLimitPolicyMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  getRequestIp: getRequestIpMock,
  enforceRateLimit: enforceRateLimitMock,
}));

vi.mock("@/lib/observability/logger", () => ({
  logInfo: logInfoMock,
  logWarn: logWarnMock,
}));

import { POST } from "@/app/api/auth/logout/route";

describe("auth logout route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertTrustedOriginMock.mockImplementation(() => {});
    assertRequestAllowedBySecurityControlsMock.mockResolvedValue(undefined);
    getRateLimitPolicyMock.mockResolvedValue({
      limit: 120,
      windowMs: 600_000,
    });
    getRequestIpMock.mockReturnValue("203.0.113.10");
    enforceRateLimitMock.mockResolvedValue({
      allowed: true,
      retryAfterMs: null,
    });
    signOutMock.mockResolvedValue({
      headers: new Headers({
        "set-cookie": "ccth_session=; Path=/; Max-Age=0",
      }),
      response: {},
    });
  });

  it("returns signedOut=true and clears session cookie", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/logout", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
        },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(body).toEqual({
      ok: true,
      data: {
        signedOut: true,
      },
    });
    expect(logInfoMock).toHaveBeenCalledWith(
      "auth.logout.succeeded",
      expect.objectContaining({
        ip: "203.0.113.10",
      }),
    );
  });

  it("returns normalized auth error when sign out fails", async () => {
    signOutMock.mockRejectedValueOnce({
      name: "APIError",
      statusCode: 401,
      body: {
        message: "Session not found",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/auth/logout", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
        },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("Session not found");
    expect(body.error.details?.code).toBe("AUTH_API_ERROR");
    expect(logWarnMock).toHaveBeenCalledWith(
      "auth.logout.failed",
      expect.objectContaining({
        ip: "203.0.113.10",
        code: "AUTH_API_ERROR",
        status: 401,
      }),
    );
  });

  it("returns 429 when logout rate limit is exceeded", async () => {
    enforceRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      retryAfterMs: 15_000,
    });

    const response = await POST(
      new Request("http://localhost/api/auth/logout", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
        },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.message).toBe("Too many logout attempts. Please retry later.");
    expect(logWarnMock).toHaveBeenCalledWith(
      "auth.logout.rate_limited",
      expect.objectContaining({
        scope: "ip",
        ip: "203.0.113.10",
      }),
    );
  });
});

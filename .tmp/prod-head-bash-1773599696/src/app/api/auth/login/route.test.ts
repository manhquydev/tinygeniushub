import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  assertTrustedOriginMock,
  assertRequestAllowedBySecurityControlsMock,
  getRateLimitPolicyMock,
  enforceRateLimitMock,
  getRequestIpMock,
  buildRateLimitIdentityMock,
  logInfoMock,
  logWarnMock,
  signInEmailMock,
  parentFindUniqueMock,
  parentUpdateMock,
} = vi.hoisted(() => ({
  assertTrustedOriginMock: vi.fn(),
  assertRequestAllowedBySecurityControlsMock: vi.fn(),
  getRateLimitPolicyMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  getRequestIpMock: vi.fn(),
  buildRateLimitIdentityMock: vi.fn(),
  logInfoMock: vi.fn(),
  logWarnMock: vi.fn(),
  signInEmailMock: vi.fn(),
  parentFindUniqueMock: vi.fn(),
  parentUpdateMock: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  assertTrustedOrigin: assertTrustedOriginMock,
}));

vi.mock("@/modules/platform/security-access-guard", () => ({
  assertRequestAllowedBySecurityControls: assertRequestAllowedBySecurityControlsMock,
}));

vi.mock("@/modules/platform/security-policy-service", () => ({
  getRateLimitPolicy: getRateLimitPolicyMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
  getRequestIp: getRequestIpMock,
  buildRateLimitIdentity: buildRateLimitIdentityMock,
}));

vi.mock("@/lib/observability/logger", () => ({
  logInfo: logInfoMock,
  logWarn: logWarnMock,
}));

vi.mock("@/lib/auth/better-auth", () => ({
  auth: {
    api: {
      signInEmail: signInEmailMock,
    },
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    parentAccount: {
      findUnique: parentFindUniqueMock,
      update: parentUpdateMock,
    },
  },
}));

import { POST } from "@/app/api/auth/login/route";

describe("auth login route", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    assertTrustedOriginMock.mockImplementation(() => {});
    assertRequestAllowedBySecurityControlsMock.mockResolvedValue(undefined);
    getRateLimitPolicyMock.mockResolvedValue({
      limit: 10,
      windowMs: 60_000,
    });
    enforceRateLimitMock.mockResolvedValue({
      allowed: true,
      remaining: 9,
      retryAfterMs: 0,
    });
    getRequestIpMock.mockReturnValue("203.0.113.10");
    buildRateLimitIdentityMock.mockReturnValue("email-hash");
    signInEmailMock.mockResolvedValue({
      headers: new Headers({
        "set-cookie": "ccth_session=token; Path=/; HttpOnly",
      }),
      response: {
        user: {
          id: "parent-1",
        },
      },
    });
    parentFindUniqueMock.mockResolvedValue({
      id: "parent-1",
      email: "parent@example.com",
      displayName: "Parent",
    });
    parentUpdateMock.mockResolvedValue({
      id: "parent-1",
    });
  });

  it("returns 400 with validation message for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "invalid-email",
          password: "123",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe("Invalid request payload");
    expect(Array.isArray(body.error.details?.issues)).toBe(true);
    expect(signInEmailMock).not.toHaveBeenCalled();
  });

  it("returns 429 when ip rate limit is exceeded", async () => {
    enforceRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterMs: 2_200,
    });

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "parent@example.com",
          password: "password-123",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("3");
    expect(body.error.message).toBe("Too many login attempts. Please retry later.");
    expect(signInEmailMock).not.toHaveBeenCalled();
    expect(logWarnMock).toHaveBeenCalledWith(
      "auth.login.rate_limited",
      expect.objectContaining({
        scope: "ip",
        ip: "203.0.113.10",
      }),
    );
  });

  it("returns 429 when email bucket rate limit is exceeded", async () => {
    enforceRateLimitMock
      .mockResolvedValueOnce({
        allowed: true,
        remaining: 9,
        retryAfterMs: 0,
      })
      .mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        retryAfterMs: 4_000,
      });

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "parent@example.com",
          password: "password-123",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("4");
    expect(body.error.message).toBe("Too many login attempts. Please retry later.");
    expect(signInEmailMock).not.toHaveBeenCalled();
    expect(logWarnMock).toHaveBeenCalledWith(
      "auth.login.rate_limited",
      expect.objectContaining({
        scope: "email",
        ip: "203.0.113.10",
        identityHash: "email-hash",
      }),
    );
  });

  it("returns 401 when auth result does not provide user id", async () => {
    signInEmailMock.mockResolvedValueOnce({
      headers: new Headers(),
      response: {
        user: {},
      },
    });

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "parent@example.com",
          password: "password-123",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("Invalid credentials");
    expect(logWarnMock).toHaveBeenCalledWith(
      "auth.login.failed",
      expect.objectContaining({
        reason: "invalid_credentials",
        ip: "203.0.113.10",
        identityHash: "email-hash",
      }),
    );
  });

  it("returns 401 when parent profile is missing", async () => {
    parentFindUniqueMock.mockResolvedValueOnce(null);

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "parent@example.com",
          password: "password-123",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("Invalid credentials");
    expect(logWarnMock).toHaveBeenCalledWith(
      "auth.login.failed",
      expect.objectContaining({
        reason: "invalid_credentials",
        ip: "203.0.113.10",
        identityHash: "email-hash",
      }),
    );
  });

  it("returns normalized auth error from better-auth API", async () => {
    signInEmailMock.mockRejectedValueOnce({
      name: "APIError",
      statusCode: 401,
      body: {
        message: "Invalid email or password",
      },
    });

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "parent@example.com",
          password: "password-123",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("Invalid credentials");
    expect(body.error.details?.code).toBe("AUTH_API_ERROR");
    expect(logWarnMock).toHaveBeenCalledWith(
      "auth.login.failed",
      expect.objectContaining({
        reason: "invalid_credentials",
        ip: "203.0.113.10",
        identityHash: "email-hash",
        code: "AUTH_API_ERROR",
      }),
    );
    const failedAuthSecurityLog = logWarnMock.mock.calls.find(
      (call) => call[0] === "auth.login.failed",
    )?.[1];
    expect(JSON.stringify(failedAuthSecurityLog)).not.toContain("parent@example.com");
    expect(JSON.stringify(failedAuthSecurityLog)).not.toContain("password-123");
  });

  it("enforces email bucket rate limit even when source ip rotates", async () => {
    const emailBucketCounters = new Map<string, number>();
    getRequestIpMock.mockImplementation((request: Request) => request.headers.get("x-real-ip") ?? "203.0.113.10");
    enforceRateLimitMock.mockImplementation(async ({ key }: { key: string }) => {
      if (key.startsWith("auth:login:email:")) {
        const nextCount = (emailBucketCounters.get(key) ?? 0) + 1;
        emailBucketCounters.set(key, nextCount);
        const denied = nextCount > 2;
        return {
          allowed: !denied,
          remaining: denied ? 0 : 10 - nextCount,
          retryAfterMs: denied ? 5_000 : 0,
        };
      }

      return {
        allowed: true,
        remaining: 99,
        retryAfterMs: 0,
      };
    });
    signInEmailMock.mockRejectedValue({
      name: "APIError",
      statusCode: 401,
      body: {
        message: "Invalid email or password",
      },
    });

    const attempt1 = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          "x-real-ip": "198.51.100.31",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "shared-target@example.com",
          password: "wrong-password-123",
        }),
      }),
    );
    const attempt2 = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          "x-real-ip": "198.51.100.32",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "shared-target@example.com",
          password: "wrong-password-123",
        }),
      }),
    );
    const attempt3 = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          "x-real-ip": "198.51.100.33",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "shared-target@example.com",
          password: "wrong-password-123",
        }),
      }),
    );

    const body3 = await attempt3.json();

    expect(attempt1.status).toBe(401);
    expect(attempt2.status).toBe(401);
    expect(attempt3.status).toBe(429);
    expect(attempt3.headers.get("Retry-After")).toBe("5");
    expect(body3.error.message).toBe("Too many login attempts. Please retry later.");
    expect(signInEmailMock).toHaveBeenCalledTimes(2);
    expect(logWarnMock).toHaveBeenCalledWith(
      "auth.login.rate_limited",
      expect.objectContaining({
        scope: "email",
        identityHash: "email-hash",
      }),
    );
  });

  it("returns parent payload and updates lastActiveAt on success", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "parent@example.com",
          password: "password-123",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("ccth_session=token");
    expect(parentUpdateMock).toHaveBeenCalledTimes(1);
    expect(body).toEqual({
      ok: true,
      data: {
        parent: {
          id: "parent-1",
          email: "parent@example.com",
          displayName: "Parent",
        },
      },
    });
    expect(logInfoMock).toHaveBeenCalledWith(
      "auth.login.succeeded",
      expect.objectContaining({
        parentId: "parent-1",
        ip: "203.0.113.10",
      }),
    );
  });
});

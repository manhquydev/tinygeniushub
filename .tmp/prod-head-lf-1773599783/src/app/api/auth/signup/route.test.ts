import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/modules/platform/errors";

const {
  assertTrustedOriginMock,
  assertRequestAllowedBySecurityControlsMock,
  getRateLimitPolicyMock,
  enforceRateLimitMock,
  getRequestIpMock,
  buildRateLimitIdentityMock,
  logInfoMock,
  logWarnMock,
  registerParentMock,
  signInEmailMock,
} = vi.hoisted(() => ({
  assertTrustedOriginMock: vi.fn(),
  assertRequestAllowedBySecurityControlsMock: vi.fn(),
  getRateLimitPolicyMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  getRequestIpMock: vi.fn(),
  buildRateLimitIdentityMock: vi.fn(),
  logInfoMock: vi.fn(),
  logWarnMock: vi.fn(),
  registerParentMock: vi.fn(),
  signInEmailMock: vi.fn(),
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

vi.mock("@/modules/identity/service", async () => {
  const actual = await vi.importActual<typeof import("@/modules/identity/service")>(
    "@/modules/identity/service",
  );

  return {
    ...actual,
    registerParent: registerParentMock,
  };
});

vi.mock("@/lib/auth/better-auth", () => ({
  auth: {
    api: {
      signInEmail: signInEmailMock,
    },
  },
}));

import { POST } from "@/app/api/auth/signup/route";

describe("auth signup route", () => {
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
    registerParentMock.mockResolvedValue({
      id: "parent-1",
      email: "parent@example.com",
      displayName: "Parent",
    });
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
  });

  it("returns 400 with validation message for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
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
    expect(registerParentMock).not.toHaveBeenCalled();
  });

  it("returns 429 when ip rate limit is exceeded", async () => {
    enforceRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterMs: 1_500,
    });

    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
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
    expect(response.headers.get("Retry-After")).toBe("2");
    expect(body.error.message).toBe("Too many signup attempts. Please retry later.");
    expect(registerParentMock).not.toHaveBeenCalled();
    expect(logWarnMock).toHaveBeenCalledWith(
      "auth.signup.rate_limited",
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
        retryAfterMs: 5_000,
      });

    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
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
    expect(response.headers.get("Retry-After")).toBe("5");
    expect(body.error.message).toBe("Too many signup attempts. Please retry later.");
    expect(registerParentMock).not.toHaveBeenCalled();
    expect(logWarnMock).toHaveBeenCalledWith(
      "auth.signup.rate_limited",
      expect.objectContaining({
        scope: "email",
        ip: "203.0.113.10",
        identityHash: "email-hash",
      }),
    );
  });

  it("returns 409 when email already exists", async () => {
    registerParentMock.mockRejectedValueOnce(
      new DomainError("Email already exists", 409, "EMAIL_EXISTS"),
    );

    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
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

    expect(response.status).toBe(409);
    expect(body.error.message).toBe("Email already exists");
    expect(body.error.details?.code).toBe("EMAIL_EXISTS");
    expect(logWarnMock).toHaveBeenCalledWith(
      "auth.signup.failed",
      expect.objectContaining({
        reason: "email_exists",
        ip: "203.0.113.10",
        identityHash: "email-hash",
        code: "EMAIL_EXISTS",
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
      new Request("http://localhost/api/auth/signup", {
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
    expect(body.error.message).toBe("Invalid email or password");
    expect(body.error.details?.code).toBe("AUTH_API_ERROR");
    expect(logWarnMock).toHaveBeenCalledWith(
      "auth.signup.failed",
      expect.objectContaining({
        reason: "domain_error",
        ip: "203.0.113.10",
        identityHash: "email-hash",
        code: "AUTH_API_ERROR",
      }),
    );
  });

  it("returns parent payload and sets auth cookie on success", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: "parent@example.com",
          password: "password-123",
          displayName: "Parent",
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("ccth_session=token");
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
      "auth.signup.succeeded",
      expect.objectContaining({
        parentId: "parent-1",
        ip: "203.0.113.10",
      }),
    );
  });
});

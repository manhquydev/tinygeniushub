import { beforeEach, describe, expect, it, vi } from "vitest";
import { LifecycleEmailType } from "@prisma/client";
import { DomainError } from "@/modules/platform/errors";

const {
  assertTrustedOriginMock,
  assertRequestAllowedBySecurityControlsMock,
  getRateLimitPolicyMock,
  getAdminSecurityControlsMock,
  enforceRateLimitMock,
  getRequestIpMock,
  buildRateLimitIdentityMock,
  logInfoMock,
  logWarnMock,
  registerParentMock,
  issueParentEmailVerificationChallengeMock,
  enqueueLifecycleEmailMock,
} = vi.hoisted(() => ({
  assertTrustedOriginMock: vi.fn(),
  assertRequestAllowedBySecurityControlsMock: vi.fn(),
  getRateLimitPolicyMock: vi.fn(),
  getAdminSecurityControlsMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  getRequestIpMock: vi.fn(),
  buildRateLimitIdentityMock: vi.fn(),
  logInfoMock: vi.fn(),
  logWarnMock: vi.fn(),
  registerParentMock: vi.fn(),
  issueParentEmailVerificationChallengeMock: vi.fn(),
  enqueueLifecycleEmailMock: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  assertTrustedOrigin: assertTrustedOriginMock,
}));

vi.mock("@/modules/platform/security-access-guard", () => ({
  assertRequestAllowedBySecurityControls: assertRequestAllowedBySecurityControlsMock,
}));

vi.mock("@/modules/platform/security-policy-service", () => ({
  getRateLimitPolicy: getRateLimitPolicyMock,
  getAdminSecurityControls: getAdminSecurityControlsMock,
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

vi.mock("@/modules/identity/parent-email-verification-service", () => ({
  issueParentEmailVerificationChallenge: issueParentEmailVerificationChallengeMock,
}));

vi.mock("@/worker/queue", () => ({
  enqueueLifecycleEmail: enqueueLifecycleEmailMock,
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
    getAdminSecurityControlsMock.mockResolvedValue({
      ddosMode: "normal",
      globalLimitMultiplier: 1,
      blockedIpCidrs: [],
      readinessAllowlistCidrs: [],
      parentEmailVerificationRequired: true,
      parentEmailVerificationTokenTtlMinutes: 15,
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
    issueParentEmailVerificationChallengeMock.mockResolvedValue({
      expiresAt: new Date("2026-04-08T10:15:00.000Z"),
    });
    enqueueLifecycleEmailMock.mockResolvedValue(undefined);
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
          legalAccepted: true,
        }),
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe("Invalid request payload.");
    expect(Array.isArray(body.error.details?.issues)).toBe(true);
    expect(registerParentMock).not.toHaveBeenCalled();
  });

  it("returns 400 when legal consent is missing", async () => {
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

    expect(response.status).toBe(400);
    expect(body.error.message).toBe("Invalid request payload.");
    expect(body.error.details?.issues?.[0]?.path).toContain("legalAccepted");
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
          legalAccepted: true,
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
          legalAccepted: true,
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
          legalAccepted: true,
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

  it("returns verification-required payload after signup success", async () => {
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
          legalAccepted: true,
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(body).toEqual({
      ok: true,
      data: {
        parent: {
          id: "parent-1",
          email: "parent@example.com",
          displayName: "Parent",
        },
        verification: {
          required: true,
          emailDispatch: "queued",
          expiresAt: "2026-04-08T10:15:00.000Z",
        },
      },
    });
    expect(issueParentEmailVerificationChallengeMock).toHaveBeenCalledWith({
      parent: {
        id: "parent-1",
        email: "parent@example.com",
        displayName: "Parent",
      },
      ttlMinutes: 15,
    });
    expect(enqueueLifecycleEmailMock).not.toHaveBeenCalled();
  });

  it("still returns success when verification email enqueue fails", async () => {
    issueParentEmailVerificationChallengeMock.mockRejectedValueOnce(new Error("queue down"));

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
          legalAccepted: true,
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(body.data.verification).toEqual({
      required: true,
      emailDispatch: "failed",
      expiresAt: null,
    });
    expect(logWarnMock).toHaveBeenCalledWith(
      "auth.signup.verification_email_enqueue_failed",
      expect.objectContaining({
        parentId: "parent-1",
        ip: "203.0.113.10",
      }),
    );
  });

  it("queues lifecycle email directly when parent verification is disabled", async () => {
    getAdminSecurityControlsMock.mockResolvedValueOnce({
      ddosMode: "normal",
      globalLimitMultiplier: 1,
      blockedIpCidrs: [],
      readinessAllowlistCidrs: [],
      parentEmailVerificationRequired: false,
      parentEmailVerificationTokenTtlMinutes: 30,
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
          displayName: "Parent",
          legalAccepted: true,
        }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.verification).toEqual({
      required: false,
      emailDispatch: "not_required",
      expiresAt: null,
    });
    expect(issueParentEmailVerificationChallengeMock).not.toHaveBeenCalled();
    expect(enqueueLifecycleEmailMock).toHaveBeenCalledWith("parent-1", LifecycleEmailType.TRIAL_WELCOME);
  });

  it("registers parent with context and logs success", async () => {
    await POST(
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
          legalAccepted: true,
        }),
      }),
    );

    expect(registerParentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "parent@example.com",
        password: "password-123",
        displayName: "Parent",
        legalAccepted: true,
      }),
      expect.objectContaining({
        ipAddress: "203.0.113.10",
        userAgent: "unknown",
      }),
    );
    expect(logInfoMock).toHaveBeenCalledWith(
      "auth.signup.succeeded",
      expect.objectContaining({
        parentId: "parent-1",
        ip: "203.0.113.10",
        verificationRequired: true,
      }),
    );
  });
});

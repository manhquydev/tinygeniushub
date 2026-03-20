import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  assertTrustedOriginMock,
  assertRequestAllowedBySecurityControlsMock,
  getParentFromRequestMock,
  getRateLimitPolicyMock,
  getRequestIpMock,
  buildRateLimitIdentityMock,
  enforceRateLimitMock,
  deliverQueuedWeeklyReportEmailsMock,
  logInfoMock,
  logWarnMock,
} = vi.hoisted(() => ({
  assertTrustedOriginMock: vi.fn(),
  assertRequestAllowedBySecurityControlsMock: vi.fn(),
  getParentFromRequestMock: vi.fn(),
  getRateLimitPolicyMock: vi.fn(),
  getRequestIpMock: vi.fn(),
  buildRateLimitIdentityMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  deliverQueuedWeeklyReportEmailsMock: vi.fn(),
  logInfoMock: vi.fn(),
  logWarnMock: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  assertTrustedOrigin: assertTrustedOriginMock,
}));

vi.mock("@/modules/platform/security-access-guard", () => ({
  assertRequestAllowedBySecurityControls: assertRequestAllowedBySecurityControlsMock,
}));

vi.mock("@/lib/auth/session", () => ({
  getParentFromRequest: getParentFromRequestMock,
}));

vi.mock("@/modules/platform/security-policy-service", () => ({
  getRateLimitPolicy: getRateLimitPolicyMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
  getRequestIp: getRequestIpMock,
  buildRateLimitIdentity: buildRateLimitIdentityMock,
}));

vi.mock("@/modules/reports/email-delivery-service", () => ({
  deliverQueuedWeeklyReportEmails: deliverQueuedWeeklyReportEmailsMock,
}));

vi.mock("@/lib/observability/logger", () => ({
  logInfo: logInfoMock,
  logWarn: logWarnMock,
}));

import { POST } from "@/app/api/reports/send-email/route";

describe("reports send-email route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertTrustedOriginMock.mockImplementation(() => {});
    assertRequestAllowedBySecurityControlsMock.mockResolvedValue(undefined);
    getParentFromRequestMock.mockResolvedValue({
      id: "parent-1",
      email: "parent@example.com",
      displayName: "Parent",
    });
    getRateLimitPolicyMock.mockResolvedValue({
      limit: 10,
      windowMs: 60_000,
    });
    getRequestIpMock.mockReturnValue("203.0.113.20");
    buildRateLimitIdentityMock.mockReturnValue("parent-hash");
    enforceRateLimitMock.mockResolvedValue({
      allowed: true,
      remaining: 9,
      retryAfterMs: 0,
    });
    deliverQueuedWeeklyReportEmailsMock.mockResolvedValue({
      provider: "mock_email",
      queued: 1,
      sent: 1,
      skipped: 0,
      bounced: 0,
      claimedByOtherWorker: 0,
      requeuedStaleClaims: 0,
    });
  });

  it("returns 401 and logs unauthorized attempts", async () => {
    getParentFromRequestMock.mockResolvedValueOnce(null);

    const response = await POST(
      new Request("http://localhost/api/reports/send-email", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
        },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.message).toBe("Unauthorized");
    expect(logWarnMock).toHaveBeenCalledWith(
      "reports.send_email.unauthorized",
      expect.objectContaining({
        ip: "203.0.113.20",
      }),
    );
  });

  it("returns 429 and logs IP rate-limit events", async () => {
    enforceRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterMs: 12_000,
      reason: "quota_exceeded",
    });

    const response = await POST(
      new Request("http://localhost/api/reports/send-email", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
        },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.message).toBe("Too many email delivery requests. Please retry later.");
    expect(logWarnMock).toHaveBeenCalledWith(
      "reports.send_email.rate_limited",
      expect.objectContaining({
        scope: "ip",
        parentId: "parent-1",
        ip: "203.0.113.20",
        retryAfterMs: 12_000,
      }),
    );
  });

  it("returns 429 and logs parent rate-limit events", async () => {
    enforceRateLimitMock
      .mockResolvedValueOnce({
        allowed: true,
        remaining: 9,
        retryAfterMs: 0,
      })
      .mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        retryAfterMs: 30_000,
        reason: "quota_exceeded",
      });

    const response = await POST(
      new Request("http://localhost/api/reports/send-email", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
        },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.message).toBe("Too many email delivery requests. Please retry later.");
    expect(logWarnMock).toHaveBeenCalledWith(
      "reports.send_email.rate_limited",
      expect.objectContaining({
        scope: "parent",
        parentId: "parent-1",
        parentIdentityHash: "parent-hash",
        ip: "203.0.113.20",
        retryAfterMs: 30_000,
      }),
    );
  });

  it("returns queued delivery result and logs completion", async () => {
    const response = await POST(
      new Request("http://localhost/api/reports/send-email", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
        },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        result: {
          provider: "mock_email",
          queued: 1,
          sent: 1,
          skipped: 0,
          bounced: 0,
          claimedByOtherWorker: 0,
          requeuedStaleClaims: 0,
        },
      },
    });
    expect(logInfoMock).toHaveBeenCalledWith(
      "reports.send_email.completed",
      expect.objectContaining({
        parentId: "parent-1",
        ip: "203.0.113.20",
        provider: "mock_email",
        queued: 1,
        sent: 1,
      }),
    );
  });
});

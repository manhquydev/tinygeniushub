import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  assertTrustedOriginMock,
  getRequestIpMock,
  enforceRateLimitMock,
  createAuditLogMock,
} = vi.hoisted(() => ({
  assertTrustedOriginMock: vi.fn(),
  getRequestIpMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  createAuditLogMock: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  assertTrustedOrigin: assertTrustedOriginMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  getRequestIp: getRequestIpMock,
  enforceRateLimit: enforceRateLimitMock,
}));

vi.mock("@/modules/platform/audit-service", () => ({
  createAuditLog: createAuditLogMock,
}));

import { POST } from "@/app/api/legal/cookie-consent/route";
import { LEGAL_POLICY_VERSION } from "@/lib/legal/legal-policy-version";

describe("legal cookie consent route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertTrustedOriginMock.mockImplementation(() => {});
    getRequestIpMock.mockReturnValue("203.0.113.10");
    enforceRateLimitMock.mockResolvedValue({
      allowed: true,
      remaining: 59,
      retryAfterMs: 0,
    });
    createAuditLogMock.mockResolvedValue({});
  });

  it("records cookie consent audit", async () => {
    const response = await POST(
      new Request("http://localhost/api/legal/cookie-consent", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          consent: {
            version: LEGAL_POLICY_VERSION,
            necessary: true,
            analytics: true,
            marketing: true,
            updatedAt: new Date().toISOString(),
          },
          source: "all",
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(enforceRateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "legal:cookie-consent:ip:203.0.113.10",
        limit: 60,
        windowMs: 60_000,
        storeFailureMode: "deny",
      }),
    );
    expect(createAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: "visitor",
        action: "COOKIE_CONSENT_UPDATED",
        resourceType: "cookie_consent",
      }),
    );
  });

  it("returns 409 for stale policy version", async () => {
    const response = await POST(
      new Request("http://localhost/api/legal/cookie-consent", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          consent: {
            version: "2020-01-01",
            necessary: true,
            analytics: true,
            marketing: false,
            updatedAt: new Date().toISOString(),
          },
          source: "necessary",
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(409);
    expect(body.error.message).toBe("Stale legal policy version");
    expect(createAuditLogMock).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/legal/cookie-consent", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          consent: {
            version: LEGAL_POLICY_VERSION,
            necessary: false,
          },
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error.message).toBe("Invalid request payload.");
    expect(createAuditLogMock).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limit is exceeded", async () => {
    enforceRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterMs: 1_200,
    });

    const response = await POST(
      new Request("http://localhost/api/legal/cookie-consent", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          consent: {
            version: LEGAL_POLICY_VERSION,
            necessary: true,
            analytics: false,
            marketing: false,
            updatedAt: new Date().toISOString(),
          },
          source: "necessary",
        }),
      }),
    );

    const body = await response.json();
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("2");
    expect(body.error.message).toBe("Too many requests. Please retry later.");
    expect(createAuditLogMock).not.toHaveBeenCalled();
  });

  it("uses user-agent key when ip is unknown", async () => {
    getRequestIpMock.mockReturnValueOnce("unknown");

    const response = await POST(
      new Request("http://localhost/api/legal/cookie-consent", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
          "content-type": "application/json",
          "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        },
        body: JSON.stringify({
          consent: {
            version: LEGAL_POLICY_VERSION,
            necessary: true,
            analytics: false,
            marketing: false,
            updatedAt: new Date().toISOString(),
          },
          source: "necessary",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(enforceRateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        key: expect.stringMatching(/^legal:cookie-consent:ua:/),
        limit: 60,
        windowMs: 60_000,
        storeFailureMode: "deny",
      }),
    );
  });
});

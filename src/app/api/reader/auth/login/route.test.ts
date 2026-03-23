import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  assertTrustedOriginMock,
  assertRequestAllowedBySecurityControlsMock,
  getRequestIpMock,
  buildRateLimitIdentityMock,
  enforceRateLimitMock,
  getRateLimitPolicyMock,
  loginReaderMock,
} = vi.hoisted(() => ({
  assertTrustedOriginMock: vi.fn(),
  assertRequestAllowedBySecurityControlsMock: vi.fn(),
  getRequestIpMock: vi.fn(),
  buildRateLimitIdentityMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  getRateLimitPolicyMock: vi.fn(),
  loginReaderMock: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  assertTrustedOrigin: assertTrustedOriginMock,
}));

vi.mock("@/modules/platform/security-access-guard", () => ({
  assertRequestAllowedBySecurityControls: assertRequestAllowedBySecurityControlsMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  getRequestIp: getRequestIpMock,
  buildRateLimitIdentity: buildRateLimitIdentityMock,
  enforceRateLimit: enforceRateLimitMock,
}));

vi.mock("@/modules/platform/security-policy-service", () => ({
  getRateLimitPolicy: getRateLimitPolicyMock,
}));

vi.mock("@/modules/reader/reader-auth-service", () => ({
  READER_SESSION_COOKIE_NAME: "ccth_reader_session",
  READER_SESSION_MAX_AGE_SECONDS: 60 * 60 * 24 * 7,
  loginReader: loginReaderMock,
}));

import { POST } from "@/app/api/reader/auth/login/route";

describe("reader auth login route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertTrustedOriginMock.mockImplementation(() => {});
    assertRequestAllowedBySecurityControlsMock.mockResolvedValue(undefined);
    getRequestIpMock.mockReturnValue("203.0.113.10");
    buildRateLimitIdentityMock.mockReturnValue("email-bucket");
    getRateLimitPolicyMock.mockResolvedValue({ limit: 10, windowMs: 60_000 });
    enforceRateLimitMock
      .mockResolvedValueOnce({ allowed: true, remaining: 9 })
      .mockResolvedValueOnce({ allowed: true, remaining: 9 });
    loginReaderMock.mockResolvedValue({
      reader: {
        id: "reader-1",
        email: "reader@example.com",
      },
      sessionToken: "session-token",
    });
  });

  it("logs in reader and sets session cookie", async () => {
    const response = await POST(
      new Request("http://localhost/api/reader/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          email: "reader@example.com",
          password: "secret123",
        }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.reader.email).toBe("reader@example.com");
    expect(response.headers.get("set-cookie")).toContain("ccth_reader_session=session-token");
  });

  it("returns 429 when rate limit is exceeded", async () => {
    enforceRateLimitMock.mockReset();
    enforceRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      retryAfterMs: 15_000,
    });

    const response = await POST(
      new Request("http://localhost/api/reader/auth/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({
          email: "reader@example.com",
          password: "secret123",
        }),
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.error.message).toContain("Too many login attempts");
  });
});

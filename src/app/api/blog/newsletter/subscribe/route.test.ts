import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  assertTrustedOriginMock,
  getRequestIpMock,
  buildRateLimitIdentityMock,
  enforceRateLimitMock,
  subscribeMock,
} = vi.hoisted(() => ({
  assertTrustedOriginMock: vi.fn(),
  getRequestIpMock: vi.fn(),
  buildRateLimitIdentityMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
  subscribeMock: vi.fn(),
}));

vi.mock("@/lib/security/csrf", () => ({
  assertTrustedOrigin: assertTrustedOriginMock,
}));

vi.mock("@/lib/rate-limit", () => ({
  getRequestIp: getRequestIpMock,
  buildRateLimitIdentity: buildRateLimitIdentityMock,
  enforceRateLimit: enforceRateLimitMock,
}));

vi.mock("@/modules/blog/newsletter-service", () => ({
  newsletterService: {
    subscribe: subscribeMock,
  },
}));

import { POST } from "@/app/api/blog/newsletter/subscribe/route";

describe("blog newsletter subscribe route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertTrustedOriginMock.mockImplementation(() => {});
    getRequestIpMock.mockReturnValue("203.0.113.20");
    buildRateLimitIdentityMock.mockImplementation((value: string) => `hash:${value}`);
    enforceRateLimitMock
      .mockResolvedValueOnce({
        allowed: true,
        remaining: 9,
      })
      .mockResolvedValueOnce({
        allowed: true,
        remaining: 2,
      });
    subscribeMock.mockResolvedValue({ token: "verify-token" });
  });

  it("returns 429 when ip bucket is exceeded", async () => {
    enforceRateLimitMock.mockReset();
    enforceRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterMs: 30_000,
    });

    const response = await POST(
      new Request("http://localhost/api/blog/newsletter/subscribe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({ email: "parent@example.com" }),
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(subscribeMock).not.toHaveBeenCalled();
  });

  it("returns 429 when email bucket is exceeded", async () => {
    enforceRateLimitMock.mockReset();
    enforceRateLimitMock
      .mockResolvedValueOnce({
        allowed: true,
        remaining: 9,
      })
      .mockResolvedValueOnce({
        allowed: false,
        remaining: 0,
        retryAfterMs: 60_000,
      });

    const response = await POST(
      new Request("http://localhost/api/blog/newsletter/subscribe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({ email: "parent@example.com" }),
      }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(subscribeMock).not.toHaveBeenCalled();
  });

  it("returns 400 when body is invalid JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/blog/newsletter/subscribe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: "{invalid-json",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.message).toBe("Invalid JSON payload");
    expect(subscribeMock).not.toHaveBeenCalled();
  });

  it("subscribes valid requests", async () => {
    const response = await POST(
      new Request("http://localhost/api/blog/newsletter/subscribe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost",
          host: "localhost",
        },
        body: JSON.stringify({ email: "Parent@Example.com", nameVi: "Phu huynh" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      message: "Please check your email to confirm subscription",
    });
    expect(subscribeMock).toHaveBeenCalledWith("Parent@Example.com", {
      nameVi: "Phu huynh",
    });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getParentFromRequestMock,
  getReferralSummaryForParentMock,
  getReferralSummaryForParentReadOnlyMock,
  assertTrustedOriginMock,
  assertRequestAllowedBySecurityControlsMock,
  getRateLimitPolicyMock,
  getRequestIpMock,
  enforceRateLimitMock,
} = vi.hoisted(() => ({
  getParentFromRequestMock: vi.fn(),
  getReferralSummaryForParentMock: vi.fn(),
  getReferralSummaryForParentReadOnlyMock: vi.fn(),
  assertTrustedOriginMock: vi.fn(),
  assertRequestAllowedBySecurityControlsMock: vi.fn(),
  getRateLimitPolicyMock: vi.fn(),
  getRequestIpMock: vi.fn(),
  enforceRateLimitMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getParentFromRequest: getParentFromRequestMock,
}));

vi.mock("@/modules/referral/service", () => ({
  getReferralSummaryForParent: getReferralSummaryForParentMock,
  getReferralSummaryForParentReadOnly: getReferralSummaryForParentReadOnlyMock,
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
  buildRateLimitIdentity: (value: string) => value,
  enforceRateLimit: enforceRateLimitMock,
  getRequestIp: getRequestIpMock,
}));

import { GET, POST } from "@/app/api/referrals/me/route";

describe("referrals/me route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getParentFromRequestMock.mockResolvedValue({
      id: "parent-1",
    });
    assertTrustedOriginMock.mockImplementation(() => {});
    assertRequestAllowedBySecurityControlsMock.mockResolvedValue(undefined);
    getRateLimitPolicyMock.mockResolvedValue({
      limit: 30,
      windowMs: 600_000,
    });
    getRequestIpMock.mockReturnValue("203.0.113.10");
    enforceRateLimitMock.mockResolvedValue({
      allowed: true,
      retryAfterMs: null,
    });
  });

  it("GET uses read-only referral summary helper", async () => {
    getReferralSummaryForParentReadOnlyMock.mockResolvedValueOnce({
      code: null,
      totalReferrals: 0,
      paidReferrals: 0,
      rewardedReferrals: 0,
    });

    const response = await GET(new Request("http://localhost/api/referrals/me") as never);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getReferralSummaryForParentReadOnlyMock).toHaveBeenCalledWith("parent-1");
    expect(getReferralSummaryForParentMock).not.toHaveBeenCalled();
    expect(body.ok).toBe(true);
  });

  it("POST provisions referral summary with mutation helper", async () => {
    getReferralSummaryForParentMock.mockResolvedValueOnce({
      code: "ABCD1234",
      totalReferrals: 1,
      paidReferrals: 0,
      rewardedReferrals: 0,
    });

    const response = await POST(
      new Request("http://localhost/api/referrals/me", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          host: "localhost",
        },
      }) as never,
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(getReferralSummaryForParentMock).toHaveBeenCalledWith("parent-1");
    expect(body.ok).toBe(true);
  });
});

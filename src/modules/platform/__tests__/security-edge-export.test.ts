import { describe, expect, it } from "vitest";
import { buildSecurityEdgePolicyExport } from "@/modules/platform/security-edge-export";

describe("buildSecurityEdgePolicyExport", () => {
  it("builds route recommendations from current controls and policies", () => {
    const result = buildSecurityEdgePolicyExport({
      controls: {
        ddosMode: "emergency",
        globalLimitMultiplier: 0.6,
        blockedIpCidrs: ["203.0.113.0/24"],
        readinessAllowlistCidrs: ["10.0.0.0/8"],
        parentEmailVerificationRequired: true,
        parentEmailVerificationTokenTtlMinutes: 15,
      },
      policies: [
        {
          key: "auth.login.ip",
          label: "Auth login / IP",
          description: "",
          keyStrategy: "ip",
          defaultLimit: 20,
          defaultWindowMs: 600_000,
          minLimit: 5,
          maxLimit: 300,
          minWindowMs: 60_000,
          maxWindowMs: 3_600_000,
          currentLimit: 20,
          currentWindowMs: 600_000,
          effectiveLimit: 12,
          effectiveWindowMs: 600_000,
        },
      ],
    });

    expect(result.profile.ddosMode).toBe("emergency");
    expect(result.ipControls.blockedIpCidrs).toEqual(["203.0.113.0/24"]);
    expect(result.routes).toHaveLength(1);
    expect(result.routes[0]?.routeId).toBe("auth_login");
    expect(result.routes[0]?.edgeRecommendation.requestsPerPeriod).toBe(12);
    expect(result.routes[0]?.edgeRecommendation.action).toBe("block");
  });
});

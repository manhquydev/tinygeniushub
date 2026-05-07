import { describe, expect, it } from "vitest";
import {
  adminSecurityControlsSchema,
  applySecurityControlsToPolicy,
  clampRateLimitPolicy,
  getDefaultRateLimitPolicies,
  rateLimitPolicyOverridesSchema,
} from "@/modules/platform/security-policy";

describe("security policy defaults", () => {
  it("returns default policies with known keys", () => {
    const defaults = getDefaultRateLimitPolicies();
    expect(defaults["auth.login.ip"].limit).toBeGreaterThan(0);
    expect(defaults["learning.watch.heartbeat.parent"].windowMs).toBeGreaterThan(0);
  });
});

describe("rateLimitPolicyOverridesSchema", () => {
  it("rejects unknown policy key", () => {
    const parsed = rateLimitPolicyOverridesSchema.safeParse({
      "unknown.policy.key": { limit: 10, windowMs: 1000 },
    });
    expect(parsed.success).toBe(false);
  });
});

describe("clampRateLimitPolicy", () => {
  it("clamps values into configured safety range", () => {
    const result = clampRateLimitPolicy("auth.login.ip", {
      limit: 100000,
      windowMs: 1,
    });

    expect(result.limit).toBeLessThanOrEqual(300);
    expect(result.windowMs).toBeGreaterThanOrEqual(1000 * 60);
  });
});

describe("adminSecurityControlsSchema", () => {
  it("normalizes and deduplicates cidr entries", () => {
    const parsed = adminSecurityControlsSchema.parse({
      ddosMode: "elevated",
      globalLimitMultiplier: 0.8,
      blockedIpCidrs: ["203.0.113.0/24", "203.0.113.0/24", "2001:DB8::1"],
      readinessAllowlistCidrs: ["10.0.0.0/8"],
      parentEmailVerificationRequired: true,
      parentEmailVerificationTokenTtlMinutes: 15,
    });

    expect(parsed.blockedIpCidrs).toEqual(["203.0.113.0/24", "2001:db8::1"]);
    expect(parsed.readinessAllowlistCidrs).toEqual(["10.0.0.0/8"]);
  });
});

describe("applySecurityControlsToPolicy", () => {
  it("scales limit based on ddos mode and global multiplier", () => {
    const effective = applySecurityControlsToPolicy(
      "learning.watch.session.ip",
      { limit: 120, windowMs: 10 * 60 * 1000 },
      {
        ddosMode: "elevated",
        globalLimitMultiplier: 0.5,
        blockedIpCidrs: [],
        readinessAllowlistCidrs: [],
        parentEmailVerificationRequired: true,
        parentEmailVerificationTokenTtlMinutes: 15,
      },
    );

    expect(effective.limit).toBe(48);
    expect(effective.windowMs).toBe(10 * 60 * 1000);
  });
});

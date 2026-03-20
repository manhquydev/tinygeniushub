import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/modules/platform/errors";
import { getDefaultRateLimitPolicies } from "@/modules/platform/security-policy";

const {
  adminSecurityFindUniqueMock,
  adminSecurityUpsertMock,
  createAuditLogMock,
  logWarnMock,
} = vi.hoisted(() => ({
  adminSecurityFindUniqueMock: vi.fn(),
  adminSecurityUpsertMock: vi.fn(),
  createAuditLogMock: vi.fn(),
  logWarnMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    adminSecuritySettings: {
      findUnique: adminSecurityFindUniqueMock,
      upsert: adminSecurityUpsertMock,
    },
  },
}));

vi.mock("@/lib/env", () => ({
  env: {
    NODE_ENV: "production",
  },
}));

vi.mock("@/modules/platform/audit-service", () => ({
  createAuditLog: createAuditLogMock,
}));

vi.mock("@/lib/observability/logger", () => ({
  logWarn: logWarnMock,
}));

import {
  getAdminSecuritySettings,
  getEffectiveSecuritySettings,
  getRateLimitPolicy,
  updateAdminRateLimitPolicies,
} from "@/modules/platform/security-policy-service";

describe("security-policy-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    adminSecurityFindUniqueMock.mockResolvedValue(null);
    adminSecurityUpsertMock.mockResolvedValue({});
    createAuditLogMock.mockResolvedValue({});
  });

  it("returns defaults when no security settings row exists", async () => {
    const settings = await getEffectiveSecuritySettings({ forceRefresh: true });

    const defaults = getDefaultRateLimitPolicies();
    expect(settings.policies["auth.login.ip"]).toEqual(defaults["auth.login.ip"]);
    expect(settings.controls.ddosMode).toBe("normal");
    expect(adminSecurityFindUniqueMock).toHaveBeenCalledTimes(1);
  });

  it("applies persisted overrides and controls to effective policy", async () => {
    adminSecurityFindUniqueMock.mockResolvedValue({
      rateLimitPolicies: {
        "auth.login.ip": {
          limit: 40,
          windowMs: 10 * 60 * 1000,
        },
      },
      securityControls: {
        ddosMode: "emergency",
        globalLimitMultiplier: 0.5,
        blockedIpCidrs: [],
        readinessAllowlistCidrs: [],
      },
    });

    await getEffectiveSecuritySettings({ forceRefresh: true });
    const effective = await getRateLimitPolicy("auth.login.ip");
    const adminSettings = await getAdminSecuritySettings();
    const loginPolicyRow = adminSettings.policies.find((policy) => policy.key === "auth.login.ip");

    expect(effective.limit).toBe(12);
    expect(effective.windowMs).toBe(10 * 60 * 1000);
    expect(loginPolicyRow?.currentLimit).toBe(40);
    expect(loginPolicyRow?.effectiveLimit).toBe(12);
  });

  it("falls back to defaults and logs warning when stored overrides are invalid", async () => {
    adminSecurityFindUniqueMock.mockResolvedValue({
      rateLimitPolicies: {
        "unknown.policy.key": {
          limit: 10,
          windowMs: 5_000,
        },
      },
      securityControls: null,
    });

    const settings = await getEffectiveSecuritySettings({ forceRefresh: true });

    expect(settings.policies["auth.login.ip"]).toEqual(getDefaultRateLimitPolicies()["auth.login.ip"]);
    expect(logWarnMock).toHaveBeenCalledWith(
      "security.rate_limit.override_invalid",
      expect.objectContaining({
        issues: expect.any(Array),
      }),
    );
  });

  it("sanitizes overrides, persists settings, and writes audit log on update", async () => {
    await getEffectiveSecuritySettings({ forceRefresh: true });

    await updateAdminRateLimitPolicies({
      actorId: "admin-1",
      input: {
        overrides: {
          "auth.login.ip": {
            limit: 99_999,
            windowMs: 1_000,
          },
        },
        controls: {
          ddosMode: "elevated",
          globalLimitMultiplier: 0.75,
          blockedIpCidrs: ["203.0.113.0/24"],
          readinessAllowlistCidrs: [],
        },
        reason: "Rotate and tighten auth controls",
      },
    });

    expect(adminSecurityUpsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "default" },
        update: expect.objectContaining({
          rateLimitPolicies: {
            "auth.login.ip": {
              limit: 300,
              windowMs: 60_000,
            },
          },
        }),
      }),
    );
    expect(createAuditLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actorType: "admin",
        actorId: "admin-1",
        action: "security.rate_limit.policies.updated",
      }),
    );
  });

  it("throws SECURITY_SETTINGS_UNAVAILABLE when persistence fails", async () => {
    await getEffectiveSecuritySettings({ forceRefresh: true });
    adminSecurityUpsertMock.mockRejectedValueOnce(new Error("write failed"));

    await expect(
      updateAdminRateLimitPolicies({
        actorId: "admin-1",
        input: {
          overrides: {
            "auth.login.ip": {
              limit: 30,
              windowMs: 60_000,
            },
          },
          reason: "Fallback test reason",
        },
      }),
    ).rejects.toMatchObject({
      name: "DomainError",
      code: "SECURITY_SETTINGS_UNAVAILABLE",
      status: 503,
    } satisfies Partial<DomainError>);

    expect(logWarnMock).toHaveBeenCalledWith(
      "security.rate_limit.settings_write_failed",
      expect.objectContaining({
        message: "write failed",
      }),
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getAdminSecurityControls } from "@/modules/platform/security-policy-service";
import { getRequestIp } from "@/lib/rate-limit";

vi.mock("@/modules/platform/security-policy-service", () => ({
  getAdminSecurityControls: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  getRequestIp: vi.fn(),
}));

describe("assertRequestAllowedBySecurityControls", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("blocks requests from blocked cidr", async () => {
    vi.mocked(getRequestIp).mockReturnValue("203.0.113.42");
    vi.mocked(getAdminSecurityControls).mockResolvedValue({
      ddosMode: "normal",
      globalLimitMultiplier: 1,
      blockedIpCidrs: ["203.0.113.0/24"],
      readinessAllowlistCidrs: [],
    });

    await expect(assertRequestAllowedBySecurityControls(new Request("http://localhost"))).rejects.toMatchObject({
      code: "SECURITY_IP_BLOCKED",
      status: 403,
    });
  });

  it("denies readiness probe outside allowlist", async () => {
    vi.mocked(getRequestIp).mockReturnValue("198.51.100.10");
    vi.mocked(getAdminSecurityControls).mockResolvedValue({
      ddosMode: "normal",
      globalLimitMultiplier: 1,
      blockedIpCidrs: [],
      readinessAllowlistCidrs: ["10.0.0.0/8"],
    });

    await expect(
      assertRequestAllowedBySecurityControls(new Request("http://localhost"), {
        enforceReadinessAllowlist: true,
      }),
    ).rejects.toMatchObject({
      code: "SECURITY_READINESS_IP_DENIED",
      status: 403,
    });
  });

  it("allows request when no blocking rules apply", async () => {
    vi.mocked(getRequestIp).mockReturnValue("198.51.100.10");
    vi.mocked(getAdminSecurityControls).mockResolvedValue({
      ddosMode: "normal",
      globalLimitMultiplier: 1,
      blockedIpCidrs: ["203.0.113.0/24"],
      readinessAllowlistCidrs: [],
    });

    await expect(assertRequestAllowedBySecurityControls(new Request("http://localhost"))).resolves.toBeUndefined();
  });

  it("denies readiness allowlist checks when source ip is unresolved", async () => {
    vi.mocked(getRequestIp).mockReturnValue("unknown");
    vi.mocked(getAdminSecurityControls).mockResolvedValue({
      ddosMode: "normal",
      globalLimitMultiplier: 1,
      blockedIpCidrs: [],
      readinessAllowlistCidrs: ["10.0.0.0/8"],
    });

    await expect(
      assertRequestAllowedBySecurityControls(new Request("http://localhost"), {
        enforceReadinessAllowlist: true,
      }),
    ).rejects.toMatchObject({
      code: "SECURITY_IP_UNRESOLVED",
      status: 403,
    });
  });

  it("denies blocked-ip enforcement checks when source ip is unresolved", async () => {
    vi.mocked(getRequestIp).mockReturnValue("unknown");
    vi.mocked(getAdminSecurityControls).mockResolvedValue({
      ddosMode: "normal",
      globalLimitMultiplier: 1,
      blockedIpCidrs: ["203.0.113.0/24"],
      readinessAllowlistCidrs: [],
    });

    await expect(assertRequestAllowedBySecurityControls(new Request("http://localhost"))).rejects.toMatchObject({
      code: "SECURITY_IP_UNRESOLVED",
      status: 403,
    });
  });
});

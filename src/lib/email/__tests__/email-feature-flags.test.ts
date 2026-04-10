import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock } = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    featureFlag: {
      findUnique: findUniqueMock,
    },
  },
}));

import { isEmailFeatureEnabled, resolveEmailFeatureFlagKey } from "@/lib/email/email-feature-flags";

describe("email-feature-flags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUniqueMock.mockReset();
  });

  it("maps feature tag to email flag key", () => {
    expect(resolveEmailFeatureFlagKey("weekly_report")).toBe("EMAIL_WEEKLY_REPORT_ENABLED");
    expect(resolveEmailFeatureFlagKey("unknown_feature")).toBeNull();
  });

  it("allows unknown feature tags by default", async () => {
    await expect(isEmailFeatureEnabled("unknown_feature")).resolves.toBe(true);
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns db state when mapped flag exists", async () => {
    findUniqueMock.mockResolvedValueOnce({ enabled: false });
    await expect(isEmailFeatureEnabled("weekly_report")).resolves.toBe(false);
  });

  it("fails open when mapped flag missing or settings read fails", async () => {
    findUniqueMock.mockResolvedValueOnce(null);
    await expect(isEmailFeatureEnabled("weekly_report")).resolves.toBe(true);

    findUniqueMock.mockRejectedValueOnce(new Error("db down"));
    await expect(isEmailFeatureEnabled("weekly_report")).resolves.toBe(true);
  });
});

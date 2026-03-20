import { addHours } from "date-fns";
import { SubscriptionStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { isEligibleForAutoCharge } from "@/modules/billing/renewal-service";

describe("isEligibleForAutoCharge", () => {
  const now = new Date("2026-02-20T12:00:00.000Z");

  it("returns true for active standard subscription with autoRenew and due period", () => {
    expect(
      isEligibleForAutoCharge({
        status: SubscriptionStatus.ACTIVE_STANDARD,
        autoRenew: true,
        currentPeriodEnd: now,
        asOf: now,
      }),
    ).toBe(true);
  });

  it("returns false for trial status", () => {
    expect(
      isEligibleForAutoCharge({
        status: SubscriptionStatus.TRIALING,
        autoRenew: true,
        currentPeriodEnd: now,
        asOf: now,
      }),
    ).toBe(false);
  });

  it("returns false when autoRenew is disabled", () => {
    expect(
      isEligibleForAutoCharge({
        status: SubscriptionStatus.ACTIVE_FAMILYPLUS,
        autoRenew: false,
        currentPeriodEnd: now,
        asOf: now,
      }),
    ).toBe(false);
  });

  it("returns false when period is not due yet", () => {
    expect(
      isEligibleForAutoCharge({
        status: SubscriptionStatus.ACTIVE_STANDARD,
        autoRenew: true,
        currentPeriodEnd: addHours(now, 24),
        asOf: now,
      }),
    ).toBe(false);
  });
});

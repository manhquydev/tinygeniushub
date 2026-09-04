import { describe, expect, it } from "vitest";
import { ENTITLEMENT_GRACE_DAYS, resolveGraceUntil, resolvePeriodEnd } from "@/modules/billing/billing-period";

describe("resolvePeriodEnd", () => {
  const start = new Date("2026-02-20T10:00:00.000Z");

  it("uses addMonths for MONTHLY_STANDARD", () => {
    expect(resolvePeriodEnd("MONTHLY_STANDARD", start)).toEqual(new Date("2026-03-20T10:00:00.000Z"));
  });

  it("uses addYears for yearly plans", () => {
    expect(resolvePeriodEnd("YEARLY_STANDARD", start)).toEqual(new Date("2027-02-20T10:00:00.000Z"));
  });

  it("prefers Stripe current_period_end when present", () => {
    const stripeEnd = new Date("2026-03-01T00:00:00.000Z");
    expect(resolvePeriodEnd("YEARLY_STANDARD", start, stripeEnd)).toEqual(stripeEnd);
  });
});

describe("resolveGraceUntil", () => {
  it(`adds ${ENTITLEMENT_GRACE_DAYS} days`, () => {
    expect(resolveGraceUntil(new Date("2026-02-20T10:00:00.000Z"))).toEqual(
      new Date("2026-02-23T10:00:00.000Z"),
    );
  });
});

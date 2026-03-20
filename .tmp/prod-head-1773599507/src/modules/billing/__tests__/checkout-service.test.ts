import { describe, expect, it } from "vitest";
import { DomainError } from "@/modules/platform/errors";
import { createCheckoutSchema, resolveCheckoutAbsoluteUrl } from "@/modules/billing/checkout-service";
import { getPayablePlanConfig } from "@/modules/billing/plan-config";

describe("createCheckoutSchema", () => {
  it("accepts yearly payable plans only", () => {
    const parsed = createCheckoutSchema.parse({
      planCode: "YEARLY_STANDARD",
      successPath: "/parent/dashboard",
      cancelPath: "/pricing",
    });

    expect(parsed.planCode).toBe("YEARLY_STANDARD");
  });

  it("rejects TRIAL plan", () => {
    expect(() =>
      createCheckoutSchema.parse({
        planCode: "TRIAL",
      }),
    ).toThrow();
  });
});

describe("resolveCheckoutAbsoluteUrl", () => {
  it("builds absolute url from safe path", () => {
    const result = resolveCheckoutAbsoluteUrl("/parent/dashboard");
    expect(result).toContain("/parent/dashboard");
  });

  it("rejects unsafe redirect path", () => {
    let thrown: unknown;
    try {
      resolveCheckoutAbsoluteUrl("https://malicious.example");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(DomainError);
  });
});

describe("getPayablePlanConfig", () => {
  it("returns expected limits for family plan", () => {
    const plan = getPayablePlanConfig("YEARLY_FAMILY_PLUS");
    expect(plan.childProfileLimit).toBe(5);
    expect(plan.portfolioRetentionMaxDays).toBe(365);
    expect(plan.amountVnd).toBeGreaterThan(0);
  });
});

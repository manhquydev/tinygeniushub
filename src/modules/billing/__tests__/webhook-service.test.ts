import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { env } from "@/lib/env";
import {
  isValidBillingSignature,
  resolveSubscriptionPlanConfig,
} from "@/modules/billing/webhook-service";

describe("resolveSubscriptionPlanConfig", () => {
  it("returns subscription-safe fields without amountVnd", () => {
    const config = resolveSubscriptionPlanConfig("YEARLY_STANDARD");

    expect(config).toEqual({
      childProfileLimit: 3,
      caregiverLimit: 2,
      portfolioRetentionMaxDays: 90,
      status: "ACTIVE_STANDARD",
    });
    expect("amountVnd" in config).toBe(false);
  });
});

describe("isValidBillingSignature", () => {
  it("accepts valid HMAC signatures and rejects invalid ones", () => {
    const rawBody = JSON.stringify({
      provider: "mock_gateway",
      eventId: "evt_1",
      eventType: "payment_succeeded",
    });
    const validSignature = createHmac("sha256", env.BILLING_WEBHOOK_SECRET).update(rawBody).digest("hex");

    expect(isValidBillingSignature(rawBody, validSignature)).toBe(true);
    expect(isValidBillingSignature(rawBody, `${validSignature}00`)).toBe(false);
    expect(isValidBillingSignature(rawBody, null)).toBe(false);
  });
});

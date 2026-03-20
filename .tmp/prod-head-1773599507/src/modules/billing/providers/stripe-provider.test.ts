import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/modules/platform/errors";

const { envMock } = vi.hoisted(() => ({
  envMock: {
    STRIPE_SECRET_KEY: "sk_test_123",
    STRIPE_API_BASE_URL: "https://api.stripe.com",
  },
}));

vi.mock("@/lib/env", () => ({
  env: envMock,
}));

import { StripeBillingProviderAdapter } from "@/modules/billing/providers/stripe-provider";

describe("StripeBillingProviderAdapter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    envMock.STRIPE_SECRET_KEY = "sk_test_123";
    envMock.STRIPE_API_BASE_URL = "https://api.stripe.com";
  });

  it("throws misconfigured error when stripe key is missing", async () => {
    envMock.STRIPE_SECRET_KEY = "";

    const adapter = new StripeBillingProviderAdapter();
    await expect(
      adapter.createCheckoutSession({
        parentId: "parent-1",
        parentEmail: "parent@example.com",
        planCode: "YEARLY_STANDARD",
        amountVnd: 120_000,
        successUrl: "https://app.example/success",
        cancelUrl: "https://app.example/cancel",
      }),
    ).rejects.toMatchObject({
      code: "BILLING_PROVIDER_MISCONFIGURED",
    } satisfies Partial<DomainError>);
  });

  it("creates and maps checkout session from stripe response", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "cs_test_abc",
        url: "https://checkout.stripe.com/pay/cs_test_abc",
        expires_at: 1_777_777_777,
      }),
    } as Response);

    const adapter = new StripeBillingProviderAdapter();
    const result = await adapter.createCheckoutSession({
      parentId: "parent-1",
      parentEmail: "parent@example.com",
      planCode: "YEARLY_STANDARD",
      amountVnd: 120_000,
      successUrl: "https://app.example/success",
      cancelUrl: "https://app.example/cancel",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.stripe.com/v1/checkout/sessions",
      expect.objectContaining({
        method: "POST",
      }),
    );
    expect(result).toEqual({
      provider: "stripe",
      externalSessionId: "cs_test_abc",
      checkoutUrl: "https://checkout.stripe.com/pay/cs_test_abc",
      expiresAt: new Date(1_777_777_777 * 1000),
    });
  });

  it("throws request-failed error when stripe response is not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "bad request" } }),
    } as Response);

    const adapter = new StripeBillingProviderAdapter();
    await expect(
      adapter.createCheckoutSession({
        parentId: "parent-1",
        parentEmail: "parent@example.com",
        planCode: "YEARLY_STANDARD",
        amountVnd: 120_000,
        successUrl: "https://app.example/success",
        cancelUrl: "https://app.example/cancel",
      }),
    ).rejects.toMatchObject({
      code: "BILLING_PROVIDER_REQUEST_FAILED",
    } satisfies Partial<DomainError>);
  });
});

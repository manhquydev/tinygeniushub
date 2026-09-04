import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/modules/platform/errors";

const { envMock } = vi.hoisted(() => ({
  envMock: {
    STRIPE_SECRET_KEY: "sk_test_123",
    STRIPE_API_BASE_URL: "https://api.stripe.com",
    STRIPE_PRICE_ID_MONTHLY: "price_monthly",
    STRIPE_PRICE_ID_YEARLY: "price_yearly",
  },
}));

vi.mock("@/lib/env", () => ({
  env: envMock,
}));

import { StripeBillingProviderAdapter } from "@/modules/billing/providers/stripe-provider";

const yearlyInput = {
  parentId: "parent-1",
  parentEmail: "parent@example.com",
  planCode: "YEARLY_STANDARD" as const,
  amountVnd: 120_000,
  successUrl: "https://app.example/success",
  cancelUrl: "https://app.example/cancel",
};

function postedForm(fetchMock: { mock: { calls: unknown[][] } }) {
  const init = fetchMock.mock.calls[0]?.[1] as { body?: string };
  return new URLSearchParams(init.body ?? "");
}

describe("StripeBillingProviderAdapter", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    envMock.STRIPE_SECRET_KEY = "sk_test_123";
    envMock.STRIPE_API_BASE_URL = "https://api.stripe.com";
    envMock.STRIPE_PRICE_ID_MONTHLY = "price_monthly";
    envMock.STRIPE_PRICE_ID_YEARLY = "price_yearly";
  });

  it("throws misconfigured error when stripe key is missing", async () => {
    envMock.STRIPE_SECRET_KEY = "";

    const adapter = new StripeBillingProviderAdapter();
    await expect(adapter.createCheckoutSession(yearlyInput)).rejects.toMatchObject({
      code: "BILLING_PROVIDER_MISCONFIGURED",
    } satisfies Partial<DomainError>);
  });

  it("fail-closes when recurring price id is missing", async () => {
    envMock.STRIPE_PRICE_ID_YEARLY = "";
    envMock.STRIPE_PRICE_ID_MONTHLY = "";

    const adapter = new StripeBillingProviderAdapter();
    await expect(adapter.createCheckoutSession(yearlyInput)).rejects.toMatchObject({
      code: "BILLING_PROVIDER_MISCONFIGURED",
    } satisfies Partial<DomainError>);
  });

  it("creates subscription checkout without price_data", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "cs_test_abc",
        url: "https://checkout.stripe.com/pay/cs_test_abc",
        expires_at: 1_777_777_777,
      }),
    } as Response);

    const adapter = new StripeBillingProviderAdapter();
    const result = await adapter.createCheckoutSession(yearlyInput);
    const form = postedForm(fetchMock);

    expect(form.get("mode")).toBe("subscription");
    expect(form.get("line_items[0][price]")).toBe("price_yearly");
    expect(form.get("line_items[0][price_data][currency]")).toBeNull();
    expect(form.get("subscription_data[metadata][planCode]")).toBe("YEARLY_STANDARD");
    expect(result).toEqual({
      provider: "stripe",
      externalSessionId: "cs_test_abc",
      checkoutUrl: "https://checkout.stripe.com/pay/cs_test_abc",
      expiresAt: new Date(1_777_777_777 * 1000),
    });
  });

  it("uses monthly price id for MONTHLY_STANDARD", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "cs_test_month",
        url: "https://checkout.stripe.com/pay/cs_test_month",
        expires_at: 1_777_777_777,
      }),
    } as Response);

    const adapter = new StripeBillingProviderAdapter();
    await adapter.createCheckoutSession({
      ...yearlyInput,
      planCode: "MONTHLY_STANDARD",
    });

    expect(postedForm(fetchMock).get("line_items[0][price]")).toBe("price_monthly");
    expect(postedForm(fetchMock).get("mode")).toBe("subscription");
  });

  it("uses offering stripePriceId when env price is empty", async () => {
    envMock.STRIPE_PRICE_ID_YEARLY = "";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: "cs_test_offering",
        url: "https://checkout.stripe.com/pay/cs_test_offering",
        expires_at: 1_777_777_777,
      }),
    } as Response);

    const adapter = new StripeBillingProviderAdapter();
    await adapter.createCheckoutSession({
      ...yearlyInput,
      stripePriceId: "price_offering",
    });

    expect(postedForm(fetchMock).get("mode")).toBe("subscription");
    expect(postedForm(fetchMock).get("line_items[0][price]")).toBe("price_offering");
  });

  it("throws request-failed error when stripe response is not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { message: "bad request" } }),
    } as Response);

    const adapter = new StripeBillingProviderAdapter();
    await expect(adapter.createCheckoutSession(yearlyInput)).rejects.toMatchObject({
      code: "BILLING_PROVIDER_REQUEST_FAILED",
    } satisfies Partial<DomainError>);
  });
});

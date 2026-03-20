import { addMinutes } from "date-fns";
import { randomUUID } from "node:crypto";
import type { BillingProviderAdapter, CreateCheckoutSessionInput, CheckoutSessionResult } from "@/modules/billing/providers/types";

function appendQuery(url: string, query: Record<string, string>) {
  const target = new URL(url);

  for (const [key, value] of Object.entries(query)) {
    target.searchParams.set(key, value);
  }

  return target.toString();
}

export class MockBillingProviderAdapter implements BillingProviderAdapter {
  readonly code = "mock_gateway";

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionResult> {
    const sessionId = `mock_${randomUUID()}`;
    const expiresAt = addMinutes(new Date(), 30);

    const checkoutUrl = appendQuery(input.successUrl, {
      mockCheckout: "1",
      sessionId,
      planCode: input.planCode,
      amountVnd: String(input.amountVnd),
      parentId: input.parentId,
    });

    return {
      provider: this.code,
      externalSessionId: sessionId,
      checkoutUrl,
      expiresAt,
      metadata: {
        cancelUrl: input.cancelUrl,
      },
    };
  }
}

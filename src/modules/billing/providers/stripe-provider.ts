import { env } from "@/lib/env";
import type {
  BillingProviderAdapter,
  CheckoutSessionResult,
  CreateCheckoutSessionInput,
} from "@/modules/billing/providers/types";
import { DomainError } from "@/modules/platform/errors";

type StripeCheckoutSessionResponse = {
  id?: unknown;
  url?: unknown;
  expires_at?: unknown;
};

function getPlanDisplayName(planCode: CreateCheckoutSessionInput["planCode"]) {
  if (planCode === "YEARLY_FAMILY_PLUS") {
    return "TinyGenius Hub - Family Plus (Yearly)";
  }

  return "TinyGenius Hub - Standard (Yearly)";
}

function toStripeSession(raw: StripeCheckoutSessionResponse): CheckoutSessionResult {
  const externalSessionId = typeof raw.id === "string" ? raw.id : null;
  const checkoutUrl = typeof raw.url === "string" ? raw.url : null;
  const expiresAtSeconds =
    typeof raw.expires_at === "number" && Number.isFinite(raw.expires_at) ? raw.expires_at : null;

  if (!externalSessionId || !checkoutUrl || !expiresAtSeconds) {
    throw new DomainError("Stripe checkout session payload is invalid", 502, "BILLING_PROVIDER_INVALID_RESPONSE");
  }

  return {
    provider: "stripe",
    externalSessionId,
    checkoutUrl,
    expiresAt: new Date(expiresAtSeconds * 1000),
  };
}

export class StripeBillingProviderAdapter implements BillingProviderAdapter {
  readonly code = "stripe";

  async createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionResult> {
    if (!env.STRIPE_SECRET_KEY) {
      throw new DomainError("Stripe secret key is not configured", 500, "BILLING_PROVIDER_MISCONFIGURED");
    }

    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("success_url", input.successUrl);
    form.set("cancel_url", input.cancelUrl);
    form.set("client_reference_id", input.parentId);
    form.set("metadata[parentId]", input.parentId);
    form.set("metadata[parentEmail]", input.parentEmail);
    form.set("metadata[planCode]", input.planCode);
    form.set("line_items[0][quantity]", "1");
    form.set("line_items[0][price_data][currency]", "vnd");
    form.set("line_items[0][price_data][unit_amount]", String(input.amountVnd));
    form.set("line_items[0][price_data][product_data][name]", getPlanDisplayName(input.planCode));

    let response: Response;
    try {
      response = await fetch(`${env.STRIPE_API_BASE_URL}/v1/checkout/sessions`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });
    } catch {
      throw new DomainError("Stripe checkout request failed", 502, "BILLING_PROVIDER_REQUEST_FAILED");
    }

    const payload = (await response.json().catch(() => null)) as StripeCheckoutSessionResponse | null;
    if (!response.ok) {
      throw new DomainError("Stripe checkout request failed", 502, "BILLING_PROVIDER_REQUEST_FAILED");
    }

    if (!payload) {
      throw new DomainError("Stripe checkout response is empty", 502, "BILLING_PROVIDER_INVALID_RESPONSE");
    }

    return toStripeSession(payload);
  }
}

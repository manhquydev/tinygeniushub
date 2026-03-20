import { env } from "@/lib/env";
import { DomainError } from "@/modules/platform/errors";
import { MockBillingProviderAdapter } from "@/modules/billing/providers/mock-provider";
import { StripeBillingProviderAdapter } from "@/modules/billing/providers/stripe-provider";
import type { BillingProviderAdapter } from "@/modules/billing/providers/types";

const providers: Record<string, BillingProviderAdapter> = {
  mock_gateway: new MockBillingProviderAdapter(),
  stripe: new StripeBillingProviderAdapter(),
};

export function resolveBillingProvider(providerCode = env.BILLING_PROVIDER) {
  const provider = providers[providerCode];
  if (!provider) {
    throw new DomainError(`Unsupported billing provider: ${providerCode}`, 500, "UNSUPPORTED_BILLING_PROVIDER");
  }

  return provider;
}

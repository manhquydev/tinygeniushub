import type { PayablePlanCode } from "@/modules/billing/plan-config";
import type { PackageCode } from "@/modules/billing/package-config";

export type CreateCheckoutSessionInput = {
  parentId: string;
  parentEmail: string;
  planCode: PayablePlanCode | PackageCode | string;
  amountVnd: number;
  successUrl: string;
  cancelUrl: string;
  stripePriceId?: string | null;
  metadata?: Record<string, string>;
};

export type CheckoutSessionResult = {
  provider: string;
  externalSessionId: string;
  checkoutUrl: string;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
};

export interface BillingProviderAdapter {
  readonly code: string;
  createCheckoutSession(input: CreateCheckoutSessionInput): Promise<CheckoutSessionResult>;
}

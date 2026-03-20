import type { PayablePlanCode } from "@/modules/billing/plan-config";

export type CreateCheckoutSessionInput = {
  parentId: string;
  parentEmail: string;
  planCode: PayablePlanCode;
  amountVnd: number;
  successUrl: string;
  cancelUrl: string;
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

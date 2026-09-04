import { env } from "@/lib/env";

function envPriceForPlan(planCode: string) {
  if (planCode === "MONTHLY_STANDARD") {
    return env.STRIPE_PRICE_ID_MONTHLY ?? null;
  }

  if (planCode === "YEARLY_STANDARD" || planCode === "YEARLY_FAMILY_PLUS") {
    return env.STRIPE_PRICE_ID_YEARLY ?? null;
  }

  return null;
}

export function resolveStripeRecurringPriceId(input: {
  planCode: string;
  offeringStripePriceId?: string | null;
}) {
  const fromEnv = envPriceForPlan(input.planCode);
  if (fromEnv) {
    return fromEnv;
  }

  const fromOffering = input.offeringStripePriceId?.trim();
  return fromOffering ? fromOffering : null;
}

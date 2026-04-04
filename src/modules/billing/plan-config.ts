import { PlanCode, SubscriptionStatus } from "@prisma/client";
import { z } from "zod";

export const payablePlanCodeSchema = z.enum(["MONTHLY_STANDARD", "YEARLY_STANDARD", "YEARLY_FAMILY_PLUS"]);
export type PayablePlanCode = z.infer<typeof payablePlanCodeSchema>;

type PlanConfig = {
  amountVnd: number;
  childProfileLimit: number;
  caregiverLimit: number;
  portfolioRetentionMaxDays: number;
  status: SubscriptionStatus;
};

const PLAN_CONFIG: Record<PayablePlanCode, PlanConfig> = {
  MONTHLY_STANDARD: {
    amountVnd: 149_000,
    childProfileLimit: 3,
    caregiverLimit: 2,
    portfolioRetentionMaxDays: 90,
    status: SubscriptionStatus.ACTIVE_STANDARD,
  },
  YEARLY_STANDARD: {
    amountVnd: 799_000,
    childProfileLimit: 3,
    caregiverLimit: 2,
    portfolioRetentionMaxDays: 90,
    status: SubscriptionStatus.ACTIVE_STANDARD,
  },
  YEARLY_FAMILY_PLUS: {
    amountVnd: 1_199_000,
    childProfileLimit: 5,
    caregiverLimit: 4,
    portfolioRetentionMaxDays: 365,
    status: SubscriptionStatus.ACTIVE_FAMILYPLUS,
  },
};

export function getPayablePlanConfig(planCode: PayablePlanCode) {
  return PLAN_CONFIG[planCode];
}

export function toPrismaPlanCode(planCode: PayablePlanCode) {
  if (planCode === "YEARLY_FAMILY_PLUS") return PlanCode.YEARLY_FAMILY_PLUS;
  if (planCode === "MONTHLY_STANDARD") return PlanCode.MONTHLY_STANDARD;
  return PlanCode.YEARLY_STANDARD;
}

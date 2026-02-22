import { PlanCode, SubscriptionStatus } from "@prisma/client";
import { z } from "zod";

export const payablePlanCodeSchema = z.enum(["YEARLY_STANDARD", "YEARLY_FAMILY_PLUS"]);
export type PayablePlanCode = z.infer<typeof payablePlanCodeSchema>;

type PlanConfig = {
  amountVnd: number;
  childProfileLimit: number;
  caregiverLimit: number;
  portfolioRetentionMaxDays: number;
  status: SubscriptionStatus;
};

const PLAN_CONFIG: Record<PayablePlanCode, PlanConfig> = {
  YEARLY_STANDARD: {
    amountVnd: 120_000,
    childProfileLimit: 3,
    caregiverLimit: 2,
    portfolioRetentionMaxDays: 90,
    status: SubscriptionStatus.ACTIVE_STANDARD,
  },
  YEARLY_FAMILY_PLUS: {
    amountVnd: 240_000,
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
  return planCode === "YEARLY_FAMILY_PLUS" ? PlanCode.YEARLY_FAMILY_PLUS : PlanCode.YEARLY_STANDARD;
}

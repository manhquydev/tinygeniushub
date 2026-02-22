import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

type RenewalEligibilityInput = {
  status: SubscriptionStatus;
  autoRenew: boolean;
  currentPeriodEnd: Date;
  asOf: Date;
};

export function isEligibleForAutoCharge(input: RenewalEligibilityInput) {
  const activeStatuses = new Set<SubscriptionStatus>([
    SubscriptionStatus.ACTIVE_STANDARD,
    SubscriptionStatus.ACTIVE_FAMILYPLUS,
  ]);

  return (
    activeStatuses.has(input.status) &&
    input.autoRenew &&
    input.currentPeriodEnd.getTime() <= input.asOf.getTime()
  );
}

export async function listSubscriptionsDueForAutoCharge(asOf: Date) {
  const candidates = await prisma.subscription.findMany({
    where: {
      status: {
        in: [SubscriptionStatus.ACTIVE_STANDARD, SubscriptionStatus.ACTIVE_FAMILYPLUS],
      },
      autoRenew: true,
      currentPeriodEnd: {
        lte: asOf,
      },
    },
    include: {
      parent: true,
    },
  });

  return candidates;
}

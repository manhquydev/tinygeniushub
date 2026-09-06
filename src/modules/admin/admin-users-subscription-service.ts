import { PlanCode, SubscriptionStatus } from "@prisma/client";
import { addDays } from "date-fns";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  expirePlanOfferingInTx,
  grantPlanOfferingInTx,
  offeringCodeForPlan,
} from "@/modules/entitlement/grant-from-billing";
import { DomainError } from "@/modules/platform/errors";
import { createAdminActionLog } from "./admin-user-service";

export const adminSubscriptionActionSchema = z.object({
  action: z.enum(["extend", "cancel", "activate"]),
  days: z.number().int().min(1).max(3650).optional(),
});

const subscriptionSelect = {
  id: true,
  planCode: true,
  status: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
  autoRenew: true,
  updatedAt: true,
} as const;

function resolveActiveStatusFromPlanCode(planCode: PlanCode) {
  if (planCode === PlanCode.TRIAL) {
    return SubscriptionStatus.TRIALING;
  }
  if (planCode === PlanCode.YEARLY_FAMILY_PLUS) {
    return SubscriptionStatus.ACTIVE_FAMILYPLUS;
  }
  return SubscriptionStatus.ACTIVE_STANDARD;
}

export async function updateAdminUserSubscription(input: {
  parentId: string;
  action: "extend" | "cancel" | "activate";
  days?: number;
  adminEmail: string;
}) {
  const payload = adminSubscriptionActionSchema.parse({
    action: input.action,
    days: input.days,
  });
  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.findUnique({
      where: { parentId: input.parentId },
      select: {
        id: true,
        planCode: true,
        status: true,
        currentPeriodEnd: true,
        autoRenew: true,
      },
    });

    if (!subscription) {
      throw new DomainError("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND");
    }

    if (!offeringCodeForPlan(subscription.planCode)) {
      throw new DomainError("Plan offering is not mapped", 422, "PLAN_OFFERING_UNMAPPED");
    }

    if (payload.action === "cancel") {
      const updated = await tx.subscription.update({
        where: { parentId: input.parentId },
        data: {
          status: SubscriptionStatus.CANCELED_AT_PERIOD_END,
          autoRenew: false,
        },
        select: subscriptionSelect,
      });
      await expirePlanOfferingInTx(tx, {
        parentId: input.parentId,
        planCode: subscription.planCode,
      });
      return { previous: subscription, next: updated };
    }

    const periodStillLive = subscription.currentPeriodEnd.getTime() > now.getTime();
    const nextEnd =
      payload.action === "extend"
        ? addDays(periodStillLive ? subscription.currentPeriodEnd : now, payload.days ?? 30)
        : periodStillLive
          ? subscription.currentPeriodEnd
          : addDays(now, 30);

    const updated = await tx.subscription.update({
      where: { parentId: input.parentId },
      data: {
        status: resolveActiveStatusFromPlanCode(subscription.planCode),
        autoRenew: true,
        currentPeriodEnd: nextEnd,
      },
      select: subscriptionSelect,
    });

    const ticket = await grantPlanOfferingInTx(tx, {
      parentId: input.parentId,
      planCode: subscription.planCode,
      validUntil: updated.currentPeriodEnd,
    });
    if (!ticket) {
      throw new DomainError("Plan offering is not mapped", 422, "PLAN_OFFERING_UNMAPPED");
    }

    return { previous: subscription, next: updated };
  });

  await createAdminActionLog({
    adminEmail: input.adminEmail,
    action: "UPDATE_USER_SUBSCRIPTION",
    target: input.parentId,
    detail: {
      action: payload.action,
      days: payload.days ?? null,
      before: {
        status: result.previous.status,
        currentPeriodEnd: result.previous.currentPeriodEnd,
        autoRenew: result.previous.autoRenew,
      },
      after: {
        status: result.next.status,
        currentPeriodEnd: result.next.currentPeriodEnd,
        autoRenew: result.next.autoRenew,
      },
    },
  });

  return result.next;
}

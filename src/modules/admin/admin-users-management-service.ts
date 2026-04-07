import { PaymentStatus, PlanCode, Prisma, SubscriptionStatus } from "@prisma/client";
import { addDays } from "date-fns";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/email/transactional-email-sender";
import { createNotificationForParent } from "@/modules/platform/notification-service";
import { DomainError } from "@/modules/platform/errors";
import { createAdminActionLog } from "./admin-user-service";

const subscriptionStatusFilterSchema = z.enum([
  "TRIALING",
  "ACTIVE_STANDARD",
  "ACTIVE_FAMILYPLUS",
  "CANCELED",
  "CANCELED_AT_PERIOD_END",
  "EXPIRED",
  "GRACE",
  "REFUNDED",
  "NONE",
]);

export const adminUsersListQuerySchema = z.object({
  q: z.string().trim().max(320).optional().default(""),
  status: subscriptionStatusFilterSchema.optional(),
  sort: z
    .enum(["createdAt_desc", "createdAt_asc", "plan_asc", "plan_desc"])
    .optional()
    .default("createdAt_desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const adminSubscriptionActionSchema = z.object({
  action: z.enum(["extend", "cancel", "activate"]),
  days: z.number().int().min(1).max(3650).optional(),
});

export const adminEmailActionSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(5000),
});

function normalizeSubscriptionStatusFilter(
  status: z.infer<typeof subscriptionStatusFilterSchema> | undefined,
) {
  if (status === "CANCELED") {
    return SubscriptionStatus.CANCELED_AT_PERIOD_END;
  }
  if (!status || status === "NONE") {
    return null;
  }
  return status;
}

function resolveActiveStatusFromPlanCode(planCode: PlanCode) {
  if (planCode === PlanCode.TRIAL) {
    return SubscriptionStatus.TRIALING;
  }
  if (planCode === PlanCode.YEARLY_FAMILY_PLUS) {
    return SubscriptionStatus.ACTIVE_FAMILYPLUS;
  }
  return SubscriptionStatus.ACTIVE_STANDARD;
}

export async function listAdminUsers(input: unknown) {
  const query = adminUsersListQuerySchema.parse(input);
  const skip = (query.page - 1) * query.limit;

  const where: Prisma.ParentAccountWhereInput = {};

  if (query.q.length > 0) {
    where.OR = [
      {
        email: {
          contains: query.q,
          mode: "insensitive",
        },
      },
      {
        displayName: {
          contains: query.q,
          mode: "insensitive",
        },
      },
    ];
  }

  const normalizedStatus = normalizeSubscriptionStatusFilter(query.status);

  if (query.status === "NONE") {
    where.subscription = { is: null };
  } else if (normalizedStatus) {
    where.subscription = {
      is: {
        status: normalizedStatus,
      },
    };
  }

  const orderBy: Prisma.ParentAccountOrderByWithRelationInput[] =
    query.sort === "createdAt_asc"
      ? [{ createdAt: "asc" }]
      : query.sort === "plan_asc"
        ? [{ subscription: { planCode: "asc" } }, { createdAt: "desc" }]
        : query.sort === "plan_desc"
          ? [{ subscription: { planCode: "desc" } }, { createdAt: "desc" }]
          : [{ createdAt: "desc" }];

  const [total, parents] = await Promise.all([
    prisma.parentAccount.count({ where }),
    prisma.parentAccount.findMany({
      where,
      orderBy,
      skip,
      take: query.limit,
      select: {
        id: true,
        email: true,
        displayName: true,
        suspended: true,
        createdAt: true,
        lastActiveAt: true,
        subscription: {
          select: {
            id: true,
            planCode: true,
            status: true,
            currentPeriodEnd: true,
            autoRenew: true,
          },
        },
        _count: {
          select: {
            childProfiles: true,
            payments: {
              where: {
                status: PaymentStatus.SUCCEEDED,
              },
            },
          },
        },
      },
    }),
  ]);

  const users = parents.map((parent) => ({
    id: parent.id,
    email: parent.email,
    displayName: parent.displayName,
    suspended: parent.suspended,
    createdAt: parent.createdAt,
    lastActiveAt: parent.lastActiveAt,
    childrenCount: parent._count.childProfiles,
    successfulPaymentsCount: parent._count.payments,
    subscription: parent.subscription
      ? {
          id: parent.subscription.id,
          planCode: parent.subscription.planCode,
          status: parent.subscription.status,
          currentPeriodEnd: parent.subscription.currentPeriodEnd,
          autoRenew: parent.subscription.autoRenew,
        }
      : null,
  }));

  return {
    users,
    total,
    page: query.page,
  };
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

  const subscription = await prisma.subscription.findUnique({
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

  const now = new Date();
  let updated:
    | {
        id: string;
        planCode: PlanCode;
        status: SubscriptionStatus;
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        autoRenew: boolean;
        updatedAt: Date;
      }
    | null = null;

  if (payload.action === "extend") {
    const extendDays = payload.days ?? 30;
    const baseEnd =
      subscription.currentPeriodEnd.getTime() > now.getTime()
        ? subscription.currentPeriodEnd
        : now;
    updated = await prisma.subscription.update({
      where: { parentId: input.parentId },
      data: {
        status: resolveActiveStatusFromPlanCode(subscription.planCode),
        autoRenew: true,
        currentPeriodEnd: addDays(baseEnd, extendDays),
      },
      select: {
        id: true,
        planCode: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        autoRenew: true,
        updatedAt: true,
      },
    });
  } else if (payload.action === "cancel") {
    updated = await prisma.subscription.update({
      where: { parentId: input.parentId },
      data: {
        status: SubscriptionStatus.CANCELED_AT_PERIOD_END,
        autoRenew: false,
      },
      select: {
        id: true,
        planCode: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        autoRenew: true,
        updatedAt: true,
      },
    });
  } else {
    const nextEnd =
      subscription.currentPeriodEnd.getTime() > now.getTime()
        ? subscription.currentPeriodEnd
        : addDays(now, 30);
    updated = await prisma.subscription.update({
      where: { parentId: input.parentId },
      data: {
        status: resolveActiveStatusFromPlanCode(subscription.planCode),
        autoRenew: true,
        currentPeriodEnd: nextEnd,
      },
      select: {
        id: true,
        planCode: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        autoRenew: true,
        updatedAt: true,
      },
    });
  }

  await createAdminActionLog({
    adminEmail: input.adminEmail,
    action: "UPDATE_USER_SUBSCRIPTION",
    target: input.parentId,
    detail: {
      action: payload.action,
      days: payload.days ?? null,
      before: {
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        autoRenew: subscription.autoRenew,
      },
      after: {
        status: updated.status,
        currentPeriodEnd: updated.currentPeriodEnd,
        autoRenew: updated.autoRenew,
      },
    },
  });

  return updated;
}

async function sendAdminManualEmail(params: {
  to: string;
  subject: string;
  body: string;
}) {
  try {
    const delivery = await sendTransactionalEmail({
      to: params.to,
      subject: params.subject,
      text: params.body,
      tags: [{ name: "feature", value: "admin_manual_email" }],
    });
    return { provider: delivery.provider };
  } catch (error) {
    throw new DomainError(
      error instanceof Error ? `Admin email delivery failed: ${error.message}` : "Admin email delivery failed",
      502,
      "ADMIN_EMAIL_DELIVERY_FAILED",
    );
  }
}

export async function sendAdminEmailToParent(input: {
  parentId: string;
  subject: string;
  body: string;
  adminEmail: string;
}) {
  const payload = adminEmailActionSchema.parse({
    subject: input.subject,
    body: input.body,
  });

  const parent = await prisma.parentAccount.findUnique({
    where: { id: input.parentId },
    select: {
      id: true,
      email: true,
    },
  });

  if (!parent) {
    throw new DomainError("Parent account not found", 404, "PARENT_NOT_FOUND");
  }

  const delivery = await sendAdminManualEmail({
    to: parent.email,
    subject: payload.subject,
    body: payload.body,
  });

  await createNotificationForParent({
    parentId: parent.id,
    parentEmail: parent.email,
    notification: {
      type: "TIP",
      title: payload.subject,
      message: payload.body.slice(0, 280),
      href: "/parent/dashboard",
    },
  });

  await createAdminActionLog({
    adminEmail: input.adminEmail,
    action: "SEND_USER_EMAIL",
    target: parent.email,
    detail: {
      subject: payload.subject,
      provider: delivery.provider,
    },
  });

  return {
    sent: true,
    provider: delivery.provider,
  };
}

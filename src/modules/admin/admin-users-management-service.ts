import { PaymentStatus, Prisma, SubscriptionStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";

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

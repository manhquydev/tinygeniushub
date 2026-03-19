import { PaymentStatus } from "@prisma/client";
import { subDays } from "date-fns";
import { prisma } from "@/lib/db";
import { toStatusMap } from "./admin-analytics-shared-helpers";

export async function getAdminOverview() {
  const since30d = subDays(new Date(), 30);

  const [
    parentsCount,
    childrenCount,
    subscriptionsByStatusRaw,
    payments30d,
    webhooksByStatusRaw,
    recentPayments,
    recentWebhookEvents,
    referralCodesCount,
    referralAttributionsCount,
    paidReferralsCount,
    rewardedReferralsCount,
  ] = await Promise.all([
    prisma.parentAccount.count(),
    prisma.childProfile.count(),
    prisma.subscription.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.paymentRecord.aggregate({
      where: {
        processedAt: { gte: since30d },
        status: PaymentStatus.SUCCEEDED,
      },
      _count: { _all: true },
      _sum: { amountVnd: true },
    }),
    prisma.webhookEvent.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.paymentRecord.findMany({
      orderBy: { processedAt: "desc" },
      take: 8,
      select: {
        id: true,
        provider: true,
        providerTransactionId: true,
        amountVnd: true,
        status: true,
        processedAt: true,
        parent: {
          select: {
            email: true,
          },
        },
      },
    }),
    prisma.webhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        provider: true,
        eventId: true,
        status: true,
        signatureValid: true,
        processedAt: true,
        createdAt: true,
      },
    }),
    prisma.referralCode.count(),
    prisma.referralAttribution.count(),
    prisma.referralAttribution.count({
      where: {
        paidAt: { not: null },
      },
    }),
    prisma.referralAttribution.count({
      where: {
        rewardGranted: true,
      },
    }),
  ]);

  return {
    counts: {
      parents: parentsCount,
      children: childrenCount,
      successfulPayments30d: payments30d._count._all,
      successfulRevenueVnd30d: payments30d._sum.amountVnd ?? 0,
      referralCodes: referralCodesCount,
      referralAttributions: referralAttributionsCount,
      paidReferrals: paidReferralsCount,
      rewardedReferrals: rewardedReferralsCount,
    },
    subscriptionsByStatus: toStatusMap(
      subscriptionsByStatusRaw.map((item) => ({ status: item.status, _count: item._count })),
    ),
    webhooksByStatus: toStatusMap(
      webhooksByStatusRaw.map((item) => ({ status: item.status, _count: item._count })),
    ),
    recentPayments,
    recentWebhookEvents,
  };
}

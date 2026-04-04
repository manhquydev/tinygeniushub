import { subDays, format } from "date-fns";
import { prisma } from "@/lib/db";
import { PaymentStatus, SubscriptionStatus, PlanCode } from "@prisma/client";

export interface RevenueMetrics {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  totalRevenue30d: number;
  totalRevenue7d: number;
  revenueByPlan: Record<string, number>;
  churnRate: number;
  churnRevenue30d: number;
  netRevenueRetention: number;
  newMrr30d: number;
  expansionMrr30d: number;
  contractionMrr30d: number;
}

export interface RevenueTimeSeries {
  date: string;
  revenue: number;
  newCustomers: number;
  churnedCustomers: number;
}

// MRR calculation: normalize all plans to monthly revenue
const PLAN_MRR: Record<PlanCode, number> = {
  [PlanCode.TRIAL]: 0,
  [PlanCode.MONTHLY_STANDARD]: 99000,
  [PlanCode.YEARLY_STANDARD]: Math.round(799000 / 12), // 66583
  [PlanCode.YEARLY_FAMILY_PLUS]: Math.round(1199000 / 12), // 99917
};

// Plan category mapping for revenue breakdown
function getPlanCategory(planCode: PlanCode): "STANDARD" | "FAMILYPLUS" | "TRIAL" {
  if (planCode === PlanCode.YEARLY_FAMILY_PLUS) return "FAMILYPLUS";
  if (planCode === PlanCode.TRIAL) return "TRIAL";
  return "STANDARD";
}

export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const now = new Date();
  const since30d = subDays(now, 30);
  const since7d = subDays(now, 7);

  // Get active subscriptions for MRR
  const activeSubscriptions = await prisma.subscription.findMany({
    where: {
      status: {
        in: [
          SubscriptionStatus.ACTIVE_STANDARD,
          SubscriptionStatus.ACTIVE_FAMILYPLUS,
        ],
      },
    },
    select: {
      status: true,
      planCode: true,
    },
  });

  // Calculate MRR
  let mrr = 0;
  const revenueByPlan: Record<string, number> = {};

  for (const sub of activeSubscriptions) {
    const price = PLAN_MRR[sub.planCode] || 0;
    mrr += price;
    const category = getPlanCategory(sub.planCode);
    revenueByPlan[category] = (revenueByPlan[category] || 0) + price;
  }

  // Get revenue for last 30 days from payment records
  const revenue30d = await prisma.paymentRecord.aggregate({
    where: {
      processedAt: { gte: since30d },
      status: PaymentStatus.SUCCEEDED,
    },
    _sum: { amountVnd: true },
  });

  // Get revenue for last 7 days
  const revenue7d = await prisma.paymentRecord.aggregate({
    where: {
      processedAt: { gte: since7d },
      status: PaymentStatus.SUCCEEDED,
    },
    _sum: { amountVnd: true },
  });

  // Calculate churn (subscriptions canceled in last 30 days)
  const churned30d = await prisma.subscription.count({
    where: {
      status: SubscriptionStatus.CANCELED_AT_PERIOD_END,
      updatedAt: { gte: since30d },
    },
  });

  // Get total active subscriptions for churn rate denominator
  const totalActiveSubscriptions = await prisma.subscription.count({
    where: {
      status: {
        in: [
          SubscriptionStatus.ACTIVE_STANDARD,
          SubscriptionStatus.ACTIVE_FAMILYPLUS,
          SubscriptionStatus.TRIALING,
        ],
      },
    },
  });

  const churnRate = totalActiveSubscriptions > 0
    ? Number(((churned30d / totalActiveSubscriptions) * 100).toFixed(2))
    : 0;

  // Calculate churn revenue (approximate using average MRR per subscription)
  const avgMrrPerSubscription = activeSubscriptions.length > 0
    ? mrr / activeSubscriptions.length
    : 99000;
  const churnRevenue30d = Math.round(churned30d * avgMrrPerSubscription);

  // New MRR (from new subscriptions in last 30 days)
  const newSubscriptions30d = await prisma.subscription.findMany({
    where: {
      createdAt: { gte: since30d },
      status: {
        in: [
          SubscriptionStatus.ACTIVE_STANDARD,
          SubscriptionStatus.ACTIVE_FAMILYPLUS,
        ],
      },
    },
    select: { planCode: true },
  });

  const newMrr30d = newSubscriptions30d.reduce((sum, sub) => {
    return sum + (PLAN_MRR[sub.planCode] || 0);
  }, 0);

  return {
    mrr,
    arr: mrr * 12,
    totalRevenue30d: revenue30d._sum.amountVnd || 0,
    totalRevenue7d: revenue7d._sum.amountVnd || 0,
    revenueByPlan,
    churnRate,
    churnRevenue30d,
    netRevenueRetention: Number((100 - churnRate).toFixed(2)),
    newMrr30d,
    expansionMrr30d: 0, // Would need upgrade tracking
    contractionMrr30d: 0, // Would need downgrade tracking
  };
}

export async function getRevenueTimeSeries(days: number = 30): Promise<RevenueTimeSeries[]> {
  const data: RevenueTimeSeries[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(now, i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    // Revenue for this day
    const revenue = await prisma.paymentRecord.aggregate({
      where: {
        processedAt: {
          gte: date,
          lt: nextDate,
        },
        status: PaymentStatus.SUCCEEDED,
      },
      _sum: { amountVnd: true },
    });

    // New customers (parent accounts created this day)
    const newCustomers = await prisma.parentAccount.count({
      where: {
        createdAt: {
          gte: date,
          lt: nextDate,
        },
      },
    });

    // Churned customers (subscriptions canceled this day)
    const churnedCustomers = await prisma.subscription.count({
      where: {
        status: SubscriptionStatus.CANCELED_AT_PERIOD_END,
        updatedAt: {
          gte: date,
          lt: nextDate,
        },
      },
    });

    data.push({
      date: format(date, "yyyy-MM-dd"),
      revenue: revenue._sum.amountVnd || 0,
      newCustomers,
      churnedCustomers,
    });
  }

  return data;
}

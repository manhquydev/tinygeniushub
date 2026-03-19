import { PaymentStatus } from "@prisma/client";
import { subDays } from "date-fns";
import { prisma } from "@/lib/db";
import { type TimeSeriesPoint } from "./admin-analytics-shared-helpers";

export type { TimeSeriesPoint };

export async function getRevenueTimeSeries(days = 30): Promise<TimeSeriesPoint[]> {
  const since = subDays(new Date(), days);

  const payments = await prisma.paymentRecord.findMany({
    where: {
      processedAt: { gte: since },
      status: PaymentStatus.SUCCEEDED,
    },
    select: {
      processedAt: true,
      amountVnd: true,
    },
    orderBy: { processedAt: "asc" },
  });

  const byDate = new Map<string, number>();
  for (const payment of payments) {
    const key = payment.processedAt.toISOString().slice(0, 10);
    byDate.set(key, (byDate.get(key) ?? 0) + payment.amountVnd);
  }

  return Array.from(byDate.entries()).map(([date, value]) => ({ date, value }));
}

export async function getRegistrationTimeSeries(days = 30): Promise<TimeSeriesPoint[]> {
  const since = subDays(new Date(), days);

  const parents = await prisma.parentAccount.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const byDate = new Map<string, number>();
  for (const parent of parents) {
    const key = parent.createdAt.toISOString().slice(0, 10);
    byDate.set(key, (byDate.get(key) ?? 0) + 1);
  }

  return Array.from(byDate.entries()).map(([date, value]) => ({ date, value }));
}

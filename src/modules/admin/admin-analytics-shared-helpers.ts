import { PaymentStatus } from "@prisma/client";

export type CountByStatus = Record<string, number>;

export function toStatusMap(input: Array<{ status: string; _count: { _all: number } }>): CountByStatus {
  return input.reduce<CountByStatus>((acc, item) => {
    acc[item.status] = item._count._all;
    return acc;
  }, {});
}

export type StreakBuckets = {
  zero: number;
  low: number;
  medium: number;
  high: number;
};

/**
 * Computes streak distribution buckets from raw progress state rows.
 * Handles multiple progress states per child by taking the max streak.
 */
export function computeStreakBuckets(
  totalChildren: number,
  progressStates: Array<{ childId: string; streakCount: number }>,
): StreakBuckets {
  const maxStreakByChild = new Map<string, number>();
  for (const progressState of progressStates) {
    const existingMax = maxStreakByChild.get(progressState.childId) ?? 0;
    if (progressState.streakCount > existingMax) {
      maxStreakByChild.set(progressState.childId, progressState.streakCount);
    }
  }

  let zero = Math.max(totalChildren - maxStreakByChild.size, 0);
  let low = 0;
  let medium = 0;
  let high = 0;

  for (const streakCount of maxStreakByChild.values()) {
    if (streakCount <= 0) {
      zero += 1;
    } else if (streakCount <= 3) {
      low += 1;
    } else if (streakCount <= 7) {
      medium += 1;
    } else {
      high += 1;
    }
  }

  return { zero, low, medium, high };
}

export const ADMIN_ANALYTICS_PERIODS = ["7d", "30d", "90d"] as const;
export type AdminAnalyticsPeriod = (typeof ADMIN_ANALYTICS_PERIODS)[number];

export function periodToDays(period: AdminAnalyticsPeriod): number {
  switch (period) {
    case "7d":
      return 7;
    case "90d":
      return 90;
    case "30d":
    default:
      return 30;
  }
}

export function parseAdminAnalyticsPeriod(value: string | null | undefined): AdminAnalyticsPeriod {
  if (value === "7d" || value === "30d" || value === "90d") {
    return value;
  }
  return "30d";
}

export type TimeSeriesPoint = {
  date: string; // "YYYY-MM-DD"
  value: number;
};

export { PaymentStatus };

import { subDays, startOfDay, format } from "date-fns";
import { prisma } from "@/lib/db";

export type CohortPeriod = "daily" | "weekly" | "monthly";

export interface CohortData {
  cohortDate: string;
  cohortSize: number;
  retentionByDay: Record<number, number>; // day -> count
  retentionRates: Record<number, number>; // day -> percentage
}

export async function getCohortAnalysis(
  period: CohortPeriod = "weekly",
  cohortsCount: number = 8
): Promise<CohortData[]> {
  const cohorts: CohortData[] = [];
  const now = new Date();

  for (let i = 0; i < cohortsCount; i++) {
    const cohortDate = calculateCohortDate(now, period, i);
    const cohortEndDate = calculateCohortEndDate(cohortDate, period);

    // Get users who signed up in this cohort
    const cohortUsers = await prisma.parentAccount.findMany({
      where: {
        createdAt: {
          gte: cohortDate,
          lt: cohortEndDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
    });

    const cohortSize = cohortUsers.length;
    if (cohortSize === 0) continue;

    const userIds = cohortUsers.map((u) => u.id);

    // Calculate retention by day
    const retentionByDay: Record<number, number> = {};
    const retentionRates: Record<number, number> = {};

    // Check retention for days 0, 1, 3, 7, 14, 30, 60, 90
    const retentionDays = [0, 1, 3, 7, 14, 30, 60, 90];

    for (const day of retentionDays) {
      const activeUsers = await countActiveUsersOnDay(userIds, cohortDate, day);
      retentionByDay[day] = activeUsers;
      retentionRates[day] = Number(((activeUsers / cohortSize) * 100).toFixed(1));
    }

    cohorts.push({
      cohortDate: format(cohortDate, "yyyy-MM-dd"),
      cohortSize,
      retentionByDay,
      retentionRates,
    });
  }

  return cohorts.reverse(); // Most recent first
}

function calculateCohortDate(now: Date, period: CohortPeriod, index: number): Date {
  const daysBack =
    period === "daily" ? index : period === "weekly" ? index * 7 : index * 30;
  return startOfDay(subDays(now, daysBack));
}

function calculateCohortEndDate(startDate: Date, period: CohortPeriod): Date {
  const days = period === "daily" ? 1 : period === "weekly" ? 7 : 30;
  return new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
}

async function countActiveUsersOnDay(
  userIds: string[],
  cohortDate: Date,
  dayOffset: number
): Promise<number> {
  const targetDate = new Date(cohortDate);
  targetDate.setDate(targetDate.getDate() + dayOffset);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  // Count unique users who had any activity on that day
  // Use groupBy to get distinct childIds, then count
  const activeUsers = await prisma.lessonCompletion.groupBy({
    by: ["childId"],
    where: {
      child: {
        parentId: { in: userIds },
      },
      completedAt: {
        gte: targetDate,
        lt: nextDay,
      },
    },
  });

  return activeUsers.length;
}

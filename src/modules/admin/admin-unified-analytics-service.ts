import { getAdminOverview } from "./admin-overview-service";
import { getAdminLearningAnalytics } from "./admin-learning-analytics-service";
import { getAdminRetentionAnalytics } from "./admin-retention-analytics-service";
import { getAdminSoTDashboardSnapshot } from "./admin-sot-dashboard-service";
import { getRevenueMetrics, getRevenueTimeSeries } from "./admin-revenue-service";
import { getActiveUserCount, getActiveSessionCount } from "@/lib/analytics/realtime/counters-service";
import { prisma } from "@/lib/db";
import { subDays } from "date-fns";

export interface UnifiedAnalyticsSnapshot {
  timestamp: string;
  overview: Awaited<ReturnType<typeof getAdminOverview>>;
  learning: Awaited<ReturnType<typeof getAdminLearningAnalytics>>;
  retention: Awaited<ReturnType<typeof getAdminRetentionAnalytics>>;
  sot: Awaited<ReturnType<typeof getAdminSoTDashboardSnapshot>>;
  revenue: Awaited<ReturnType<typeof getRevenueMetrics>>;
  realtime: {
    activeUsers: number;
    activeSessions: number;
  };
}

export interface TimeSeriesDataPoint {
  date: string;
  revenue: number;
  users: number;
  completions: number;
  newCustomers: number;
  paidOrders: number;
  successfulEnrollments: number;
  // Legacy field kept for one compatibility cycle.
  churnedCustomers: number;
}

export async function getUnifiedAnalyticsSnapshot(): Promise<UnifiedAnalyticsSnapshot> {
  const [
    overview,
    learning,
    retention,
    sot,
    revenue,
    activeUsers,
    activeSessions,
  ] = await Promise.all([
    getAdminOverview(),
    getAdminLearningAnalytics(),
    getAdminRetentionAnalytics(),
    getAdminSoTDashboardSnapshot(),
    getRevenueMetrics(),
    getActiveUserCount(),
    getActiveSessionCount(),
  ]);

  return {
    timestamp: new Date().toISOString(),
    overview,
    learning,
    retention,
    sot,
    revenue,
    realtime: {
      activeUsers,
      activeSessions,
    },
  };
}

export async function getUnifiedTimeSeriesData(days: number = 30): Promise<TimeSeriesDataPoint[]> {
  const revenueTimeSeries = await getRevenueTimeSeries(days);
  
  // Get daily user activity data
  const data: TimeSeriesDataPoint[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(now, i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // Get active users for this day
    const activeUsers = await prisma.lessonCompletion.groupBy({
      by: ["childId"],
      where: {
        completedAt: {
          gte: date,
          lt: nextDate,
        },
      },
    });
    
    // Get completions for this day
    const completions = await prisma.lessonCompletion.count({
      where: {
        completedAt: {
          gte: date,
          lt: nextDate,
        },
      },
    });
    
    const dateKey = date.toISOString().split("T")[0];
    const revenueData = revenueTimeSeries.find(
      (r) => r.date === dateKey,
    ) || { revenue: 0, newCustomers: 0, paidOrders: 0, successfulEnrollments: 0, churnedCustomers: 0 };
    
    data.push({
      date: dateKey,
      revenue: revenueData.revenue,
      users: activeUsers.length,
      completions,
      newCustomers: revenueData.newCustomers,
      paidOrders: revenueData.paidOrders,
      successfulEnrollments: revenueData.successfulEnrollments,
      churnedCustomers: revenueData.churnedCustomers,
    });
  }
  
  return data;
}

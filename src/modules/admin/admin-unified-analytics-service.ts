import { getAdminOverview } from "./admin-overview-service";
import { getAdminLearningAnalytics } from "./admin-learning-analytics-service";
import { getAdminRetentionAnalytics } from "./admin-retention-analytics-service";
import { getAdminSoTDashboardSnapshot } from "./admin-sot-dashboard-service";
import { getRevenueMetrics, getRevenueTimeSeries } from "./admin-revenue-service";
import { getActiveUserCount, getActiveSessionCount } from "@/lib/analytics/realtime/counters-service";
import { logWarn } from "@/lib/observability/logger";
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
  churnedCustomers: number;
}

const EMPTY_OVERVIEW: UnifiedAnalyticsSnapshot["overview"] = {
  counts: {
    parents: 0,
    children: 0,
    successfulPayments30d: 0,
    successfulRevenueVnd30d: 0,
    referralCodes: 0,
    referralAttributions: 0,
    paidReferrals: 0,
    rewardedReferrals: 0,
  },
  subscriptionsByStatus: {},
  webhooksByStatus: {},
  recentPayments: [],
  recentWebhookEvents: [],
};

const EMPTY_LEARNING: UnifiedAnalyticsSnapshot["learning"] = {
  activeChildrenLast7d: 0,
  activeChildrenLast30d: 0,
  totalLessonsCompleted30d: 0,
  avgMinutesPerChildPerDay: 0,
  topLessons: [],
  streakDistribution: {
    zero: 0,
    low: 0,
    medium: 0,
    high: 0,
  },
};

const EMPTY_RETENTION: UnifiedAnalyticsSnapshot["retention"] = {
  newParents7d: 0,
  newParents30d: 0,
  churned30d: 0,
  retentionRate: 0,
  avgDaysToFirstLesson: 0,
  avgLessonsPerChildPerWeek: 0,
};

const EMPTY_SOT: UnifiedAnalyticsSnapshot["sot"] = {
  window: "7d",
  sqlAudit: {
    counts7d: {
      course_checkout_started: 0,
      course_purchase_succeeded: 0,
      "learning.lesson.video.watch.completed": 0,
      report_viewed: 0,
      report_shared: 0,
      level_change_request_created: 0,
      level_change_request_decided: 0,
    },
    counts30d: {
      course_checkout_started: 0,
      course_purchase_succeeded: 0,
      "learning.lesson.video.watch.completed": 0,
      report_viewed: 0,
      report_shared: 0,
      level_change_request_created: 0,
      level_change_request_decided: 0,
    },
    checkoutToPurchaseRate7d: 0,
    latestAuditAt: null,
  },
  ga4: {
    status: "disabled",
    window: "7d",
    sessions: 0,
    activeUsers: 0,
    eventCounts: {
      checkoutStarted: 0,
      purchaseSucceeded: 0,
      lessonCompleted: 0,
      reportViewed: 0,
    },
    topEvents: [],
  },
};

const EMPTY_REVENUE: UnifiedAnalyticsSnapshot["revenue"] = {
  mrr: 0,
  arr: 0,
  totalRevenue30d: 0,
  totalRevenue7d: 0,
  revenueByPlan: {},
  churnRate: 0,
  churnRevenue30d: 0,
  netRevenueRetention: 0,
  newMrr30d: 0,
  expansionMrr30d: 0,
  contractionMrr30d: 0,
};

async function safeAnalyticsSection<T>(section: string, loader: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await loader();
  } catch (error) {
    logWarn("admin.analytics.section_fallback", {
      section,
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return fallback;
  }
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
    safeAnalyticsSection("overview", getAdminOverview, EMPTY_OVERVIEW),
    safeAnalyticsSection("learning", getAdminLearningAnalytics, EMPTY_LEARNING),
    safeAnalyticsSection("retention", getAdminRetentionAnalytics, EMPTY_RETENTION),
    safeAnalyticsSection("sot", getAdminSoTDashboardSnapshot, EMPTY_SOT),
    safeAnalyticsSection("revenue", getRevenueMetrics, EMPTY_REVENUE),
    safeAnalyticsSection("realtime.activeUsers", getActiveUserCount, 0),
    safeAnalyticsSection("realtime.activeSessions", getActiveSessionCount, 0),
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
  const safeDays = Number.isFinite(days) ? Math.min(Math.max(Math.floor(days), 1), 365) : 30;
  const revenueTimeSeries = await safeAnalyticsSection(
    "timeseries.revenue",
    () => getRevenueTimeSeries(safeDays),
    [],
  );
  
  // Get daily user activity data
  const data: TimeSeriesDataPoint[] = [];
  const now = new Date();
  
  for (let i = safeDays - 1; i >= 0; i--) {
    const date = subDays(now, i);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // Get active users for this day
    const [activeUsers, completions] = await Promise.all([
      prisma.lessonCompletion.groupBy({
        by: ["childId"],
        where: {
          completedAt: {
            gte: date,
            lt: nextDate,
          },
        },
      }),
      prisma.lessonCompletion.count({
        where: {
          completedAt: {
            gte: date,
            lt: nextDate,
          },
        },
      }),
    ]);
    
    const revenueData = revenueTimeSeries.find(
      (r) => r.date === date.toISOString().split("T")[0]
    ) || { revenue: 0, newCustomers: 0, churnedCustomers: 0 };
    
    data.push({
      date: date.toISOString().split("T")[0],
      revenue: revenueData.revenue,
      users: activeUsers.length,
      completions,
      newCustomers: revenueData.newCustomers,
      churnedCustomers: revenueData.churnedCustomers,
    });
  }
  
  return data;
}

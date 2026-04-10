import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getAdminOverviewMock,
  getAdminLearningAnalyticsMock,
  getAdminRetentionAnalyticsMock,
  getAdminSoTDashboardSnapshotMock,
  getRevenueMetricsMock,
  getRevenueTimeSeriesMock,
  getActiveUserCountMock,
  getActiveSessionCountMock,
  prismaMock,
} = vi.hoisted(() => ({
  getAdminOverviewMock: vi.fn(),
  getAdminLearningAnalyticsMock: vi.fn(),
  getAdminRetentionAnalyticsMock: vi.fn(),
  getAdminSoTDashboardSnapshotMock: vi.fn(),
  getRevenueMetricsMock: vi.fn(),
  getRevenueTimeSeriesMock: vi.fn(),
  getActiveUserCountMock: vi.fn(),
  getActiveSessionCountMock: vi.fn(),
  prismaMock: {
    lessonCompletion: {
      groupBy: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("@/modules/admin/admin-overview-service", () => ({
  getAdminOverview: getAdminOverviewMock,
}));

vi.mock("@/modules/admin/admin-learning-analytics-service", () => ({
  getAdminLearningAnalytics: getAdminLearningAnalyticsMock,
}));

vi.mock("@/modules/admin/admin-retention-analytics-service", () => ({
  getAdminRetentionAnalytics: getAdminRetentionAnalyticsMock,
}));

vi.mock("@/modules/admin/admin-sot-dashboard-service", () => ({
  getAdminSoTDashboardSnapshot: getAdminSoTDashboardSnapshotMock,
}));

vi.mock("@/modules/admin/admin-revenue-service", () => ({
  getRevenueMetrics: getRevenueMetricsMock,
  getRevenueTimeSeries: getRevenueTimeSeriesMock,
}));

vi.mock("@/lib/analytics/realtime/counters-service", () => ({
  getActiveUserCount: getActiveUserCountMock,
  getActiveSessionCount: getActiveSessionCountMock,
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import {
  getUnifiedAnalyticsSnapshot,
  getUnifiedTimeSeriesData,
} from "@/modules/admin/admin-unified-analytics-service";

describe("admin unified analytics service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("falls back only failed sections instead of throwing", async () => {
    getAdminOverviewMock.mockResolvedValue({
      counts: {
        parents: 1,
        children: 2,
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
    });
    getAdminLearningAnalyticsMock.mockRejectedValue(new Error("learning_db_down"));
    getAdminRetentionAnalyticsMock.mockResolvedValue({
      newParents7d: 0,
      newParents30d: 0,
      churned30d: 0,
      retentionRate: 0,
      avgDaysToFirstLesson: 0,
      avgLessonsPerChildPerWeek: 0,
    });
    getAdminSoTDashboardSnapshotMock.mockResolvedValue({
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
    });
    getRevenueMetricsMock.mockResolvedValue({
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
    });
    getActiveUserCountMock.mockRejectedValue(new Error("redis_unavailable"));
    getActiveSessionCountMock.mockResolvedValue(3);

    const snapshot = await getUnifiedAnalyticsSnapshot();

    expect(snapshot.overview.counts.parents).toBe(1);
    expect(snapshot.learning).toMatchObject({
      activeChildrenLast7d: 0,
      topLessons: [],
    });
    expect(snapshot.realtime.activeUsers).toBe(0);
    expect(snapshot.realtime.activeSessions).toBe(3);
  });

  it("normalizes invalid timeseries days to default window", async () => {
    getRevenueTimeSeriesMock.mockResolvedValue([]);
    prismaMock.lessonCompletion.groupBy.mockResolvedValue([]);
    prismaMock.lessonCompletion.count.mockResolvedValue(0);

    const data = await getUnifiedTimeSeriesData(Number.NaN);

    expect(data).toHaveLength(30);
    expect(getRevenueTimeSeriesMock).toHaveBeenCalledWith(30);
  });
});

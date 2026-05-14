"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart2,
  BookOpen,
  TrendingUp,
  Users,
  DollarSign,
  Activity,
  Download,
  RefreshCw,
  Filter,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSectionCard } from "@/components/admin/ui/admin-section-card";
import { AdminStatCard } from "@/components/admin/ui/admin-stat-card";
import { AdminDataTable } from "@/components/admin/ui/admin-data-table";
import { TimeSeriesChart } from "@/components/admin/analytics/time-series-chart";
import { DateRangePicker } from "@/components/admin/analytics/date-range-picker";
import { RealtimeDashboard } from "@/components/admin/analytics/realtime-dashboard";
import { RevenueDashboard } from "@/components/admin/analytics/revenue-dashboard";
import { ContentPerformance } from "@/components/admin/analytics/content-performance";
import { exportAnalyticsToCSV } from "@/lib/analytics/export-service";
import { cn } from "@/lib/utils";
import { subDays } from "date-fns";

interface DateRange {
  from?: Date;
  to?: Date;
}

interface UnifiedSnapshot {
  timestamp: string;
  overview: {
    counts: {
      parents: number;
      children: number;
      successfulPayments30d: number;
      successfulRevenueVnd30d: number;
      referralCodes: number;
      referralAttributions: number;
      paidReferrals: number;
      rewardedReferrals: number;
    };
    subscriptionsByStatus: Record<string, number>;
    webhooksByStatus: Record<string, number>;
    recentPayments: Array<{
      id: string;
      provider: string;
      amountVnd: number;
      status: string;
      processedAt: string;
      parent: { email: string };
    }>;
    recentWebhookEvents: Array<{
      id: string;
      provider: string;
      status: string;
      createdAt: string;
    }>;
  };
  learning: {
    activeChildrenLast7d: number;
    activeChildrenLast30d: number;
    totalLessonsCompleted30d: number;
    avgMinutesPerChildPerDay: number;
    topLessons: Array<{
      lessonId: string;
      title: string;
      completionCount: number;
    }>;
    streakDistribution: {
      zero: number;
      low: number;
      medium: number;
      high: number;
    };
  };
  retention: {
    newParents7d: number;
    newParents30d: number;
    churned30d: number;
    retentionRate: number;
    avgDaysToFirstLesson: number;
    avgLessonsPerChildPerWeek: number;
  };
  sot: {
    window: string;
    sqlAudit: {
      counts7d: Record<string, number>;
      counts30d: Record<string, number>;
      checkoutToPurchaseRate7d: number;
      latestAuditAt: string | null;
    };
    ga4: {
      pageViews7d: number;
      sessions7d: number;
      users7d: number;
      bounceRate: number;
      avgSessionDuration: number;
    };
  };
  revenue: {
    totalRevenue30d: number;
    totalRevenue7d: number;
    courseOrderCount30d: number;
    courseOrderCount7d: number;
    uniqueBuyers30d: number;
    successfulEnrollments30d: number;
    averageOrderValue30d: number;
    revenueByProduct: Record<"COURSE_SINGLE" | "COURSE_BUNDLE" | "COURSE_OTHER", number>;
    topCourses30d: Array<{
      courseId: string;
      courseSlug: string;
      title: string;
      enrollmentCount: number;
      revenueVnd: number;
    }>;
    // Legacy fields kept in API for one compatibility cycle.
    mrr: number;
    arr: number;
    revenueByPlan: Record<string, number>;
    churnRate: number;
    churnRevenue30d: number;
    newMrr30d: number;
  };
  realtime: {
    activeUsers: number;
    activeSessions: number;
  };
}

interface TimeSeriesData {
  date: string;
  revenue: number;
  users: number;
  completions: number;
  newCustomers: number;
  paidOrders?: number;
  successfulEnrollments?: number;
  churnedCustomers: number;
}

function asPercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function streakBarClass(key: "zero" | "low" | "medium" | "high"): string {
  switch (key) {
    case "zero":
      return "bg-slate-400";
    case "low":
      return "bg-amber-400";
    case "medium":
      return "bg-sky-500";
    case "high":
      return "bg-emerald-500";
    default:
      return "bg-slate-400";
  }
}

function getRetentionTone(retentionRate: number): string {
  if (retentionRate >= 70) return "text-emerald-700";
  if (retentionRate >= 40) return "text-amber-700";
  return "text-rose-700";
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function AdminAnalyticsPage() {
  const t = useTranslations("admin.analytics");
  const [snapshot, setSnapshot] = useState<UnifiedSnapshot | null>(null);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      const days = dateRange?.from
        ? Math.max(7, Math.ceil((Date.now() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)))
        : 30;

      const [snapshotRes, timeSeriesRes] = await Promise.all([
        fetch("/api/admin/analytics/snapshot?type=snapshot"),
        fetch(`/api/admin/analytics/snapshot?type=timeseries&days=${days}`),
      ]);

      if (!snapshotRes.ok || !timeSeriesRes.ok) {
        throw new Error("Failed to fetch analytics data");
      }

      const snapshotData = await snapshotRes.json();
      const timeSeriesData = await timeSeriesRes.json();

      setSnapshot(snapshotData.data);
      setTimeSeries(timeSeriesData.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExport = (type: string) => {
    if (!snapshot) return;

    let data: Record<string, unknown>[] = [];

    switch (type) {
      case "overview":
        data = [
          {
            metric: "General parents",
            value: snapshot.overview.counts.parents,
          },
          {
            metric: "Total students",
            value: snapshot.overview.counts.children,
          },
          {
            metric: "30-day revenue",
            value: snapshot.overview.counts.successfulRevenueVnd30d,
          },
          {
            metric: "Successful payment within 30 days",
            value: snapshot.overview.counts.successfulPayments30d,
          },
        ];
        break;
      case "learning":
        data = snapshot.learning.topLessons.map((lesson) => ({
          lessonId: lesson.lessonId,
          title: lesson.title,
          completionCount: lesson.completionCount,
        }));
        break;
      case "revenue":
        data = [
          ...Object.entries(snapshot.revenue.revenueByProduct).map(([product, revenue]) => ({
            kind: "bucket",
            product,
            revenue,
            percentage:
              snapshot.revenue.totalRevenue30d > 0
                ? ((revenue / snapshot.revenue.totalRevenue30d) * 100).toFixed(2)
                : 0,
          })),
          ...snapshot.revenue.topCourses30d.map((course) => ({
            kind: "course",
            courseId: course.courseId,
            courseSlug: course.courseSlug,
            title: course.title,
            enrollmentCount: course.enrollmentCount,
            revenueVnd: course.revenueVnd,
          })),
        ];
        break;
      case "timeseries":
        data = timeSeries.map(ts => ({ ...ts })) as Record<string, unknown>[];
        break;
      default:
        return;
    }

    exportAnalyticsToCSV(data, type, dateRange);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-[var(--admin-text-secondary)]">
          <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4" />
          <p>{t("loadingText")}</p>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-rose-500">
          <p>Error: {error || t("loadingText")}</p>
          <Button onClick={fetchData} variant="outline" className="mt-4">
            {t("errorRetry")}
          </Button>
        </div>
      </div>
    );
  }

  const streakTotal =
    snapshot.learning.streakDistribution.zero +
    snapshot.learning.streakDistribution.low +
    snapshot.learning.streakDistribution.medium +
    snapshot.learning.streakDistribution.high;

  const topLessonsData = snapshot.learning.topLessons.map((lesson) => ({
    lessonId: lesson.lessonId,
    title: lesson.title,
    completionCount: lesson.completionCount,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title={t("title")}
        description={t("description")}
        icon={<BarChart2 size={18} />}
        eyebrow={t("eyebrow")}
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 bg-[var(--admin-card-bg)] p-4 rounded-lg border border-[var(--admin-card-border)]">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[var(--admin-text-secondary)]" />
          <span className="text-sm font-medium text-[var(--admin-text-primary)]">{t("filterLabel")}</span>
        </div>
        <DateRangePicker onChange={setDateRange} defaultValue={dateRange} />
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={refreshing}
          className="ml-auto"
        >
          <RefreshCw size={16} className={cn("mr-2", refreshing && "animate-spin")} />
          {t("refreshButton")}
        </Button>
      </div>

      {/* Realtime Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AdminStatCard
          label={t("stats.activeUser")}
          value={snapshot.realtime.activeUsers}
          icon={<Activity size={16} />}
          trend={{ value: snapshot.realtime.activeUsers, label: "Real-time" }}
        />
        <AdminStatCard
          label={t("stats.activeSession")}
          value={snapshot.realtime.activeSessions}
          icon={<Users size={16} />}
        />
        <AdminStatCard
          label={t("stats.revenue30d")}
          value={formatVND(snapshot.revenue.totalRevenue30d)}
          icon={<DollarSign size={16} />}
        />
        <AdminStatCard
          label={t("stats.retentionRate")}
          value={`${snapshot.retention.retentionRate}%`}
          icon={<TrendingUp size={16} />}
        />
      </div>

      {/* Time Series Chart */}
      <AdminSectionCard
        title={t("trendsOverTime")}
        icon={<TrendingUp size={16} />}
        headerActions={
          <Button variant="outline" size="sm" onClick={() => handleExport("timeseries")}>
            <Download size={16} className="mr-2" />
            {t("exportCsv")}
          </Button>
        }
      >
        {timeSeries.length > 0 ? (
          <TimeSeriesChart
            data={timeSeries}
            metrics={["revenue", "users", "completions"]}
          />
        ) : (
          <div className="text-center py-8 text-[var(--admin-text-secondary)]">
            {t("noTrendData")}
          </div>
        )}
      </AdminSectionCard>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-[var(--admin-card-bg)]">
          <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
          <TabsTrigger value="learning">{t("tabs.learning")}</TabsTrigger>
          <TabsTrigger value="revenue">{t("tabs.revenue")}</TabsTrigger>
          <TabsTrigger value="retention">{t("tabs.retention")}</TabsTrigger>
          <TabsTrigger value="realtime">{t("tabs.realtime")}</TabsTrigger>
          <TabsTrigger value="content">{t("tabs.content")}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => handleExport("overview")}>
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminStatCard
              label={t("stats.parents")}
              value={snapshot.overview.counts.parents}
              icon={<Users size={16} />}
            />
            <AdminStatCard
              label={t("stats.children")}
              value={snapshot.overview.counts.children}
              icon={<BookOpen size={16} />}
            />
            <AdminStatCard
              label={t("stats.referralCode")}
              value={snapshot.overview.counts.referralCodes}
              trend={{
                value: snapshot.overview.counts.paidReferrals,
                label: String(snapshot.overview.counts.paidReferrals),
              }}
            />
            <AdminStatCard
              label={t("stats.coursesOrdered")}
              value={snapshot.revenue.courseOrderCount30d}
              trend={{
                value: snapshot.revenue.uniqueBuyers30d,
                label: String(snapshot.revenue.uniqueBuyers30d),
              }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AdminSectionCard title={t("recentPayments")} icon={<DollarSign size={16} />}>
              <AdminDataTable
                columns={[
                  { key: "parent.email", label: t("colParent") },
                  { key: "amountVnd", label: t("colAmount") },
                  { key: "status", label: t("colStatus") },
                ]}
                data={snapshot.overview.recentPayments.map((p) => ({
                  ...p,
                  amountVnd: formatVND(p.amountVnd),
                }))}
                emptyMessage={t("noPayments")}
              />
            </AdminSectionCard>

            <AdminSectionCard title={t("recentWebhooks")} icon={<Activity size={16} />}>
              <AdminDataTable
                columns={[
                  { key: "provider", label: t("colProvider") },
                  { key: "status", label: t("colStatus") },
                  { key: "createdAt", label: t("colTime") },
                ]}
                data={snapshot.overview.recentWebhookEvents.map((w) => ({
                  ...w,
                  createdAt: new Date(w.createdAt).toLocaleString(),
                }))}
                emptyMessage={t("noWebhooks")}
              />
            </AdminSectionCard>
          </div>
        </TabsContent>

        {/* Learning Tab */}
        <TabsContent value="learning" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => handleExport("learning")}>
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminSectionCard title={t("activeStudents")} icon={<Users size={16} />}>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <AdminStatCard
                  label={t("last7Days")}
                  value={snapshot.learning.activeChildrenLast7d}
                  trend={{
                    value: snapshot.learning.activeChildrenLast7d,
                    label: `${asPercent(
                      snapshot.learning.activeChildrenLast7d,
                      snapshot.overview.counts.children
                    )}%`,
                  }}
                />
                <AdminStatCard
                  label={t("last30Days")}
                  value={snapshot.learning.activeChildrenLast30d}
                  trend={{
                    value: snapshot.learning.activeChildrenLast30d,
                    label: `${asPercent(
                      snapshot.learning.activeChildrenLast30d,
                      snapshot.overview.counts.children
                    )}%`,
                  }}
                />
              </div>
            </AdminSectionCard>

            <AdminSectionCard title={t("lessonSummary")} icon={<BookOpen size={16} />}>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <AdminStatCard
                  label={t("lessonsCompleted")}
                  value={snapshot.learning.totalLessonsCompleted30d.toLocaleString()}
                />
                <AdminStatCard
                  label={t("minutesPerDay")}
                  value={snapshot.learning.avgMinutesPerChildPerDay}
                />
              </div>
            </AdminSectionCard>
          </div>

          <div className="rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-[var(--admin-text-secondary)]">
                {t("streakDistribution")}
              </h3>
              <span className="text-xs text-[var(--admin-text-muted)]">
                {t("totalStudents", { total: streakTotal })}
              </span>
            </div>
            <div className="space-y-3">
              {(
                [
                  ["zero", t("streak0"), snapshot.learning.streakDistribution.zero],
                  ["low", t("streak1to3"), snapshot.learning.streakDistribution.low],
                  ["medium", t("streak4to7"), snapshot.learning.streakDistribution.medium],
                  ["high", t("streak7plus"), snapshot.learning.streakDistribution.high],
                ] as const
              ).map(([key, label, value]) => {
                const percent = asPercent(value, streakTotal);
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm text-[var(--admin-text-secondary)]">
                      <span>{label}</span>
                      <span>
                        {value} ({percent}%)
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-[var(--admin-sidebar-accent)]">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          streakBarClass(key)
                        )}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <AdminSectionCard title={t("topLessons")} icon={<BookOpen size={16} />}>
            <AdminDataTable
              columns={[
                { key: "title", label: t("colTitle") },
                { key: "completionCount", label: t("colCompletions") },
              ]}
              data={topLessonsData as Record<string, unknown>[]}
              emptyMessage={t("noLessons")}
            />
          </AdminSectionCard>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={() => handleExport("revenue")}>
              <Download size={16} className="mr-2" />
              Export CSV
            </Button>
          </div>
          <RevenueDashboard />
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminStatCard
              label={t("newParents7d")}
              value={snapshot.retention.newParents7d}
              trend={{ value: snapshot.retention.newParents30d, label: String(snapshot.retention.newParents30d) }}
            />
            <AdminStatCard
              label={t("buyerParents30d")}
              value={snapshot.revenue.uniqueBuyers30d}
            />
            <AdminStatCard
              label={t("stats.retentionRate")}
              value={`${snapshot.retention.retentionRate}%`}
              className={cn(
                getRetentionTone(snapshot.retention.retentionRate) === "text-emerald-700" &&
                  "[&_.text-slate-900]:text-emerald-700",
                getRetentionTone(snapshot.retention.retentionRate) === "text-amber-700" &&
                  "[&_.text-slate-900]:text-amber-700",
                getRetentionTone(snapshot.retention.retentionRate) === "text-rose-700" &&
                  "[&_.text-slate-900]:text-rose-700"
              )}
            />
            <AdminStatCard
              label={t("daysToFirstLesson")}
              value={snapshot.retention.avgDaysToFirstLesson}
              trend={{
                value: snapshot.retention.avgLessonsPerChildPerWeek,
                label: String(snapshot.retention.avgLessonsPerChildPerWeek),
              }}
            />
          </div>

          <AdminSectionCard title={t("sotAnalytics")} icon={<Activity size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--admin-sidebar-accent)] rounded-lg">
                <p className="text-sm text-[var(--admin-text-secondary)]">{t("conversionRate")}</p>
                <p className="text-2xl font-bold text-[var(--admin-text-primary)]">
                  {snapshot.sot.sqlAudit.checkoutToPurchaseRate7d}%
                </p>
                <p className="text-xs text-[var(--admin-text-muted)] mt-1">
                  {t("checkoutToPurchase")}
                </p>
              </div>
              <div className="p-4 bg-[var(--admin-sidebar-accent)] rounded-lg">
                <p className="text-sm text-[var(--admin-text-secondary)]">{t("videoCompleted")}</p>
                <p className="text-2xl font-bold text-[var(--admin-text-primary)]">
                  {snapshot.sot.sqlAudit.counts7d["learning.lesson.video.watch.completed"] || 0}
                </p>
                <p className="text-xs text-[var(--admin-text-muted)] mt-1">{t("last7Days")}</p>
              </div>
              <div className="p-4 bg-[var(--admin-sidebar-accent)] rounded-lg">
                <p className="text-sm text-[var(--admin-text-secondary)]">{t("ga4Sessions")}</p>
                <p className="text-2xl font-bold text-[var(--admin-text-primary)]">
                  {snapshot.sot.ga4.sessions7d.toLocaleString()}
                </p>
                <p className="text-xs text-[var(--admin-text-muted)] mt-1">{t("last7Days")}</p>
              </div>
            </div>
          </AdminSectionCard>
        </TabsContent>

        {/* Realtime Tab */}
        <TabsContent value="realtime">
          <RealtimeDashboard />
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <ContentPerformance />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="text-xs text-[var(--admin-text-muted)] text-right">
        {t("lastUpdated", { timestamp: new Date(snapshot.timestamp).toLocaleString() })}
      </div>
    </div>
  );
}

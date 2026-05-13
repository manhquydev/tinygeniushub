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
          <p>Loading analysis data...</p>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-rose-500">
          <p>Error: {error || "Unable to download data"}</p>
          <Button onClick={fetchData} variant="outline" className="mt-4">
            Retry
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
        title="Management analysis"
        description="Comprehensive overview of learning activity, revenue, and user metrics."
        icon={<BarChart2 size={18} />}
        eyebrow="Unified Analytics Dashboard"
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 bg-[var(--admin-card-bg)] p-4 rounded-lg border border-[var(--admin-card-border)]">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[var(--admin-text-secondary)]" />
          <span className="text-sm font-medium text-[var(--admin-text-primary)]">Filter:</span>
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
          Refresh
        </Button>
      </div>

      {/* Realtime Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <AdminStatCard
          label="Active user"
          value={snapshot.realtime.activeUsers}
          icon={<Activity size={16} />}
          trend={{ value: snapshot.realtime.activeUsers, label: "Real-time" }}
        />
        <AdminStatCard
          label="Session is active"
          value={snapshot.realtime.activeSessions}
          icon={<Users size={16} />}
        />
        <AdminStatCard
          label="Total revenue 30 days"
          value={formatVND(snapshot.revenue.totalRevenue30d)}
          icon={<DollarSign size={16} />}
        />
        <AdminStatCard
          label="Retention rate"
          value={`${snapshot.retention.retentionRate}%`}
          icon={<TrendingUp size={16} />}
        />
      </div>

      {/* Time Series Chart */}
      <AdminSectionCard
        title="Trends over time"
        icon={<TrendingUp size={16} />}
        headerActions={
          <Button variant="outline" size="sm" onClick={() => handleExport("timeseries")}>
            <Download size={16} className="mr-2" />
            Export CSV
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
            No trend data available
          </div>
        )}
      </AdminSectionCard>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-[var(--admin-card-bg)]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="learning">Study</TabsTrigger>
          <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
          <TabsTrigger value="retention">Keep your feet</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
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
              label="General parents"
              value={snapshot.overview.counts.parents}
              icon={<Users size={16} />}
            />
            <AdminStatCard
              label="Total students"
              value={snapshot.overview.counts.children}
              icon={<BookOpen size={16} />}
            />
            <AdminStatCard
              label="Referral code"
              value={snapshot.overview.counts.referralCodes}
              trend={{
                value: snapshot.overview.counts.paidReferrals,
                label: `${snapshot.overview.counts.paidReferrals}paid`,
              }}
            />
            <AdminStatCard
              label="Single course (30 days)"
              value={snapshot.revenue.courseOrderCount30d}
              trend={{
                value: snapshot.revenue.uniqueBuyers30d,
                label: `${snapshot.revenue.uniqueBuyers30d}Parents buy keys`,
              }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <AdminSectionCard title="Recent payment" icon={<DollarSign size={16} />}>
              <AdminDataTable
                columns={[
                  { key: "parent.email", label: "Parents" },
                  { key: "amountVnd", label: "Amount" },
                  { key: "status", label: "Status" },
                ]}
                data={snapshot.overview.recentPayments.map((p) => ({
                  ...p,
                  amountVnd: formatVND(p.amountVnd),
                }))}
                emptyMessage="There are no payments yet"
              />
            </AdminSectionCard>

            <AdminSectionCard title="Recent Webhook events" icon={<Activity size={16} />}>
              <AdminDataTable
                columns={[
                  { key: "provider", label: "Provider" },
                  { key: "status", label: "Status" },
                  { key: "createdAt", label: "Time" },
                ]}
                data={snapshot.overview.recentWebhookEvents.map((w) => ({
                  ...w,
                  createdAt: new Date(w.createdAt).toLocaleString("vi-VN"),
                }))}
                emptyMessage="There are no webhook events yet"
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
            <AdminSectionCard title="Students in action" icon={<Users size={16} />}>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <AdminStatCard
                  label="7 days"
                  value={snapshot.learning.activeChildrenLast7d}
                  trend={{
                    value: snapshot.learning.activeChildrenLast7d,
                    label: `${asPercent(
                      snapshot.learning.activeChildrenLast7d,
                      snapshot.overview.counts.children
                    )}% total`,
                  }}
                />
                <AdminStatCard
                  label="30 days"
                  value={snapshot.learning.activeChildrenLast30d}
                  trend={{
                    value: snapshot.learning.activeChildrenLast30d,
                    label: `${asPercent(
                      snapshot.learning.activeChildrenLast30d,
                      snapshot.overview.counts.children
                    )}% total`,
                  }}
                />
              </div>
            </AdminSectionCard>

            <AdminSectionCard title="Lesson summary (30 days)" icon={<BookOpen size={16} />}>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <AdminStatCard
                  label="Lesson completed"
                  value={snapshot.learning.totalLessonsCompleted30d.toLocaleString()}
                />
                <AdminStatCard
                  label="Minutes / baby / day"
                  value={snapshot.learning.avgMinutesPerChildPerDay}
                />
              </div>
            </AdminSectionCard>
          </div>

          <div className="rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-semibold text-[var(--admin-text-secondary)]">
                Distribution of school days
              </h3>
              <span className="text-xs text-[var(--admin-text-muted)]">
                Total: {streakTotal} students
              </span>
            </div>
            <div className="space-y-3">
              {(
                [
                  ["zero", "0 days", snapshot.learning.streakDistribution.zero],
                  ["low", "1-3 days", snapshot.learning.streakDistribution.low],
                  ["medium", "4-7 days", snapshot.learning.streakDistribution.medium],
                  ["high", "Over 7 days", snapshot.learning.streakDistribution.high],
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

          <AdminSectionCard title="The most popular lesson" icon={<BookOpen size={16} />}>
            <AdminDataTable
              columns={[
                { key: "title", label: "Title" },
                { key: "completionCount", label: "Completed turn" },
              ]}
              data={topLessonsData as Record<string, unknown>[]}
              emptyMessage="There is no completed data in the last 30 days."
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
              label="New Parents (7 days)"
              value={snapshot.retention.newParents7d}
              trend={{ value: snapshot.retention.newParents30d, label: `${snapshot.retention.newParents30d}within 30 days` }}
            />
            <AdminStatCard
              label="Parents purchase key (30 days)"
              value={snapshot.revenue.uniqueBuyers30d}
            />
            <AdminStatCard
              label="Retention rate"
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
              label="Number of days to first post"
              value={snapshot.retention.avgDaysToFirstLesson}
              trend={{
                value: snapshot.retention.avgLessonsPerChildPerWeek,
                label: `${snapshot.retention.avgLessonsPerChildPerWeek}post/baby/week`,
              }}
            />
          </div>

          <AdminSectionCard title="SoT Analytics" icon={<Activity size={16} />}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--admin-sidebar-accent)] rounded-lg">
                <p className="text-sm text-[var(--admin-text-secondary)]">Conversion rate (7 days)</p>
                <p className="text-2xl font-bold text-[var(--admin-text-primary)]">
                  {snapshot.sot.sqlAudit.checkoutToPurchaseRate7d}%
                </p>
                <p className="text-xs text-[var(--admin-text-muted)] mt-1">
                  Checkout → Purchase
                </p>
              </div>
              <div className="p-4 bg-[var(--admin-sidebar-accent)] rounded-lg">
                <p className="text-sm text-[var(--admin-text-secondary)]">Video completed</p>
                <p className="text-2xl font-bold text-[var(--admin-text-primary)]">
                  {snapshot.sot.sqlAudit.counts7d["learning.lesson.video.watch.completed"] || 0}
                </p>
                <p className="text-xs text-[var(--admin-text-muted)] mt-1">Last 7 days</p>
              </div>
              <div className="p-4 bg-[var(--admin-sidebar-accent)] rounded-lg">
                <p className="text-sm text-[var(--admin-text-secondary)]">GA4 Sessions</p>
                <p className="text-2xl font-bold text-[var(--admin-text-primary)]">
                  {snapshot.sot.ga4.sessions7d.toLocaleString()}
                </p>
                <p className="text-xs text-[var(--admin-text-muted)] mt-1">Last 7 days</p>
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
        Last updated: {new Date(snapshot.timestamp).toLocaleString("vi-VN")}
      </div>
    </div>
  );
}

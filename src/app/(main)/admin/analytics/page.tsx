import { BarChart2, BookOpen, TrendingUp, Users } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminSectionCard } from "@/components/admin/ui/admin-section-card";
import { AdminStatCard } from "@/components/admin/ui/admin-stat-card";
import { AdminDataTable } from "@/components/admin/ui/admin-data-table";
import { cn } from "@/lib/utils";
import { getAdminLearningAnalytics, getAdminOverview, getAdminRetentionAnalytics } from "@/modules/admin/service";

function asPercent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function streakBarClass(key: "zero" | "low" | "medium" | "high") {
  switch (key) {
    case "zero": return "bg-slate-400";
    case "low": return "bg-amber-400";
    case "medium": return "bg-sky-500";
    case "high": return "bg-emerald-500";
    default: return "bg-slate-400";
  }
}

function getRetentionTone(retentionRate: number) {
  if (retentionRate >= 70) return "text-emerald-700";
  if (retentionRate >= 40) return "text-amber-700";
  return "text-rose-700";
}

export default async function AdminAnalyticsPage() {
  const [overview, learningAnalytics, retention] = await Promise.all([
    getAdminOverview(),
    getAdminLearningAnalytics(),
    getAdminRetentionAnalytics(),
  ]);

  const streakTotal =
    learningAnalytics.streakDistribution.zero +
    learningAnalytics.streakDistribution.low +
    learningAnalytics.streakDistribution.medium +
    learningAnalytics.streakDistribution.high;

  const topLessonsData = learningAnalytics.topLessons.map((lesson) => ({
    lessonId: lesson.lessonId,
    title: lesson.title,
    completionCount: lesson.completionCount,
  }));

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Phân tích quản trị"
        description="Theo dõi hoạt động học tập, phân bố streak và chỉ số giữ chân theo thời gian."
        icon={<BarChart2 size={18} />}
        eyebrow="Learning Intelligence"
      />

      <AdminSectionCard title="Phân tích học tập" icon={<BarChart2 size={16} />}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AdminSectionCard title="Học sinh hoạt động" icon={<Users size={14} />}>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <AdminStatCard
                  label="7 ngày"
                  value={learningAnalytics.activeChildrenLast7d}
                  trend={{
                    value: learningAnalytics.activeChildrenLast7d,
                    label: `${asPercent(learningAnalytics.activeChildrenLast7d, overview.counts.children)}% tổng số`,
                  }}
                />
                <AdminStatCard
                  label="30 ngày"
                  value={learningAnalytics.activeChildrenLast30d}
                  trend={{
                    value: learningAnalytics.activeChildrenLast30d,
                    label: `${asPercent(learningAnalytics.activeChildrenLast30d, overview.counts.children)}% tổng số`,
                  }}
                />
              </div>
            </AdminSectionCard>

            <AdminSectionCard title="Tổng kết bài học (30 ngày)" icon={<BookOpen size={14} />}>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <AdminStatCard
                  label="Bài học"
                  value={learningAnalytics.totalLessonsCompleted30d}
                />
                <AdminStatCard
                  label="Phút / bé / ngày"
                  value={learningAnalytics.avgMinutesPerChildPerDay}
                />
              </div>
            </AdminSectionCard>
          </div>

          <div className="rounded-xl border border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] p-4">
            <h3 className="text-sm font-semibold text-[var(--admin-text-secondary)] mb-3">Phân bố chuỗi ngày học</h3>
            <div className="space-y-2">
              {(
                [
                  ["zero", "0 ngày", learningAnalytics.streakDistribution.zero],
                  ["low", "1-3 ngày", learningAnalytics.streakDistribution.low],
                  ["medium", "4-7 ngày", learningAnalytics.streakDistribution.medium],
                  ["high", "Trên 7 ngày", learningAnalytics.streakDistribution.high],
                ] as const
              ).map(([key, label, value]) => {
                const percent = asPercent(value, streakTotal);
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-[var(--admin-text-secondary)]">
                      <span>{label}</span>
                      <span>{value} ({percent}%)</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--admin-sidebar-accent)]">
                      <div
                        className={cn("h-full rounded-full transition-all", streakBarClass(key))}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <AdminDataTable
            columns={[
              { key: "title", label: "Tên bài" },
              { key: "completionCount", label: "Lượt hoàn thành" },
            ]}
            data={topLessonsData as Record<string, unknown>[]}
            emptyMessage="Chưa có dữ liệu hoàn thành trong 30 ngày qua."
          />
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Chỉ số giữ chân" icon={<TrendingUp size={16} />}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            label="Phụ huynh mới (7 ngày)"
            value={retention.newParents7d}
            trend={{ value: retention.newParents30d, label: `${retention.newParents30d} trong 30 ngày` }}
          />
          <AdminStatCard
            label="Rời bỏ (30 ngày)"
            value={retention.churned30d}
          />
          <AdminStatCard
            label="Tỷ lệ giữ chân"
            value={`${retention.retentionRate}%`}
            className={cn(
              getRetentionTone(retention.retentionRate) === "text-emerald-700" && "[&_.text-slate-900]:text-emerald-700",
              getRetentionTone(retention.retentionRate) === "text-amber-700" && "[&_.text-slate-900]:text-amber-700",
              getRetentionTone(retention.retentionRate) === "text-rose-700" && "[&_.text-slate-900]:text-rose-700",
            )}
          />
          <AdminStatCard
            label="Số ngày đến bài đầu tiên"
            value={retention.avgDaysToFirstLesson}
            trend={{ value: retention.avgLessonsPerChildPerWeek, label: `${retention.avgLessonsPerChildPerWeek} bài/bé/tuần` }}
          />
        </div>
      </AdminSectionCard>
    </div>
  );
}

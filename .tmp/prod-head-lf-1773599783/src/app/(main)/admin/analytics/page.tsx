import { BarChart2, TrendingUp } from "lucide-react";
import { getAdminLearningAnalytics, getAdminOverview, getAdminRetentionAnalytics } from "@/modules/admin/service";

function asPercent(value: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function streakBarClass(key: "zero" | "low" | "medium" | "high") {
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

function getRetentionTone(retentionRate: number) {
  if (retentionRate >= 70) {
    return "text-emerald-700";
  }

  if (retentionRate >= 40) {
    return "text-amber-700";
  }

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

  return (
    <div className="page-stack">
      <section className="card page-stack">
        <h2 className="flex items-center gap-2">
          <BarChart2 size={18} className="shrink-0 text-teal-600" />
          Phân tích học tập
        </h2>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-500">Học sinh hoạt động</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">7 ngày</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{learningAnalytics.activeChildrenLast7d}</p>
                <p className="text-xs text-slate-500">
                  {asPercent(learningAnalytics.activeChildrenLast7d, overview.counts.children)}% trên tổng số bé
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">30 ngày</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{learningAnalytics.activeChildrenLast30d}</p>
                <p className="text-xs text-slate-500">
                  {asPercent(learningAnalytics.activeChildrenLast30d, overview.counts.children)}% trên tổng số bé
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-500">Tổng kết bài học (30 ngày)</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Bài học</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{learningAnalytics.totalLessonsCompleted30d}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-500">Phút / bé / ngày</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{learningAnalytics.avgMinutesPerChildPerDay}</p>
              </div>
            </div>
          </article>
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Phân bố chuỗi ngày học</h3>
          <div className="mt-3 grid gap-2">
            {([
              ["zero", "0 ngày", learningAnalytics.streakDistribution.zero],
              ["low", "1-3 ngày", learningAnalytics.streakDistribution.low],
              ["medium", "4-7 ngày", learningAnalytics.streakDistribution.medium],
              ["high", "Trên 7 ngày", learningAnalytics.streakDistribution.high],
            ] as const).map(([key, label, value]) => {
              const percent = asPercent(value, streakTotal);
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{label}</span>
                    <span>
                      {value} ({percent}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full ${streakBarClass(key)}`} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-700">Top 10 bài học phổ biến</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-[0.08em] text-slate-500">
                  <th className="px-2 py-2">Tên bài</th>
                  <th className="px-2 py-2">Lượt hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {learningAnalytics.topLessons.map((lesson) => (
                  <tr key={lesson.lessonId} className="border-t border-slate-100">
                    <td className="px-2 py-2 text-slate-800">{lesson.title}</td>
                    <td className="px-2 py-2 font-semibold text-slate-700">{lesson.completionCount}</td>
                  </tr>
                ))}
                {learningAnalytics.topLessons.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-2 py-3 text-slate-500">
                      Chưa có dữ liệu hoàn thành trong 30 ngày qua.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="card page-stack">
        <h2 className="flex items-center gap-2">
          <TrendingUp size={18} className="shrink-0 text-teal-600" />
          Chỉ số giữ chân
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-500">Phụ huynh mới</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{retention.newParents7d}</p>
            <p className="text-xs text-slate-500">7 ngày qua</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{retention.newParents30d} trong 30 ngày</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-500">Rời bỏ (30 ngày)</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{retention.churned30d}</p>
            <p className="text-xs text-slate-500">Gói đăng ký bị hủy</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-500">Tỷ lệ giữ chân</p>
            <p className={`mt-2 text-3xl font-extrabold ${getRetentionTone(retention.retentionRate)}`}>
              {retention.retentionRate}%
            </p>
            <p className="text-xs text-slate-500">Gói đang hoạt động / tổng số</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-500">Số ngày đến bài học đầu tiên</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{retention.avgDaysToFirstLesson}</p>
            <p className="text-xs text-slate-500">Chỉ báo ma sát onboarding</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">{retention.avgLessonsPerChildPerWeek} bài / bé / tuần</p>
          </article>
        </div>
      </section>
    </div>
  );
}

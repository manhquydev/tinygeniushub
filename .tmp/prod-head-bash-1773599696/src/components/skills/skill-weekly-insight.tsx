/**
 * SkillWeeklyInsight - weekly summary card shown on dashboard or skill overview.
 */

interface WeeklySummaryData {
  newProficient: Array<{ skillId: string; nameVi: string }>;
  biggestImprovement: { skillId: string; nameVi: string; delta: number } | null;
  reviewsCompleted: number;
  upcomingReviews: Array<{ skillId: string; nameVi: string; scheduledAt: string }>;
}

interface SkillWeeklyInsightProps {
  childName: string;
  summary: WeeklySummaryData;
}

export function SkillWeeklyInsight({ childName, summary }: SkillWeeklyInsightProps) {
  const hasData =
    summary.newProficient.length > 0 ||
    summary.biggestImprovement !== null ||
    summary.reviewsCompleted > 0 ||
    summary.upcomingReviews.length > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-sm">
      <h2 className="font-bold text-slate-800 text-base mb-3">Tuần này của {childName}</h2>

      {!hasData && (
        <p className="text-sm text-slate-400 text-center py-3">
          Chưa có hoạt động tuần này. Khuyến khích bé học mỗi ngày nhé!
        </p>
      )}

      <ul className="space-y-2">
        {summary.newProficient.length > 0 && (
          <li className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-0.5">✅</span>
            <span>
              <strong>{summary.newProficient.length} kỹ năng</strong> mới đạt Thành thạo:&nbsp;
              {summary.newProficient.map((s) => s.nameVi).join(", ")}
            </span>
          </li>
        )}

        {summary.biggestImprovement && (
          <li className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-0.5">📈</span>
            <span>
              <strong>{summary.biggestImprovement.nameVi}</strong> đang tiến bộ tốt ({summary.biggestImprovement.delta}%)
            </span>
          </li>
        )}

        {summary.reviewsCompleted > 0 && (
          <li className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-0.5">🔄</span>
            <span><strong>{summary.reviewsCompleted}</strong> bài luyện tập đã hoàn thành</span>
          </li>
        )}

        {summary.upcomingReviews.length > 0 && (
          <li className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-0.5">⏰</span>
            <span>
              Sắp đến hạn ôn tập:&nbsp;
              {summary.upcomingReviews.slice(0, 3).map((r) => r.nameVi).join(", ")}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}

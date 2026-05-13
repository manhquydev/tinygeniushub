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
      <h2 className="font-bold text-slate-800 text-base mb-3">This week for {childName}</h2>

      {!hasData && (
        <p className="text-sm text-slate-400 text-center py-3">
          No activities this week. Encourage your baby to learn every day!
        </p>
      )}

      <ul className="space-y-2">
        {summary.newProficient.length > 0 && (
          <li className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-0.5">✅</span>
            <span>
              <strong>{summary.newProficient.length} skills</strong> newly reached proficiency:&nbsp;
              {summary.newProficient.map((s) => s.nameVi).join(", ")}
            </span>
          </li>
        )}

        {summary.biggestImprovement && (
          <li className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-0.5">📈</span>
            <span>
              <strong>{summary.biggestImprovement.nameVi}</strong> is improving well ({summary.biggestImprovement.delta}%)
            </span>
          </li>
        )}

        {summary.reviewsCompleted > 0 && (
          <li className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-0.5">🔄</span>
            <span><strong>{summary.reviewsCompleted}</strong>exercise completed</span>
          </li>
        )}

        {summary.upcomingReviews.length > 0 && (
          <li className="flex items-start gap-2 text-sm text-slate-700">
            <span className="mt-0.5">⏰</span>
            <span>
              Due for review soon:&nbsp;
              {summary.upcomingReviews.slice(0, 3).map((r) => r.nameVi).join(", ")}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}

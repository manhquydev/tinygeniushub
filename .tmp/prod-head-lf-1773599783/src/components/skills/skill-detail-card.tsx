/**
 * SkillDetailCard - shows skill mastery detail, recent attempts, trend, and next review.
 */

import type { MasteryLevel, SkillDomain } from "@prisma/client";
import { SkillProgressRing } from "./skill-progress-ring";
import { MasteryBadge } from "./mastery-badge";

interface DailyAttempt {
  date: string;
  correct: number;
  total: number;
}

interface SkillDetailCardProps {
  skill: { nameVi: string; iconEmoji: string | null; domain: SkillDomain; gradeLevel: number };
  mastery: { score: number; level: MasteryLevel; totalAttempts: number; correctAttempts: number };
  recentAttempts: DailyAttempt[];
  nextReview: string | null;
  trend: "IMPROVING" | "STABLE" | "DECLINING";
  prerequisites: Array<{ id: string; nameVi: string; masteryLevel: MasteryLevel }>;
}

const TREND_CONFIG = {
  IMPROVING: { icon: "↑", label: "Đang tiến bộ", colorClass: "text-green-600 bg-green-50" },
  STABLE:    { icon: "→", label: "Ổn định",       colorClass: "text-slate-500 bg-slate-100" },
  DECLINING: { icon: "↓", label: "Cần luyện thêm", colorClass: "text-red-500 bg-red-50" },
};

export function SkillDetailCard({ skill, mastery, recentAttempts, nextReview, trend, prerequisites }: SkillDetailCardProps) {
  const trendCfg = TREND_CONFIG[trend];
  const pct = Math.round(mastery.score * 100);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{skill.iconEmoji ?? "📚"}</span>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-slate-900 text-lg leading-tight">{skill.nameVi}</h1>
            <p className="text-xs text-slate-400 mt-0.5">Lớp {skill.gradeLevel}</p>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trendCfg.colorClass}`}>
            {trendCfg.icon} {trendCfg.label}
          </span>
        </div>

        {/* Progress ring + stats row */}
        <div className="flex items-center gap-6">
          <SkillProgressRing score={mastery.score} size={84} />
          <div className="space-y-1">
            <MasteryBadge level={mastery.level} showLabel size="md" />
            <p className="text-xs text-slate-500">{pct}% thành thạo</p>
            <p className="text-xs text-slate-400">{mastery.totalAttempts} lần luyện · {mastery.correctAttempts} đúng</p>
            {nextReview && (
              <p className="text-xs text-indigo-600 font-medium">
                Ôn tập: {formatReviewDate(nextReview)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent attempts */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="font-semibold text-slate-700 text-sm mb-3">Hoạt động gần đây</h2>
        {recentAttempts.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">Chưa có bài luyện tập nào.</p>
        ) : (
          <ul className="space-y-2">
            {[...recentAttempts].reverse().map((day) => {
              const rate = day.total > 0 ? Math.round((day.correct / day.total) * 100) : 0;
              return (
                <li key={day.date} className="flex items-center gap-3 text-sm">
                  <span className="text-slate-400 text-xs tabular-nums w-16 flex-shrink-0">{formatDate(day.date)}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${rate}%` }} />
                  </div>
                  <span className="text-xs text-slate-500 tabular-nums w-14 text-right">
                    {day.correct}/{day.total} ({rate}%)
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Prerequisites */}
      {prerequisites.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="font-semibold text-slate-700 text-sm mb-2">Kỹ năng tiên quyết</h2>
          <ul className="space-y-1">
            {prerequisites.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{p.nameVi}</span>
                <MasteryBadge level={p.masteryLevel} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function formatReviewDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diff <= 0) return "Hôm nay";
  if (diff === 1) return "Ngày mai";
  return `${diff} ngày nữa`;
}

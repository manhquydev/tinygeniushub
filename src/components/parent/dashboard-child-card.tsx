import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";

export type RecentCompletion = {
  title: string;
  completedAt: Date;
};

type ChildCardProps = {
  child: { id: string; nickname: string; adaptiveEnabled: boolean };
  lessonsThisWeek: number;
  minutesLearned: number;
  streakDays: number;
  weeklyGoal: number;
  recentCompletions: RecentCompletion[];
};

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function DashboardChildCard({
  child,
  lessonsThisWeek,
  minutesLearned,
  streakDays,
  weeklyGoal,
  recentCompletions,
}: ChildCardProps) {
  const t = useTranslations("parent.dashboard.childCard");
  const progress = clampPercent((lessonsThisWeek / weeklyGoal) * 100);
  const initial = (child.nickname.trim().charAt(0) || "B").toUpperCase();

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-100 to-sky-100 text-xl font-black text-teal-700 shadow-inner">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-black tracking-[-0.01em] text-slate-900">{child.nickname}</p>
            <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
              {t("minutesStreak", { minutes: minutesLearned, streak: streakDays })}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-teal-500 to-sky-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="shrink-0 text-xs font-semibold text-slate-500">
                {t("lessonsProgress", { lessons: lessonsThisWeek, goal: weeklyGoal })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {child.adaptiveEnabled ? (
            <Link
              href={`/parent/dashboard/${encodeURIComponent(child.id)}/skills`}
              className="inline-flex min-h-11 items-center justify-center gap-1 rounded-full bg-indigo-50 px-4 text-sm font-bold text-indigo-700 ring-1 ring-indigo-200 transition hover:-translate-y-0.5"
            >
              {t("viewSkillMap")}
            </Link>
          ) : null}
          <Link
            href={`/kid/today?childId=${encodeURIComponent(child.id)}`}
            className="inline-flex min-h-11 items-center justify-center gap-1 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-4 text-sm font-bold text-white shadow-[0_6px_16px_rgba(13,148,136,0.28)] transition hover:-translate-y-0.5"
          >
            {t("continueStudying")}
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {recentCompletions.length > 0 ? (
        <div className="border-t border-slate-200/80 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{t("recentLessons")}</p>
          <ul className="space-y-1">
            {recentCompletions.map((item, idx) => (
              <li key={idx} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm text-slate-700">{item.title}</span>
                <span className="shrink-0 text-xs text-slate-400">
                  {new Date(item.completedAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

import type { LucideIcon } from "lucide-react";

export type DashboardMetric = {
  id: string;
  label: string;
  value: string;
  hint: string;
  progress: number;
  toneClass: string;
  progressClass: string;
  icon: LucideIcon;
};

type Props = {
  cards: DashboardMetric[];
};

export function DashboardMetricCards({ cards }: Props) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((metric) => (
        <article
          key={metric.id}
          className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-[0_12px_28px_rgba(15,23,42,0.06)] backdrop-blur"
        >
          <div className="flex items-start justify-between gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${metric.toneClass}`}>
              <metric.icon size={20} />
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
              {metric.hint}
            </span>
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-500">{metric.label}</p>
          <p className="mt-1 text-4xl font-extrabold tracking-[-0.02em] text-slate-900">{metric.value}</p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <span
              className={`block h-full rounded-full bg-gradient-to-r ${metric.progressClass} transition-all duration-500`}
              style={{ width: `${metric.progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">{metric.progress}% tiến độ mục tiêu</p>
        </article>
      ))}
    </section>
  );
}

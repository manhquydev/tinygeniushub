"use client";

type WeeklyProgressPoint = {
  weekStart: string;
  minutesLearned: number;
  lessonsCompleted: number;
  streakDays: number;
};

interface WeeklyProgressChartProps {
  weeks: WeeklyProgressPoint[];
  childNickname: string;
}

const CHART_WIDTH = 720;
const CHART_HEIGHT = 260;
const CHART_MARGIN = {
  top: 28,
  right: 20,
  bottom: 42,
  left: 44,
};

export function WeeklyProgressChart({ weeks, childNickname }: WeeklyProgressChartProps) {
  const normalizedWeeks = [...weeks]
    .sort((a, b) => new Date(a.weekStart).getTime() - new Date(b.weekStart).getTime())
    .slice(-6);

  if (normalizedWeeks.length === 0) {
    return null;
  }

  const chartInnerWidth = CHART_WIDTH - CHART_MARGIN.left - CHART_MARGIN.right;
  const chartInnerHeight = CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom;
  const barSlot = chartInnerWidth / normalizedWeeks.length;
  const barWidth = Math.min(58, Math.max(30, barSlot * 0.52));
  const maxMinutes = Math.max(1, ...normalizedWeeks.map((week) => week.minutesLearned));

  return (
    <section className="weekly-chart-container" aria-label={`Weekly progress chart of${childNickname}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-slate-900">Progress over the last 6 weeks - {childNickname}</h3>
        <p className="text-xs text-slate-500">Unit: study minutes/week</p>
      </div>

      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} width="100%" role="img" aria-label="Column chart of study minutes by week" className="mt-3">
        {[0, 1, 2, 3, 4].map((index) => {
          const y = CHART_MARGIN.top + (chartInnerHeight / 4) * index;
          const minutesLabel = Math.round(maxMinutes - (maxMinutes / 4) * index);
          return (
            <g key={`grid-${index}`}>
              <line
                x1={CHART_MARGIN.left}
                y1={y}
                x2={CHART_MARGIN.left + chartInnerWidth}
                y2={y}
                stroke="color-mix(in srgb, var(--color-primary, #0f766e) 20%, #cbd5e1)"
                strokeWidth="1"
                strokeDasharray={index === 4 ? "0" : "3 4"}
                opacity={index === 4 ? 0.7 : 0.4}
              />
              <text x={CHART_MARGIN.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--color-text-muted, #64748b)">
                {minutesLabel}
              </text>
            </g>
          );
        })}

        {normalizedWeeks.map((week, index) => {
          const ratio = maxMinutes > 0 ? week.minutesLearned / maxMinutes : 0;
          const barHeight = Math.max(0, Math.round(chartInnerHeight * ratio));
          const x = CHART_MARGIN.left + barSlot * index + (barSlot - barWidth) / 2;
          const y = CHART_MARGIN.top + (chartInnerHeight - barHeight);

          return (
            <g key={`${week.weekStart}-${index}`}>
              <rect
                className="chart-bar"
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={8}
                fill="var(--color-primary, #0f766e)"
                opacity={0.78}
              />
              <text x={x + barWidth / 2} y={Math.max(CHART_MARGIN.top + 12, y - 7)} textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f172a">
                {week.minutesLearned}
              </text>
              <text
                x={x + barWidth / 2}
                y={CHART_MARGIN.top + chartInnerHeight + 20}
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="var(--color-text-muted, #64748b)"
              >
                T{index + 1}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="chart-legend">
        {normalizedWeeks.map((week, index) => (
          <div key={`legend-${week.weekStart}-${index}`} className="chart-legend-item">
            <strong className="text-slate-700">T{index + 1}</strong>
            <span>
              🔥 {week.streakDays} days · 📚 {week.lessonsCompleted} posts
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

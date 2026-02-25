"use client";

/**
 * LearningTrajectoryChart - Parent view showing child's mastery trend over 8 weeks.
 * Uses inline SVG (no recharts dependency required).
 */

interface WeekPoint {
  weekStart: Date | string;
  overallMastery: number; // 0-1
  newSkillsMastered: number;
  reviewAccuracy: number; // 0-1
}

interface Props {
  weeks: WeekPoint[];
  childNickname?: string;
}

const SVG_WIDTH = 520;
const SVG_HEIGHT = 180;
const PAD_LEFT = 40;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 36;
const CHART_W = SVG_WIDTH - PAD_LEFT - PAD_RIGHT;
const CHART_H = SVG_HEIGHT - PAD_TOP - PAD_BOTTOM;

function formatWeekLabel(weekStart: Date | string): string {
  const d = new Date(weekStart);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function LearningTrajectoryChart({ weeks, childNickname }: Props) {
  if (weeks.length < 2) {
    return (
      <div className="text-center py-10 text-gray-500 text-sm">
        Chưa đủ dữ liệu — cần ít nhất 2 tuần để hiển thị xu hướng học tập.
      </div>
    );
  }

  const n = weeks.length;
  const stepX = CHART_W / (n - 1);

  const masteryPoints = weeks.map((w, i) => ({
    x: PAD_LEFT + i * stepX,
    y: PAD_TOP + CHART_H * (1 - w.overallMastery),
    mastery: w.overallMastery,
    label: formatWeekLabel(w.weekStart),
    newSkills: w.newSkillsMastered,
  }));

  const polyline = masteryPoints.map((p) => `${p.x},${p.y}`).join(" ");

  // Y-axis ticks: 0%, 25%, 50%, 75%, 100%
  const yTicks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full">
      {childNickname && (
        <p className="text-sm font-medium text-gray-600 mb-1">
          Tiến trình học tập — {childNickname}
        </p>
      )}
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full"
        aria-label="Biểu đồ tiến trình học tập"
      >
        {/* Grid lines */}
        {yTicks.map((t) => {
          const y = PAD_TOP + CHART_H * (1 - t);
          return (
            <g key={t}>
              <line
                x1={PAD_LEFT} y1={y} x2={PAD_LEFT + CHART_W} y2={y}
                stroke="#e5e7eb" strokeWidth="1"
              />
              <text x={PAD_LEFT - 4} y={y + 4} textAnchor="end" fontSize="10" fill="#9ca3af">
                {Math.round(t * 100)}%
              </text>
            </g>
          );
        })}

        {/* Mastery line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {masteryPoints.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x} cy={p.y} r={4}
              fill={p.mastery >= 0.7 ? "#22c55e" : p.mastery >= 0.4 ? "#f59e0b" : "#ef4444"}
              stroke="white" strokeWidth="1.5"
            />
            {/* Week label */}
            <text x={p.x} y={SVG_HEIGHT - 4} textAnchor="middle" fontSize="10" fill="#6b7280">
              {p.label}
            </text>
            {/* New skills badge */}
            {p.newSkills > 0 && (
              <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fill="#6366f1">
                +{p.newSkills}
              </text>
            )}
          </g>
        ))}
      </svg>
      <p className="text-xs text-gray-400 mt-1">
        Điểm xanh = thành thạo · Điểm vàng = đang học · Điểm đỏ = cần hỗ trợ · +N = kỹ năng mới thành thạo tuần đó
      </p>
    </div>
  );
}

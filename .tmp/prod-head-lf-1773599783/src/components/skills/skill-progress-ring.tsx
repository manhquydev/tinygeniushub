/**
 * SkillProgressRing - circular SVG progress indicator for mastery score.
 */

interface SkillProgressRingProps {
  score: number; // 0.0 - 1.0
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export function SkillProgressRing({ score, size = 80, strokeWidth = 7, label }: SkillProgressRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, score));
  const offset = circumference * (1 - progress);
  const pct = Math.round(progress * 100);

  // Color based on score
  const color = progress >= 0.9 ? "#a855f7" : progress >= 0.7 ? "#22c55e" : progress >= 0.4 ? "#eab308" : progress > 0 ? "#f97316" : "#e2e8f0";

  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-slate-800">{pct}%</span>
      </div>
      {label && <span className="text-xs text-slate-500 text-center">{label}</span>}
    </div>
  );
}

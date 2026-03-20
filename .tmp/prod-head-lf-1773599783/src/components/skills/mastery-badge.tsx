/**
 * MasteryBadge - displays a badge for each mastery level with color and label.
 */

import type { MasteryLevel } from "@prisma/client";

interface MasteryBadgeProps {
  level: MasteryLevel;
  showLabel?: boolean;
  size?: "sm" | "md";
}

const MASTERY_CONFIG: Record<MasteryLevel, { label: string; stars: number; colorClass: string; bgClass: string }> = {
  NOT_STARTED: { label: "Chưa bắt đầu", stars: 0, colorClass: "text-slate-400", bgClass: "bg-slate-100" },
  NOVICE:      { label: "Mới học",       stars: 1, colorClass: "text-orange-500", bgClass: "bg-orange-50" },
  DEVELOPING:  { label: "Đang học",      stars: 2, colorClass: "text-yellow-500", bgClass: "bg-yellow-50" },
  PROFICIENT:  { label: "Thành thạo",    stars: 4, colorClass: "text-green-500",  bgClass: "bg-green-50" },
  MASTERED:    { label: "Xuất sắc",      stars: 5, colorClass: "text-purple-500", bgClass: "bg-purple-50" },
};

export function MasteryBadge({ level, showLabel = false, size = "sm" }: MasteryBadgeProps) {
  const config = MASTERY_CONFIG[level];
  const starSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${config.bgClass} ${starSize}`}>
      <span className={config.colorClass}>
        {"★".repeat(config.stars)}{"☆".repeat(5 - config.stars)}
      </span>
      {showLabel && (
        <span className={`font-medium ${config.colorClass}`}>{config.label}</span>
      )}
    </span>
  );
}

export { MASTERY_CONFIG };

"use client";

import React from "react";
import { Flame } from "lucide-react";
import { abekaColors } from "../design-tokens";
import { ProgressBar } from "./progress-bar";

interface StreakDisplayProps {
  streak: number;
  longestStreak?: number;
  nextMilestone?: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function StreakDisplay({
  streak,
  longestStreak,
  nextMilestone = 10,
  size = "md",
  showLabel = true,
}: StreakDisplayProps) {
  const sizeClasses = {
    sm: { icon: 20, number: "text-xl", container: "px-3 py-1.5" },
    md: { icon: 28, number: "text-3xl", container: "px-4 py-2" },
    lg: { icon: 40, number: "text-5xl", container: "px-6 py-3" },
  };

  const progress = Math.min(100, (streak / nextMilestone) * 100);

  return (
    <div
      className={`inline-flex items-center gap-3 rounded-xl ${sizeClasses[size].container}`}
      style={{ backgroundColor: `${abekaColors.amberDiep}15` }}
    >
      <div className="relative">
        <Flame
          size={sizeClasses[size].icon}
          className="animate-pulse"
          style={{ color: abekaColors.amberDiep }}
        />
        <div
          className="absolute -inset-1 rounded-full blur opacity-30"
          style={{ backgroundColor: abekaColors.amberDiep }}
        />
      </div>
      <div>
        <div
          className={`font-extrabold ${sizeClasses[size].number}`}
          style={{
            background: `linear-gradient(135deg, ${abekaColors.amberDiep}, #f97316)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {streak}
        </div>
        {showLabel && (
          <div className="text-xs text-slate-500">
            ngày liên tiếp
            {longestStreak && (
              <span className="ml-1 text-slate-400">
                (kỷ lục: {longestStreak})
              </span>
            )}
          </div>
        )}
      </div>
      {nextMilestone > 0 && (
        <div className="w-20 ml-2">
          <ProgressBar
            value={streak}
            max={nextMilestone}
            size="sm"
            color={abekaColors.amberDiep}
          />
          <div className="text-[10px] text-slate-400 mt-0.5 text-center">
            Còn {nextMilestone - streak} ngày
          </div>
        </div>
      )}
    </div>
  );
}

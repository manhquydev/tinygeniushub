"use client";

import { useMemo, useState } from "react";

type GoalResponse = {
  ok: boolean;
  data?: {
    child?: {
      id: string;
      dailyGoalMinutes: number;
    };
  };
  error?: {
    message?: string;
  };
};

interface DailyGoalSetterProps {
  childId: string;
  totalMinutesToday: number;
  dailyGoalMinutes: number;
  onDailyGoalChange: (minutes: number) => void;
}

const QUICK_GOAL_OPTIONS = [15, 20, 30, 0] as const;

function getGoalLabel(minutes: number) {
  if (minutes === 0) {
    return "Không giới hạn";
  }

  return `${minutes} phút`;
}

export function DailyGoalSetter({
  childId,
  totalMinutesToday,
  dailyGoalMinutes,
  onDailyGoalChange,
}: DailyGoalSetterProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const progressPercent = useMemo(() => {
    if (dailyGoalMinutes <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((totalMinutesToday / dailyGoalMinutes) * 100));
  }, [dailyGoalMinutes, totalMinutesToday]);

  const goalReached = dailyGoalMinutes > 0 && totalMinutesToday >= dailyGoalMinutes;

  async function updateGoal(nextGoalMinutes: number) {
    if (pending || nextGoalMinutes === dailyGoalMinutes) {
      return;
    }

    const previousGoal = dailyGoalMinutes;
    setError(null);
    onDailyGoalChange(nextGoalMinutes);
    setPending(true);

    try {
      const response = await fetch(`/api/children/${encodeURIComponent(childId)}/goal`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dailyGoalMinutes: nextGoalMinutes,
        }),
      });

      const body = (await response.json()) as GoalResponse;
      if (!response.ok || !body.ok) {
        throw new Error(body.error?.message ?? "Không thể cập nhật mục tiêu");
      }

      const persistedGoal = body.data?.child?.dailyGoalMinutes;
      if (typeof persistedGoal === "number") {
        onDailyGoalChange(persistedGoal);
      }
    } catch (goalError) {
      onDailyGoalChange(previousGoal);
      setError(goalError instanceof Error ? goalError.message : "Lỗi không xác định");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mục tiêu học hôm nay</p>
        {goalReached ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
            🎉 Đã đạt mục tiêu hôm nay!
          </span>
        ) : null}
      </div>

      {dailyGoalMinutes > 0 ? (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>
              {totalMinutesToday}/{dailyGoalMinutes} phút
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <span
              className={`block h-full rounded-full transition-all ${goalReached ? "bg-gradient-to-r from-emerald-500 to-teal-500" : "bg-gradient-to-r from-sky-500 to-indigo-500"
                }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      ) : (
        <p className="mt-2 text-xs font-medium text-slate-600">Không giới hạn thời gian học trong ngày.</p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_GOAL_OPTIONS.map((option) => {
          const selected = option === dailyGoalMinutes;
          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                void updateGoal(option);
              }}
              disabled={pending}
              className={`inline-flex min-h-9 items-center justify-center rounded-full px-3 text-xs font-semibold transition ${selected
                ? "bg-teal-600 text-white shadow-[0_8px_18px_rgba(13,148,136,0.25)]"
                : "border border-slate-300 bg-white text-slate-700 hover:-translate-y-0.5"
                } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              {getGoalLabel(option)}
            </button>
          );
        })}
      </div>

      {error ? <p className="mt-2 text-xs font-medium text-rose-700">{error}</p> : null}
    </div>
  );
}

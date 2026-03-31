"use client";

import { useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface CohortData {
  cohortDate: string;
  cohortSize: number;
  retentionRates: Record<number, number>;
}

interface CohortHeatmapProps {
  period?: "daily" | "weekly" | "monthly";
}

const RETENTION_DAYS = [0, 1, 3, 7, 14, 30, 60, 90];

function getHeatmapColor(rate: number): string {
  // Color coding: green > 50%, red < 20%
  // Gradient: intensity based on retention rate
  if (rate >= 80) return "bg-green-600 text-white";
  if (rate >= 50) return "bg-green-500 text-white";
  if (rate >= 30) return "bg-yellow-400 text-black";
  if (rate >= 20) return "bg-orange-400 text-white";
  return "bg-red-600 text-white";
}

function formatCohortDate(dateStr: string, period: string): string {
  const date = new Date(dateStr);
  switch (period) {
    case "daily":
      return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    case "weekly":
      return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    case "monthly":
      return date.toLocaleDateString("vi-VN", { month: "short", year: "numeric" });
    default:
      return dateStr;
  }
}

export function CohortHeatmap({ period = "weekly" }: CohortHeatmapProps) {
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState(period);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics/cohorts?period=${currentPeriod}`);
      if (response.ok) {
        const result = await response.json();
        setCohorts(result.data.cohorts || []);
      }
    } catch (error) {
      console.error("Failed to fetch cohort data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPeriod]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--admin-text-secondary)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--admin-primary)] mr-3" />
        Đang tải heatmap...
      </div>
    );
  }

  if (cohorts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--admin-text-secondary)]">
        Chưa có dữ liệu cohort
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with period selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[var(--admin-text-primary)]">
          Phân tích Cohort
        </h3>
        <div className="flex gap-2">
          {(["daily", "weekly", "monthly"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setCurrentPeriod(p)}
              className={cn(
                "px-3 py-1 text-xs rounded-md transition-colors",
                currentPeriod === p
                  ? "bg-[var(--admin-primary)] text-white"
                  : "bg-[var(--admin-sidebar-accent)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)]"
              )}
            >
              {p === "daily" && "Ngày"}
              {p === "weekly" && "Tuần"}
              {p === "monthly" && "Tháng"}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Column headers - Retention days */}
          <div className="flex">
            {/* Empty corner cell */}
            <div className="w-28 flex-shrink-0 p-2 text-xs font-semibold text-[var(--admin-text-secondary)] border-b border-[var(--admin-card-border)]">
              Cohort / Ngày
            </div>
            {/* Day headers */}
            {RETENTION_DAYS.map((day) => (
              <div
                key={day}
                className="w-16 flex-shrink-0 p-2 text-center text-xs font-semibold text-[var(--admin-text-secondary)] border-b border-[var(--admin-card-border)]"
              >
                Day {day}
              </div>
            ))}
            {/* Cohort size column */}
            <div className="w-20 flex-shrink-0 p-2 text-center text-xs font-semibold text-[var(--admin-text-secondary)] border-b border-[var(--admin-card-border)]">
              Tổng
            </div>
          </div>

          {/* Cohort rows */}
          {cohorts.map((cohort) => (
            <div key={cohort.cohortDate} className="flex">
              {/* Cohort date label */}
              <div className="w-28 flex-shrink-0 p-2 text-sm font-medium text-[var(--admin-text-primary)] border-b border-[var(--admin-card-border)] flex items-center">
                {formatCohortDate(cohort.cohortDate, currentPeriod)}
              </div>
              {/* Retention rate cells */}
              {RETENTION_DAYS.map((day) => {
                const rate = cohort.retentionRates[day] || 0;
                return (
                  <div
                    key={day}
                    className={cn(
                      "w-16 flex-shrink-0 p-2 text-center text-xs font-semibold border-b border-[var(--admin-card-border)] transition-opacity hover:opacity-80 cursor-default",
                      getHeatmapColor(rate)
                    )}
                    title={`Day ${day}: ${rate.toFixed(1)}% (${Math.round(
                      (rate / 100) * cohort.cohortSize
                    )} users)`}
                  >
                    {rate.toFixed(0)}%
                  </div>
                );
              })}
              {/* Cohort size */}
              <div className="w-20 flex-shrink-0 p-2 text-center text-sm text-[var(--admin-text-secondary)] border-b border-[var(--admin-card-border)] flex items-center justify-center">
                {cohort.cohortSize}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-[var(--admin-text-secondary)] mt-4">
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-green-600" />
          <span>≥ 80% (Rất tốt)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-green-500" />
          <span>50-79% (Tốt)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-yellow-400" />
          <span>30-49% (Trung bình)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-orange-400" />
          <span>20-29% (Thấp)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-red-600" />
          <span>&lt; 20% (Cần cải thiện)</span>
        </div>
      </div>

      {/* Day 0 Note */}
      <p className="text-xs text-[var(--admin-text-secondary)] italic">
        * Ngày 0 luôn hiển thị 100% vì đây là ngày đăng ký của cohort.
      </p>
    </div>
  );
}

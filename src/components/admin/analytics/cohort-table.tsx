"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminDataTable } from "@/components/admin/ui/admin-data-table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CohortData {
  cohortDate: string;
  cohortSize: number;
  retentionRates: Record<number, number>;
}

interface CohortTableProps {
  period?: "daily" | "weekly" | "monthly";
}

const RETENTION_DAYS = [0, 1, 3, 7, 14, 30, 60, 90];

function getRetentionColor(rate: number): string {
  if (rate >= 50) return "text-green-600 font-semibold";
  if (rate <= 20) return "text-red-600 font-semibold";
  return "text-[var(--admin-text-primary)]";
}

function formatCohortDate(dateStr: string, period: string): string {
  const date = new Date(dateStr);
  switch (period) {
    case "daily":
      return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
    case "weekly":
      return `Week${date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" })}`;
    case "monthly":
      return date.toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" });
    default:
      return dateStr;
  }
}

export function CohortTable({ period = "weekly" }: CohortTableProps) {
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

  const handlePeriodChange = (newPeriod: "daily" | "weekly" | "monthly") => {
    setCurrentPeriod(newPeriod);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-[var(--admin-text-secondary)]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--admin-primary)] mr-2" />
        Loading cohorts data...
      </div>
    );
  }

  const columns = [
    { key: "cohortDate", label: "Cohort" },
    { key: "cohortSize", label: "User" },
    ...RETENTION_DAYS.map((day) => ({
      key: `day${day}`,
      label: `Day${day}`,
    })),
  ];

  const data = cohorts.map((cohort) => ({
    cohortDate: formatCohortDate(cohort.cohortDate, currentPeriod),
    cohortSize: cohort.cohortSize,
    ...RETENTION_DAYS.reduce(
      (acc, day) => ({
        ...acc,
        [`day${day}`]: cohort.retentionRates[day]?.toFixed(1) ?? "0.0",
      }),
      {}
    ),
  }));

  const renderCell = (row: Record<string, string | number>, key: string) => {
    if (key === "cohortDate" || key === "cohortSize") {
      return String(row[key]);
    }
    if (key.startsWith("day")) {
      const rate = parseFloat(String(row[key]));
      return <span className={cn(getRetentionColor(rate))}>{row[key]}%</span>;
    }
    return String(row[key]);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={currentPeriod === "daily" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePeriodChange("daily")}
        >
          By date
        </Button>
        <Button
          variant={currentPeriod === "weekly" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePeriodChange("weekly")}
        >
          By week
        </Button>
        <Button
          variant={currentPeriod === "monthly" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePeriodChange("monthly")}
        >
          By month
        </Button>
      </div>

      <AdminDataTable
        columns={columns.map((col) => ({
          ...col,
          render: (row: Record<string, string | number>) => renderCell(row, col.key),
        }))}
        data={data}
        emptyMessage="Cohort data are not available yet"
      />

      {/* Legend */}
      <div className="flex gap-4 text-xs text-[var(--admin-text-secondary)] mt-4">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-green-600" />
          <span>&gt; 50% retention</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-red-600" />
          <span>&lt; 20% retention</span>
        </div>
      </div>
    </div>
  );
}

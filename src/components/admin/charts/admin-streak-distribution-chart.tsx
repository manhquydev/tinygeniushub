"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { streakChartConfig } from "./admin-chart-theme";

type StreakDistribution = {
  zero: number;
  low: number;
  medium: number;
  high: number;
};

const STREAK_COLORS = {
  zero: "hsl(215 16% 63%)",
  low: "hsl(38 92% 50%)",
  medium: "hsl(199 89% 48%)",
  high: "hsl(152 60% 48%)",
};

export function AdminStreakDistributionChart({ data }: { data: StreakDistribution }) {
  const chartData = [
    { label: "0 ngày", key: "zero", value: data.zero },
    { label: "1-3 ngày", key: "low", value: data.low },
    { label: "4-7 ngày", key: "medium", value: data.medium },
    { label: "Trên 7 ngày", key: "high", value: data.high },
  ];

  return (
    <ChartContainer config={streakChartConfig} className="h-[220px] w-full">
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={32} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={STREAK_COLORS[entry.key as keyof typeof STREAK_COLORS]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

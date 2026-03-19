"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { userGrowthChartConfig } from "./admin-chart-theme";

type TimeSeriesPoint = { date: string; value: number };

function formatDateShort(value: string) {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}

export function AdminUserGrowthChart({ data }: { data: TimeSeriesPoint[] }) {
  const chartData = data.map((d) => ({ date: d.date, newUsers: d.value }));

  return (
    <ChartContainer config={userGrowthChartConfig} className="h-[240px] w-full">
      <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickFormatter={formatDateShort}
          tick={{ fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 11 }}
          width={32}
          allowDecimals={false}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => formatDateShort(label as string)}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="newUsers"
          stroke="var(--color-newUsers)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--color-newUsers)" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

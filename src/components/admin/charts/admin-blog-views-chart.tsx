"use client";

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { blogViewsChartConfig } from "./admin-chart-theme";

type ViewsByDayPoint = {
  readAt: string;
  _count: { id: number };
};

function formatDateShort(value: string) {
  const d = new Date(value);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function AdminBlogViewsChart({ data }: { data: ViewsByDayPoint[] }) {
  const chartData = data.map((d) => ({
    date: d.readAt,
    views: d._count.id,
  }));

  return (
    <ChartContainer config={blogViewsChartConfig} className="h-[220px] w-full">
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
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={32} allowDecimals={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(label) => formatDateShort(label as string)}
            />
          }
        />
        <Line
          type="monotone"
          dataKey="views"
          stroke="var(--color-views)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--color-views)" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}

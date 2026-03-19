"use client";

import React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { registrationChartConfig } from "./admin-chart-theme";

type TimeSeriesPoint = { date: string; value: number };

function formatDateShort(value: string) {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}

export function AdminRegistrationTrendChart({ data }: { data: TimeSeriesPoint[] }) {
  const id = React.useId();
  const gradientId = `regGradient-${id.replace(/:/g, "")}`;
  const chartData = data.map((d) => ({ date: d.date, registrations: d.value }));

  return (
    <ChartContainer config={registrationChartConfig} className="h-[240px] w-full">
      <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-registrations)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-registrations)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
        <Area
          type="monotone"
          dataKey="registrations"
          stroke="var(--color-registrations)"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

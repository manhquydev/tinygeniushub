"use client";

import React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { paymentChartConfig } from "./admin-chart-theme";

type RevenuePoint = { date: string; value: number };

function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
}

function formatDateShort(value: string) {
  const [, month, day] = value.split("-");
  return `${day}/${month}`;
}

export function AdminPaymentRevenueChart({ data }: { data: RevenuePoint[] }) {
  const id = React.useId();
  const gradientId = `payGradient-${id.replace(/:/g, "")}`;
  const chartData = data.map((d) => ({ date: d.date, revenue: d.value }));

  return (
    <ChartContainer config={paymentChartConfig} className="h-[240px] w-full">
      <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
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
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11 }}
          width={48}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => [formatVnd(value as number), "Doanh thu"]}
              labelFormatter={(label) => formatDateShort(label as string)}
            />
          }
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

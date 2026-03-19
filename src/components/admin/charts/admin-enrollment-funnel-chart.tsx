"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { enrollmentChartConfig } from "./admin-chart-theme";

type FunnelData = {
  parents: number;
  children: number;
  activeChildren7d: number;
  totalLessonsCompleted30d: number;
};

export function AdminEnrollmentFunnelChart({ data }: { data: FunnelData }) {
  const chartData = [
    { stage: "Phụ huynh", count: data.parents },
    { stage: "Học sinh", count: data.children },
    { stage: "Học 7 ngày", count: data.activeChildren7d },
    { stage: "Bài/30 ngày", count: data.totalLessonsCompleted30d },
  ];

  return (
    <ChartContainer config={enrollmentChartConfig} className="h-[220px] w-full">
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
        <YAxis dataKey="stage" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={80} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

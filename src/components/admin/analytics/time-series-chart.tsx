"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TimeSeriesData {
  date: string;
  revenue: number;
  users: number;
  completions: number;
  newCustomers?: number;
  churnedCustomers?: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
  metrics: ("revenue" | "users" | "completions" | "newCustomers" | "churnedCustomers")[];
}

export function TimeSeriesChart({ data, metrics }: TimeSeriesChartProps) {
  const colors = {
    revenue: "#10b981",
    users: "#3b82f6",
    completions: "#f59e0b",
    newCustomers: "#8b5cf6",
    churnedCustomers: "#ef4444",
  };

  const labels: Record<string, string> = {
    revenue: "Doanh thu (VND)",
    users: "Active users",
    completions: "Lesson completed",
    newCustomers: "New customer",
    churnedCustomers: "Customers leave",
  };

  const formatValue = (value: number, name: string): string => {
    if (name === "Doanh thu (VND)") {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(value);
    }
    return value.toLocaleString("vi-VN");
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          stroke="#6b7280"
          tickFormatter={(value) => value.toLocaleString("vi-VN")}
        />
        <Tooltip
          formatter={(value: number, name: string) => [formatValue(value, name), name]}
          labelFormatter={(label: string) => formatDate(label)}
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            fontSize: "12px",
          }}
        />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        {metrics.map((metric) => (
          <Line
            key={metric}
            type="monotone"
            dataKey={metric}
            stroke={colors[metric]}
            name={labels[metric]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

import type { ChartConfig } from "@/components/ui/chart";

export const revenueChartConfig: ChartConfig = {
  revenue: {
    label: "Doanh thu",
    color: "hsl(174 60% 40%)", // teal
  },
};

export const userGrowthChartConfig: ChartConfig = {
  newUsers: {
    label: "Người dùng mới",
    color: "hsl(199 89% 48%)", // sky
  },
};

export const streakChartConfig: ChartConfig = {
  zero: { label: "0 ngày", color: "hsl(215 16% 63%)" },
  low: { label: "1-3 ngày", color: "hsl(38 92% 50%)" },
  medium: { label: "4-7 ngày", color: "hsl(199 89% 48%)" },
  high: { label: "Trên 7 ngày", color: "hsl(152 60% 48%)" },
};

export const enrollmentChartConfig: ChartConfig = {
  count: {
    label: "Số lượng",
    color: "hsl(174 60% 40%)",
  },
};

export const blogViewsChartConfig: ChartConfig = {
  views: {
    label: "Lượt xem",
    color: "hsl(258 90% 66%)", // violet
  },
};

export const registrationChartConfig: ChartConfig = {
  registrations: {
    label: "Đăng ký mới",
    color: "hsl(199 89% 48%)",
  },
};

export const paymentChartConfig: ChartConfig = {
  revenue: {
    label: "Doanh thu",
    color: "hsl(152 60% 48%)", // emerald
  },
};

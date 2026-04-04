"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, TrendingDown, Users } from "lucide-react";
import { AdminStatCard } from "@/components/admin/ui/admin-stat-card";
import { AdminSectionCard } from "@/components/admin/ui/admin-section-card";
import { Progress } from "@/components/ui/progress";

interface RevenueData {
  mrr: number;
  arr: number;
  totalRevenue30d: number;
  totalRevenue7d: number;
  revenueByPlan: Record<string, number>;
  churnRate: number;
  churnRevenue30d: number;
  newMrr30d: number;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function RevenueDashboard() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/admin/analytics/revenue?type=metrics");
        if (!response.ok) {
          throw new Error("Failed to fetch revenue data");
        }
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--admin-text-secondary)]">Đang tải dữ liệu doanh thu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-rose-500">Lỗi: {error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[var(--admin-text-secondary)]">Không có dữ liệu doanh thu</div>
      </div>
    );
  }

  const netMrrChange = data.newMrr30d - data.churnRevenue30d;

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="Doanh thu định kỳ hàng tháng (MRR)"
          value={formatVND(data.mrr)}
          icon={<DollarSign size={16} />}
        />
        <AdminStatCard
          label="Doanh thu định kỳ hàng năm (ARR)"
          value={formatVND(data.arr)}
          icon={<TrendingUp size={16} />}
        />
        <AdminStatCard
          label="Doanh thu 30 ngày"
          value={formatVND(data.totalRevenue30d)}
          icon={<DollarSign size={16} />}
        />
        <AdminStatCard
          label="Tỷ lệ rời bỏ (Churn Rate)"
          value={`${data.churnRate}%`}
          icon={<TrendingDown size={16} />}
          trend={{
            value: data.churnRate,
            label: data.churnRate > 5 ? "Cao" : "Tốt",
          }}
        />
      </div>

      {/* Revenue by Plan */}
      <AdminSectionCard title="Doanh thu theo gói" icon={<Users size={16} />}>
        <div className="space-y-4">
          {Object.entries(data.revenueByPlan)
            .filter(([plan]) => plan !== "TRIAL")
            .map(([plan, revenue]) => (
              <div key={plan} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[var(--admin-text-primary)]">
                    {plan === "STANDARD" ? "Gói Tiêu chuẩn" : "Gói Gia đình Plus"}
                  </span>
                  <span className="text-[var(--admin-text-primary)] font-semibold">
                    {formatVND(revenue)}
                  </span>
                </div>
                <Progress
                  value={data.mrr > 0 ? (revenue / data.mrr) * 100 : 0}
                  className="h-2"
                />
                <p className="text-xs text-[var(--admin-text-muted)]">
                  {data.mrr > 0 ? ((revenue / data.mrr) * 100).toFixed(1) : 0}% tổng MRR
                </p>
              </div>
            ))}
          {Object.keys(data.revenueByPlan).filter(p => p !== "TRIAL").length === 0 && (
            <p className="text-sm text-[var(--admin-text-muted)] italic">
              Chưa có dữ liệu doanh thu theo gói
            </p>
          )}
        </div>
      </AdminSectionCard>

      {/* MRR Movement Cards */}
      <AdminSectionCard title="Biến động MRR (30 ngày)" icon={<TrendingUp size={16} />}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900">
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">MRR mới</p>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              +{formatVND(data.newMrr30d)}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
              Từ đăng ký mới
            </p>
          </div>

          <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-lg border border-rose-100 dark:border-rose-900">
            <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">MRR mất</p>
            <p className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-1">
              -{formatVND(data.churnRevenue30d)}
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
              Từ khách hàng rời bỏ
            </p>
          </div>

          <div className={`p-4 rounded-lg border ${
            netMrrChange >= 0
              ? "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900"
              : "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900"
          }`}>
            <p className={`text-sm font-medium ${
              netMrrChange >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-amber-600 dark:text-amber-400"
            }`}>
              Thay đổi MRR ròng
            </p>
            <p className={`text-xl font-bold mt-1 ${
              netMrrChange >= 0
                ? "text-blue-700 dark:text-blue-300"
                : "text-amber-700 dark:text-amber-300"
            }`}>
              {netMrrChange >= 0 ? "+" : ""}{formatVND(netMrrChange)}
            </p>
            <p className={`text-xs mt-1 ${
              netMrrChange >= 0
                ? "text-blue-600 dark:text-blue-400"
                : "text-amber-600 dark:text-amber-400"
            }`}>
              {netMrrChange >= 0 ? "Tăng trưởng" : "Giảm"} so với tháng trước
            </p>
          </div>
        </div>
      </AdminSectionCard>
    </div>
  );
}

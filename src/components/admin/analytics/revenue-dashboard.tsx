"use client";

import { useEffect, useState } from "react";
import { DollarSign, ShoppingCart, Users, BookOpen } from "lucide-react";
import { AdminStatCard } from "@/components/admin/ui/admin-stat-card";
import { AdminSectionCard } from "@/components/admin/ui/admin-section-card";

interface RevenueData {
  totalRevenue30d: number;
  totalRevenue7d: number;
  courseOrderCount30d: number;
  courseOrderCount7d: number;
  uniqueBuyers30d: number;
  successfulEnrollments30d: number;
  averageOrderValue30d: number;
  revenueByProduct: Record<"COURSE_SINGLE" | "COURSE_BUNDLE" | "COURSE_OTHER", number>;
  topCourses30d: Array<{
    courseId: string;
    courseSlug: string;
    title: string;
    enrollmentCount: number;
    revenueVnd: number;
  }>;
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AdminStatCard
          label="Doanh thu khóa học 30 ngày"
          value={formatVND(data.totalRevenue30d)}
          icon={<DollarSign size={16} />}
        />
        <AdminStatCard
          label="Doanh thu khóa học 7 ngày"
          value={formatVND(data.totalRevenue7d)}
          icon={<DollarSign size={16} />}
        />
        <AdminStatCard
          label="Số đơn khóa học 30 ngày"
          value={data.courseOrderCount30d}
          icon={<ShoppingCart size={16} />}
        />
        <AdminStatCard
          label="Giá trị đơn trung bình 30 ngày"
          value={formatVND(data.averageOrderValue30d)}
          icon={<DollarSign size={16} />}
        />
        <AdminStatCard
          label="Phụ huynh mua khóa (30 ngày)"
          value={data.uniqueBuyers30d}
          icon={<Users size={16} />}
        />
        <AdminStatCard
          label="Ghi danh thành công (30 ngày)"
          value={data.successfulEnrollments30d}
          icon={<BookOpen size={16} />}
        />
      </div>

      <AdminSectionCard title="Doanh thu theo loại đơn" icon={<ShoppingCart size={16} />}>
        <div className="space-y-4">
          {Object.entries(data.revenueByProduct)
            .filter(([, revenue]) => revenue > 0)
            .map(([product, revenue]) => (
              <div key={product} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[var(--admin-text-primary)]">
                    {product === "COURSE_SINGLE"
                      ? "Mua lẻ từng khóa"
                      : product === "COURSE_BUNDLE"
                        ? "Mua theo bộ khóa học"
                        : "Đơn hàng khác"}
                  </span>
                  <span className="text-[var(--admin-text-primary)] font-semibold">
                    {formatVND(revenue)}
                  </span>
                </div>
                <p className="text-xs text-[var(--admin-text-muted)]">
                  {data.totalRevenue30d > 0 ? ((revenue / data.totalRevenue30d) * 100).toFixed(1) : 0}% tổng doanh thu
                </p>
              </div>
            ))}
          {Object.values(data.revenueByProduct).every((revenue) => revenue <= 0) && (
            <p className="text-sm text-[var(--admin-text-muted)] italic">
              Chưa có dữ liệu doanh thu theo loại đơn
            </p>
          )}
        </div>
      </AdminSectionCard>

      <AdminSectionCard title="Top khóa học theo doanh thu (30 ngày)" icon={<BookOpen size={16} />}>
        <div className="space-y-3">
          {data.topCourses30d.map((course, index) => (
            <div
              key={course.courseId}
              className="flex items-center justify-between rounded-lg border border-[var(--admin-card-border)] px-3 py-2"
            >
              <div className="min-w-0 pr-3">
                <p className="text-sm font-semibold text-[var(--admin-text-primary)] truncate">
                  {index + 1}. {course.title}
                </p>
                <p className="text-xs text-[var(--admin-text-muted)] truncate">
                  {course.enrollmentCount} lượt ghi danh
                </p>
              </div>
              <p className="text-sm font-bold text-[var(--admin-text-primary)]">
                {formatVND(course.revenueVnd)}
              </p>
            </div>
          ))}
          {data.topCourses30d.length === 0 && (
            <p className="text-sm text-[var(--admin-text-muted)] italic">
              Chưa có dữ liệu khóa học phát sinh doanh thu
            </p>
          )}
          <div className="rounded-lg bg-[var(--admin-sidebar-accent)] p-3 text-xs text-[var(--admin-text-secondary)]">
            7 ngày gần nhất có {data.courseOrderCount7d} đơn khóa học.
          </div>
        </div>
      </AdminSectionCard>
    </div>
  );
}

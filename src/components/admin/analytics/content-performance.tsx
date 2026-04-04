"use client";

import { useEffect, useState } from "react";
import { BookOpen, Clock, Trophy, AlertCircle } from "lucide-react";
import { AdminStatCard } from "@/components/admin/ui/admin-stat-card";
import { AdminSectionCard } from "@/components/admin/ui/admin-section-card";
import { AdminDataTable } from "@/components/admin/ui/admin-data-table";

interface LessonPerformance {
  lessonId: string;
  title: string;
  totalCompletions: number;
  avgWatchTime: number;
  uniqueChildren: number;
}

interface ContentMetrics {
  totalLessons: number;
  totalTracks: number;
  totalCompletions30d: number;
  totalWatchTime30d: number;
  avgWatchTime: number;
  topPerformingLessons: LessonPerformance[];
}

export function ContentPerformance() {
  const [metrics, setMetrics] = useState<ContentMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/admin/analytics/content?type=overview");
        if (response.ok) {
          const result = await response.json();
          setMetrics(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch content analytics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const formatTime = (minutes: number): string => {
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;
    if (minutes < 60) return `${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const topLessonsData = metrics?.topPerformingLessons.map((lesson) => ({
    title: lesson.title,
    completions: lesson.totalCompletions.toLocaleString(),
    avgTime: formatTime(lesson.avgWatchTime),
    uniqueUsers: lesson.uniqueChildren,
  })) || [];

  if (loading) {
    return <div className="text-[var(--admin-text-secondary)]">Đang tải phân tích nội dung...</div>;
  }

  if (!metrics) {
    return <div className="text-[var(--admin-text-secondary)]">Không có dữ liệu nội dung</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="Tổng số bài học"
          value={metrics.totalLessons}
          icon={<BookOpen size={16} />}
        />
        <AdminStatCard
          label="Tổng số lộ trình"
          value={metrics.totalTracks}
          icon={<BookOpen size={16} />}
        />
        <AdminStatCard
          label="Hoàn thành (30 ngày)"
          value={metrics.totalCompletions30d.toLocaleString()}
          icon={<Trophy size={16} />}
        />
        <AdminStatCard
          label="Thời gian xem trung bình"
          value={formatTime(metrics.avgWatchTime)}
          icon={<Clock size={16} />}
        />
      </div>

      <AdminSectionCard title="Bài học hiệu quả nhất" icon={<Trophy size={16} />}>
        <AdminDataTable
          columns={[
            { key: "title", label: "Bài học" },
            { key: "completions", label: "Lượt hoàn thành" },
            { key: "avgTime", label: "Thời gian TB" },
            { key: "uniqueUsers", label: "Người dùng" },
          ]}
          data={topLessonsData}
          emptyMessage="Chưa có dữ liệu hoàn thành"
        />
      </AdminSectionCard>

      <AdminSectionCard title="Tổng quan tương tác nội dung" icon={<AlertCircle size={16} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[var(--admin-sidebar-accent)] rounded-lg">
            <p className="text-sm text-[var(--admin-text-secondary)]">Tổng thời gian xem (30 ngày)</p>
            <p className="text-xl font-bold text-[var(--admin-text-primary)]">
              {formatTime(metrics.totalWatchTime30d)}
            </p>
          </div>
          <div className="p-4 bg-[var(--admin-sidebar-accent)] rounded-lg">
            <p className="text-sm text-[var(--admin-text-secondary)]">Kích thước thư viện nội dung</p>
            <p className="text-xl font-bold text-[var(--admin-text-primary)]">
              {metrics.totalLessons} bài trong {metrics.totalTracks} lộ trình
            </p>
          </div>
        </div>
      </AdminSectionCard>
    </div>
  );
}

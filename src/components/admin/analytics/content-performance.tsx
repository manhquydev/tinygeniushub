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
    return <div className="text-[var(--admin-text-secondary)]">Loading content analysis...</div>;
  }

  if (!metrics) {
    return <div className="text-[var(--admin-text-secondary)]">No content data available</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="Total number of lessons"
          value={metrics.totalLessons}
          icon={<BookOpen size={16} />}
        />
        <AdminStatCard
          label="Total number of routes"
          value={metrics.totalTracks}
          icon={<BookOpen size={16} />}
        />
        <AdminStatCard
          label="Completed (30 days)"
          value={metrics.totalCompletions30d.toLocaleString()}
          icon={<Trophy size={16} />}
        />
        <AdminStatCard
          label="Average viewing time"
          value={formatTime(metrics.avgWatchTime)}
          icon={<Clock size={16} />}
        />
      </div>

      <AdminSectionCard title="The most effective lesson" icon={<Trophy size={16} />}>
        <AdminDataTable
          columns={[
            { key: "title", label: "Lesson" },
            { key: "completions", label: "Completed turn" },
            { key: "avgTime", label: "Average time" },
            { key: "uniqueUsers", label: "User" },
          ]}
          data={topLessonsData}
          emptyMessage="No completed data yet"
        />
      </AdminSectionCard>

      <AdminSectionCard title="Content interactive overview" icon={<AlertCircle size={16} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-[var(--admin-sidebar-accent)] rounded-lg">
            <p className="text-sm text-[var(--admin-text-secondary)]">Total watch time (30 days)</p>
            <p className="text-xl font-bold text-[var(--admin-text-primary)]">
              {formatTime(metrics.totalWatchTime30d)}
            </p>
          </div>
          <div className="p-4 bg-[var(--admin-sidebar-accent)] rounded-lg">
            <p className="text-sm text-[var(--admin-text-secondary)]">Content library size</p>
            <p className="text-xl font-bold text-[var(--admin-text-primary)]">
              {metrics.totalLessons} lessons in {metrics.totalTracks} tracks
            </p>
          </div>
        </div>
      </AdminSectionCard>
    </div>
  );
}

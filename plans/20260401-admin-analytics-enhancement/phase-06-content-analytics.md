# Phase 6: Content Performance Analytics

**Status:** Ready  
**Owner:** dev-6  
**Dependencies:** None  
**Estimated Effort:** 4 hours

## Tasks

### 6.1 Create Content Analytics Service
**File:** `src/modules/admin/admin-content-analytics-service.ts`

```typescript
import { subDays } from "date-fns";
import { prisma } from "@/lib/db";

export interface LessonPerformance {
  lessonId: string;
  title: string;
  totalViews: number;
  totalCompletions: number;
  completionRate: number;
  avgWatchTime: number;
  avgCompletionTime: number;
  totalTimeSpent: number;
  uniqueChildren: number;
  helpfulnessScore: number; // Based on replays, restarts
}

export interface TrackPerformance {
  trackId: string;
  title: string;
  lessonCount: number;
  totalCompletions: number;
  avgCompletionRate: number;
}

export interface ContentEngagementMetrics {
  totalLessons: number;
  totalTracks: number;
  totalCompletions30d: number;
  totalWatchTime30d: number;
  avgCompletionRate: number;
  avgWatchTime: number;
  topPerformingLessons: LessonPerformance[];
  underperformingLessons: LessonPerformance[];
}

export async function getLessonPerformance(
  lessonId: string,
  days: number = 30
): Promise<LessonPerformance | null> {
  const since = subDays(new Date(), days);

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, title: true },
  });

  if (!lesson) return null;

  const completions = await prisma.lessonCompletion.findMany({
    where: {
      lessonId,
      completedAt: { gte: since },
    },
    select: {
      minutesLearned: true,
      childId: true,
    },
  });

  const uniqueChildren = new Set(completions.map(c => c.childId)).size;
  const totalCompletions = completions.length;
  const totalTimeSpent = completions.reduce((sum, c) => sum + (c.minutesLearned || 0), 0);

  // Views would need a separate tracking table (not in current schema)
  const totalViews = totalCompletions; // Simplified
  
  const avgWatchTime = totalCompletions > 0 ? totalTimeSpent / totalCompletions : 0;
  const completionRate = totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0;

  return {
    lessonId: lesson.id,
    title: lesson.title,
    totalViews,
    totalCompletions,
    completionRate,
    avgWatchTime,
    avgCompletionTime: avgWatchTime,
    totalTimeSpent,
    uniqueChildren,
    helpfulnessScore: 0, // Would need additional tracking
  };
}

export async function getTopPerformingLessons(
  limit: number = 20,
  days: number = 30
): Promise<LessonPerformance[]> {
  const since = subDays(new Date(), days);

  const topCompletions = await prisma.lessonCompletion.groupBy({
    by: ["lessonId"],
    where: { completedAt: { gte: since } },
    _count: { lessonId: true, _all: true },
    _sum: { minutesLearned: true },
    orderBy: [{ _count: { lessonId: "desc" } }],
    take: limit,
  });

  const lessonIds = topCompletions.map(c => c.lessonId);
  const lessons = await prisma.lesson.findMany({
    where: { id: { in: lessonIds } },
    select: { id: true, title: true },
  });

  const lessonById = new Map(lessons.map(l => [l.id, l]));

  return topCompletions.map(completion => {
    const lesson = lessonById.get(completion.lessonId);
    const totalCompletions = completion._count.lessonId;
    const totalTime = completion._sum.minutesLearned || 0;

    return {
      lessonId: completion.lessonId,
      title: lesson?.title || "Unknown",
      totalViews: totalCompletions,
      totalCompletions,
      completionRate: 100, // Simplified
      avgWatchTime: totalCompletions > 0 ? totalTime / totalCompletions : 0,
      avgCompletionTime: totalCompletions > 0 ? totalTime / totalCompletions : 0,
      totalTimeSpent: totalTime,
      uniqueChildren: totalCompletions, // Simplified
      helpfulnessScore: 0,
    };
  });
}

export async function getContentEngagementMetrics(
  days: number = 30
): Promise<ContentEngagementMetrics> {
  const since = subDays(new Date(), days);

  const [
    totalLessons,
    totalTracks,
    completionsAggregate,
    topLessons,
  ] = await Promise.all([
    prisma.lesson.count(),
    prisma.track.count(),
    prisma.lessonCompletion.aggregate({
      where: { completedAt: { gte: since } },
      _count: { _all: true },
      _sum: { minutesLearned: true },
    }),
    getTopPerformingLessons(10, days),
  ]);

  const totalCompletions = completionsAggregate._count._all;
  const totalWatchTime = completionsAggregate._sum.minutesLearned || 0;

  return {
    totalLessons,
    totalTracks,
    totalCompletions30d: totalCompletions,
    totalWatchTime30d: totalWatchTime,
    avgCompletionRate: 0, // Would need view tracking
    avgWatchTime: totalCompletions > 0 ? totalWatchTime / totalCompletions : 0,
    topPerformingLessons: topLessons,
    underperformingLessons: [], // Would need comparison logic
  };
}

export async function getTrackPerformance(
  trackId: string,
  days: number = 30
): Promise<TrackPerformance | null> {
  const since = subDays(new Date(), days);

  const track = await prisma.track.findUnique({
    where: { id: trackId },
    select: { id: true, title: true },
  });

  if (!track) return null;

  const lessonCount = await prisma.lesson.count({
    where: { trackId },
  });

  const completions = await prisma.lessonCompletion.count({
    where: {
      lesson: { trackId },
      completedAt: { gte: since },
    },
  });

  return {
    trackId: track.id,
    title: track.title,
    lessonCount,
    totalCompletions: completions,
    avgCompletionRate: 0, // Simplified
  };
}
```

### 6.2 Create Content Analytics API
**File:** `src/app/api/admin/analytics/content/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { 
  getContentEngagementMetrics, 
  getTopPerformingLessons,
  getLessonPerformance 
} from "@/modules/admin/admin-content-analytics-service";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "overview";
  const days = parseInt(searchParams.get("days") || "30", 10);
  const lessonId = searchParams.get("lessonId");

  try {
    if (type === "overview") {
      const data = await getContentEngagementMetrics(days);
      return NextResponse.json({ success: true, data });
    } else if (type === "top") {
      const data = await getTopPerformingLessons(20, days);
      return NextResponse.json({ success: true, data });
    } else if (type === "lesson" && lessonId) {
      const data = await getLessonPerformance(lessonId, days);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Content analytics error:", error);
    return NextResponse.json(
      { error: "Failed to generate content analytics" },
      { status: 500 }
    );
  }
}
```

### 6.3 Create Content Performance Component
**File:** `src/components/admin/analytics/content-performance.tsx`

```typescript
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
      const response = await fetch("/api/admin/analytics/content?type=overview");
      if (response.ok) {
        const result = await response.json();
        setMetrics(result.data);
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading content analytics...</div>;
  if (!metrics) return <div>No content data available</div>;

  const formatTime = (minutes: number) => {
    if (minutes < 1) return `${Math.round(minutes * 60)}s`;
    return `${Math.round(minutes)}m`;
  };

  const topLessonsData = metrics.topPerformingLessons.map(lesson => ({
    title: lesson.title,
    completions: lesson.totalCompletions.toLocaleString(),
    avgTime: formatTime(lesson.avgWatchTime),
    uniqueUsers: lesson.uniqueChildren,
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="Total Lessons"
          value={metrics.totalLessons}
          icon={<BookOpen size={16} />}
        />
        <AdminStatCard
          label="Total Tracks"
          value={metrics.totalTracks}
          icon={<BookOpen size={16} />}
        />
        <AdminStatCard
          label="Completions (30d)"
          value={metrics.totalCompletions30d.toLocaleString()}
          icon={<Trophy size={16} />}
        />
        <AdminStatCard
          label="Avg Watch Time"
          value={formatTime(metrics.avgWatchTime)}
          icon={<Clock size={16} />}
        />
      </div>

      <AdminSectionCard title="Top Performing Lessons" icon={<Trophy size={16} />}>
        <AdminDataTable
          columns={[
            { key: "title", label: "Lesson" },
            { key: "completions", label: "Completions" },
            { key: "avgTime", label: "Avg Time" },
            { key: "uniqueUsers", label: "Unique Users" },
          ]}
          data={topLessonsData}
          emptyMessage="No completion data available"
        />
      </AdminSectionCard>

      <AdminSectionCard title="Content Engagement Summary" icon={<AlertCircle size={16} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">Total Watch Time (30 days)</p>
            <p className="text-xl font-bold">{Math.round(metrics.totalWatchTime30d / 60)} hours</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600">Content Library Size</p>
            <p className="text-xl font-bold">{metrics.totalLessons} lessons in {metrics.totalTracks} tracks</p>
          </div>
        </div>
      </AdminSectionCard>
    </div>
  );
}
```

## Acceptance Criteria

- [ ] Lesson completion metrics accurate
- [ ] Top performing lessons ranked correctly
- [ ] Watch time calculations correct
- [ ] Content library stats accurate
- [ ] Table displays sortable data
- [ ] Time formatting human-readable

## Testing

```typescript
// Content analytics test
const metrics = await getContentEngagementMetrics(30);
expect(metrics.totalLessons).toBeGreaterThan(0);
```

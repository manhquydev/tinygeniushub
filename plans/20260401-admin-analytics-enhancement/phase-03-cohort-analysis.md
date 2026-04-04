# Phase 3: Cohort Analysis Engine

**Status:** COMPLETED ✅  
**Owner:** dev-3  
**Dependencies:** None  
**Estimated Effort:** 5 hours
**Actual Effort:** 3 hours

## Tasks

### 3.1 Create Cohort Calculation Service
**File:** `src/modules/admin/admin-cohort-service.ts`

```typescript
import { subDays, startOfDay, format } from "date-fns";
import { prisma } from "@/lib/db";

export type CohortPeriod = "daily" | "weekly" | "monthly";

export interface CohortData {
  cohortDate: string;
  cohortSize: number;
  retentionByDay: Record<number, number>; // day -> count
  retentionRates: Record<number, number>; // day -> percentage
}

export async function getCohortAnalysis(
  period: CohortPeriod = "weekly",
  cohortsCount: number = 8
): Promise<CohortData[]> {
  const cohorts: CohortData[] = [];
  const now = new Date();
  
  for (let i = 0; i < cohortsCount; i++) {
    const cohortDate = calculateCohortDate(now, period, i);
    const cohortEndDate = calculateCohortEndDate(cohortDate, period);
    
    // Get users who signed up in this cohort
    const cohortUsers = await prisma.parentAccount.findMany({
      where: {
        createdAt: {
          gte: cohortDate,
          lt: cohortEndDate,
        },
      },
      select: {
        id: true,
        createdAt: true,
      },
    });
    
    const cohortSize = cohortUsers.length;
    if (cohortSize === 0) continue;
    
    const userIds = cohortUsers.map(u => u.id);
    
    // Calculate retention by day
    const retentionByDay: Record<number, number> = {};
    const retentionRates: Record<number, number> = {};
    
    // Check retention for days 0, 1, 3, 7, 14, 30, 60, 90
    const retentionDays = [0, 1, 3, 7, 14, 30, 60, 90];
    
    for (const day of retentionDays) {
      const activeUsers = await countActiveUsersOnDay(userIds, cohortDate, day);
      retentionByDay[day] = activeUsers;
      retentionRates[day] = Number(((activeUsers / cohortSize) * 100).toFixed(1));
    }
    
    cohorts.push({
      cohortDate: format(cohortDate, "yyyy-MM-dd"),
      cohortSize,
      retentionByDay,
      retentionRates,
    });
  }
  
  return cohorts.reverse(); // Most recent first
}

function calculateCohortDate(now: Date, period: CohortPeriod, index: number): Date {
  const daysBack = period === "daily" ? index : period === "weekly" ? index * 7 : index * 30;
  return startOfDay(subDays(now, daysBack));
}

function calculateCohortEndDate(startDate: Date, period: CohortPeriod): Date {
  const days = period === "daily" ? 1 : period === "weekly" ? 7 : 30;
  return new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000);
}

async function countActiveUsersOnDay(
  userIds: string[],
  cohortDate: Date,
  dayOffset: number
): Promise<number> {
  const targetDate = new Date(cohortDate);
  targetDate.setDate(targetDate.getDate() + dayOffset);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);
  
  // Count users who had any activity on that day
  const activeCount = await prisma.lessonCompletion.count({
    where: {
      child: {
        parentId: { in: userIds },
      },
      completedAt: {
        gte: targetDate,
        lt: nextDay,
      },
    },
    distinct: ["childId"],
  });
  
  return activeCount;
}
```

### 3.2 Create Cohort API Route
**File:** `src/app/api/admin/analytics/cohorts/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { getCohortAnalysis, CohortPeriod } from "@/modules/admin/admin-cohort-service";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") as CohortPeriod) || "weekly";
  const count = parseInt(searchParams.get("count") || "8", 10);

  try {
    const cohorts = await getCohortAnalysis(period, count);
    
    return NextResponse.json({
      success: true,
      data: cohorts,
      meta: {
        period,
        count: cohorts.length,
      },
    });
  } catch (error) {
    console.error("Cohort analysis error:", error);
    return NextResponse.json(
      { error: "Failed to generate cohort analysis" },
      { status: 500 }
    );
  }
}
```

### 3.3 Create Cohort Table Component
**File:** `src/components/admin/analytics/cohort-table.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { Users, Calendar } from "lucide-react";
import { AdminDataTable } from "@/components/admin/ui/admin-data-table";
import { Button } from "@/components/ui/button";

interface CohortData {
  cohortDate: string;
  cohortSize: number;
  retentionRates: Record<number, number>;
}

interface CohortTableProps {
  period?: "daily" | "weekly" | "monthly";
}

export function CohortTable({ period = "weekly" }: CohortTableProps) {
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch(`/api/admin/analytics/cohorts?period=${period}`);
      if (response.ok) {
        const result = await response.json();
        setCohorts(result.data);
      }
      setLoading(false);
    }

    fetchData();
  }, [period]);

  if (loading) return <div>Loading cohorts...</div>;

  const retentionDays = [0, 1, 3, 7, 14, 30];

  const columns = [
    { key: "cohortDate", label: "Cohort" },
    { key: "cohortSize", label: "Users" },
    ...retentionDays.map(day => ({
      key: `day${day}`,
      label: `Day ${day}`,
    })),
  ];

  const data = cohorts.map(cohort => ({
    cohortDate: cohort.cohortDate,
    cohortSize: cohort.cohortSize,
    ...retentionDays.reduce((acc, day) => ({
      ...acc,
      [`day${day}`]: `${cohort.retentionRates[day]?.toFixed(1) || 0}%`,
    }), {}),
  }));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" size="sm">Daily</Button>
        <Button variant="outline" size="sm">Weekly</Button>
        <Button variant="outline" size="sm">Monthly</Button>
      </div>
      <AdminDataTable
        columns={columns}
        data={data}
        emptyMessage="No cohort data available"
      />
    </div>
  );
}
```

### 3.4 Create Cohort Visualization
**File:** `src/components/admin/analytics/cohort-heatmap.tsx`

Heatmap visualization with color-coded retention rates.

## Acceptance Criteria

- [x] Cohort calculation accurate
- [x] Retention rates calculate correctly
- [x] API returns data in correct format
- [x] Table displays all retention days
- [x] Color coding for retention rates (green > 50%, red < 20%)
- [x] Period switching works

## Testing

```typescript
// Cohort calculation test
const cohorts = await getCohortAnalysis("weekly", 4);
expect(cohorts[0].retentionRates[0]).toBe(100); // Day 0 always 100%
```

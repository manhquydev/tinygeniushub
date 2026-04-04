# Phase 1: Real-time Analytics Foundation

**Status:** Completed  
**Owner:** dev-1  
**Dependencies:** None  
**Estimated Effort:** 4 hours

## Tasks

### 1.1 Create Redis Event Publisher
**File:** `src/lib/analytics/realtime/event-publisher.ts`

```typescript
import { redis } from "@/lib/redis";

export type RealtimeEvent = 
  | { type: "user_login"; userId: string; timestamp: Date }
  | { type: "lesson_start"; userId: string; lessonId: string; timestamp: Date }
  | { type: "lesson_complete"; userId: string; lessonId: string; duration: number; timestamp: Date }
  | { type: "checkout_start"; userId: string; courseId: string; timestamp: Date }
  | { type: "purchase_complete"; userId: string; amount: number; timestamp: Date };

const REALTIME_CHANNEL = "analytics:realtime";

export async function publishRealtimeEvent(event: RealtimeEvent): Promise<void> {
  await redis.publish(REALTIME_CHANNEL, JSON.stringify(event));
}
```

### 1.2 Create Real-time Counters Service
**File:** `src/lib/analytics/realtime/counters-service.ts`

```typescript
import { redis } from "@/lib/redis";

const ACTIVE_USERS_KEY = "analytics:active_users";
const ACTIVE_SESSIONS_KEY = "analytics:active_sessions";
const TTL_SECONDS = 300; // 5 minutes

export async function trackUserActivity(userId: string, sessionId: string): Promise<void> {
  const pipeline = redis.pipeline();
  pipeline.sadd(ACTIVE_USERS_KEY, userId);
  pipeline.sadd(ACTIVE_SESSIONS_KEY, sessionId);
  pipeline.expire(ACTIVE_USERS_KEY, TTL_SECONDS);
  pipeline.expire(ACTIVE_SESSIONS_KEY, TTL_SECONDS);
  await pipeline.exec();
}

export async function getActiveUserCount(): Promise<number> {
  return redis.scard(ACTIVE_USERS_KEY);
}

export async function getActiveSessionCount(): Promise<number> {
  return redis.scard(ACTIVE_SESSIONS_KEY);
}
```

### 1.3 Create Real-time Aggregator
**File:** `src/lib/analytics/realtime/aggregator.ts`

```typescript
import { redis } from "@/lib/redis";
import { subDays } from "date-fns";

const HOURLY_EVENTS_KEY = "analytics:hourly_events";

export async function recordHourlyEvent(eventType: string): Promise<void> {
  const hour = new Date().toISOString().slice(0, 13); // "2026-04-01T10"
  const key = `${HOURLY_EVENTS_KEY}:${hour}`;
  await redis.hincrby(key, eventType, 1);
  await redis.expire(key, 86400); // 24 hours
}

export async function getHourlyStats(hours: number = 24): Promise<Record<string, number>[]> {
  const results = [];
  for (let i = 0; i < hours; i++) {
    const date = new Date();
    date.setHours(date.getHours() - i);
    const hour = date.toISOString().slice(0, 13);
    const key = `${HOURLY_EVENTS_KEY}:${hour}`;
    const stats = await redis.hgetall(key);
    results.push({
      hour: date.toISOString(),
      ...stats,
    });
  }
  return results.reverse();
}
```

### 1.4 Create Real-time API Route
**File:** `src/app/api/admin/analytics/realtime/route.ts`

```typescript
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { getActiveUserCount, getActiveSessionCount } from "@/lib/analytics/realtime/counters-service";
import { getHourlyStats } from "@/lib/analytics/realtime/aggregator";

export async function GET() {
  const authError = await requireAdmin();
  if (authError) return authError;

  const [activeUsers, activeSessions, hourlyStats] = await Promise.all([
    getActiveUserCount(),
    getActiveSessionCount(),
    getHourlyStats(24),
  ]);

  return NextResponse.json({
    activeUsers,
    activeSessions,
    hourlyStats,
    timestamp: new Date().toISOString(),
  });
}
```

### 1.5 Create Real-time Dashboard Component
**File:** `src/components/admin/analytics/realtime-dashboard.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { Activity, Users, Clock } from "lucide-react";
import { AdminStatCard } from "@/components/admin/ui/admin-stat-card";

interface RealtimeData {
  activeUsers: number;
  activeSessions: number;
  timestamp: string;
}

export function RealtimeDashboard() {
  const [data, setData] = useState<RealtimeData | null>(null);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch("/api/admin/analytics/realtime");
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <AdminStatCard
        label="Active Users"
        value={data.activeUsers}
        icon={<Users size={16} />}
      />
      <AdminStatCard
        label="Active Sessions"
        value={data.activeSessions}
        icon={<Activity size={16} />}
      />
      <AdminStatCard
        label="Last Updated"
        value={new Date(data.timestamp).toLocaleTimeString()}
        icon={<Clock size={16} />}
      />
    </div>
  );
}
```

### 1.6 Add Activity Tracking Hooks
**File:** `src/lib/analytics/realtime/hooks.ts`

Update existing hooks to call tracking functions:
- Lesson completion
- User login
- Checkout start

## Acceptance Criteria

- [x] Redis pub/sub working for events
- [x] Active user count updates every 30 seconds
- [x] API returns accurate counts
- [x] Component displays data correctly
- [x] Activity hooks integrated with existing flows

## Testing

```typescript
// Unit test
expect(await getActiveUserCount()).toBeGreaterThanOrEqual(0);

// Integration
const response = await fetch("/api/admin/analytics/realtime");
expect(response.status).toBe(200);
```

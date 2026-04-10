import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { getActiveUserCount, getActiveSessionCount } from "@/lib/analytics/realtime/counters-service";
import { getHourlyStats } from "@/lib/analytics/realtime/aggregator";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
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

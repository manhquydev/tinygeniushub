import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import { getActiveUserCount, getActiveSessionCount } from "@/lib/analytics/realtime/counters-service";
import { getHourlyStats } from "@/lib/analytics/realtime/aggregator";
import { logWarn } from "@/lib/observability/logger";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
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
  } catch (error) {
    logWarn("admin.analytics.realtime.degraded", {
      message: error instanceof Error ? error.message : "unknown_error",
    });

    return NextResponse.json({
      activeUsers: 0,
      activeSessions: 0,
      hourlyStats: [],
      timestamp: new Date().toISOString(),
      degraded: true,
    });
  }
}

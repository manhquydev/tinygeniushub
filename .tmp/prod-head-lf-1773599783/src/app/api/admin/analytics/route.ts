import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getAdminAnalyticsSnapshot, parseAdminAnalyticsPeriod } from "@/modules/admin/service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const period = parseAdminAnalyticsPeriod(
      request.nextUrl.searchParams.get("period"),
    );
    const snapshot = await getAdminAnalyticsSnapshot(period);
    return ok(snapshot);
  } catch (error) {
    return handleRouteError(error);
  }
}


import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getRevenueMetrics, getRevenueTimeSeries } from "@/modules/admin/admin-revenue-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "metrics";
    const days = parseInt(searchParams.get("days") || "30", 10);

    if (type === "metrics") {
      const data = await getRevenueMetrics();
      return ok({ success: true, data });
    }

    if (type === "timeseries") {
      const data = await getRevenueTimeSeries(days);
      return ok({ success: true, data });
    }

    return handleRouteError(new Error("Invalid type parameter. Use 'metrics' or 'timeseries'"));
  } catch (error) {
    return handleRouteError(error);
  }
}

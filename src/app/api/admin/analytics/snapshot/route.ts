import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { getUnifiedAnalyticsSnapshot, getUnifiedTimeSeriesData } from "@/modules/admin/admin-unified-analytics-service";
import { handleRouteError } from "@/lib/route-error";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "snapshot";
    const days = parseInt(searchParams.get("days") || "30", 10);

    if (type === "snapshot") {
      const data = await getUnifiedAnalyticsSnapshot();
      return NextResponse.json({ success: true, data });
    }

    if (type === "timeseries") {
      const data = await getUnifiedTimeSeriesData(days);
      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json(
      { error: "Invalid type parameter. Use 'snapshot' or 'timeseries'" },
      { status: 400 }
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

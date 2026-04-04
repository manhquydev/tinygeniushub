import { type NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { getClarityDashboardData } from "@/lib/analytics/clarity/dashboard-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);

    const data = await getClarityDashboardData();

    if (!data) {
      return NextResponse.json(
        { error: "Clarity not configured" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

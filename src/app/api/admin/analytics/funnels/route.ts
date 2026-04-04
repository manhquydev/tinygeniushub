import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { getFunnelAnalytics, getAvailableFunnels } from "@/modules/admin/admin-funnel-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const funnel = searchParams.get("funnel") as "checkout" | "trial" | "referral" | null;
  const days = parseInt(searchParams.get("days") || "30", 10);

  try {
    await requireAdminFromRequest(request);

    if (!funnel) {
      // Return available funnels
      return NextResponse.json({
        success: true,
        data: getAvailableFunnels(),
      });
    }

    const data = await getFunnelAnalytics(funnel, days);
    
    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Funnel analytics error:", error);
    
    if (error instanceof Response || (error instanceof Error && error.message.includes("Unauthorized"))) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to generate funnel analytics" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin-guard";
import {
  getAlerts,
  getRules,
  saveRules,
  acknowledgeAlert,
} from "@/lib/analytics/alerts/storage-service";

export async function GET(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "alerts";

  try {
    if (type === "alerts") {
      const alerts = await getAlerts(50);
      return NextResponse.json({ success: true, data: alerts });
    } else if (type === "rules") {
      const rules = await getRules();
      return NextResponse.json({ success: true, data: rules });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Failed to fetch alerts:", error);
    return NextResponse.json(
      { error: "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    const body = await request.json();

    if (body.action === "acknowledge" && body.alertId) {
      await acknowledgeAlert(body.alertId);
      return NextResponse.json({ success: true });
    }

    if (body.rules) {
      await saveRules(body.rules);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Failed to update alerts:", error);
    return NextResponse.json(
      { error: "Failed to update alerts" },
      { status: 500 }
    );
  }
}

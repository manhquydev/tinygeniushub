import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getAdminSoTDashboardSnapshot } from "@/modules/admin/service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const snapshot = await getAdminSoTDashboardSnapshot();
    return ok(snapshot);
  } catch (error) {
    return handleRouteError(error);
  }
}

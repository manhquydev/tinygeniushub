import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getJulesMonitoringSnapshot } from "@/lib/jules/audit-store";

const ADMIN_ROLES = ["SUPER_ADMIN"];

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request, ADMIN_ROLES);

    const limitRaw = request.nextUrl.searchParams.get("limit");
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 100;
    const snapshot = await getJulesMonitoringSnapshot(Number.isFinite(limit) ? limit : 100);

    return ok(snapshot);
  } catch (error) {
    return handleRouteError(error);
  }
}


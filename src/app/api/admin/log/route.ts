import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { createAdminActionLog, getAdminActionLogs } from "@/modules/admin/service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);

    const limitRaw = request.nextUrl.searchParams.get("limit");
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;
    const logs = await getAdminActionLogs(Number.isFinite(limit) ? limit : 50);

    return ok({ logs });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminFromRequest(request);
    const body = (await request.json()) as {
      action?: string;
      target?: string;
      detail?: unknown;
    };

    const entry = await createAdminActionLog({
      adminEmail: admin.email,
      action: body.action ?? "",
      target: body.target,
      detail: body.detail,
    });

    return ok({ entry });
  } catch (error) {
    return handleRouteError(error);
  }
}

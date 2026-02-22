import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getAdminOverview } from "@/modules/admin/service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const overview = await getAdminOverview();
    return ok({ overview });
  } catch (error) {
    return handleRouteError(error);
  }
}

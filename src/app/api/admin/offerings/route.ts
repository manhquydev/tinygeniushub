import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { listAdminOfferings } from "@/modules/admin/admin-offering-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const offerings = await listAdminOfferings();
    return ok({ offerings });
  } catch (error) {
    return handleRouteError(error);
  }
}

import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { clearImpersonationCookie } from "@/lib/auth/impersonation";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { createAdminActionLog } from "@/modules/admin/service";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdminFromRequest(request);

    const response = ok({ redirectTo: "/admin" });
    clearImpersonationCookie(response);

    await createAdminActionLog({
      adminEmail: admin.email,
      action: "IMPERSONATE_STOP",
    });

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}

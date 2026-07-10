import type { NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/admin";
import { clearImpersonationCookie } from "@/lib/auth/impersonation";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { createAdminActionLog } from "@/modules/admin/service";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    const admin = await requireSuperAdmin(request);

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



import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { createAdminActionLog, toggleCoupon } from "@/modules/admin/service";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    const admin = await requireAdminFromRequest(request);
    const { id } = await context.params;
    const coupon = await toggleCoupon(id);
    await createAdminActionLog({
      adminEmail: admin.email,
      action: "TOGGLE_COUPON",
      target: coupon.code,
      detail: {
        active: coupon.active,
      },
    });
    return ok({ coupon });
  } catch (error) {
    return handleRouteError(error);
  }
}



import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import {
  updateAdminOfferingActive,
  updateAdminOfferingActiveSchema,
} from "@/modules/admin/admin-offering-service";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;

    await requireAdminFromRequest(request, ["SUPER_ADMIN"]);
    const { id } = await context.params;
    const body = updateAdminOfferingActiveSchema.parse(await request.json());
    const offering = await updateAdminOfferingActive({
      id,
      active: body.active,
    });

    return ok({ offering });
  } catch (error) {
    return handleRouteError(error);
  }
}

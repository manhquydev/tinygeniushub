import { z } from "zod";
import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { updateFeatureFlag } from "@/modules/admin/service";

type RouteParams = {
  params: Promise<{ key: string }>;
};

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    const admin = await requireAdminFromRequest(request, ["SUPER_ADMIN"]);
    const { key } = await context.params;
    const body = z.object({ enabled: z.boolean().optional() }).parse(await request.json());

    const featureFlag = await updateFeatureFlag({
      key,
      enabled: body.enabled ?? false,
      adminEmail: admin.email,
    });

    return ok({ featureFlag });
  } catch (error) {
    return handleRouteError(error);
  }
}




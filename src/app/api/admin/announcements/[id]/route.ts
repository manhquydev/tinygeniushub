import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { updateAnnouncementActive } from "@/modules/admin/service";
import { z } from "zod";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const updateAnnouncementSchema = z.object({
  active: z.boolean(),
});

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    await requireAdminFromRequest(request);
    const { id } = await context.params;
    const body = updateAnnouncementSchema.parse(await request.json());
    const announcement = await updateAnnouncementActive({
      id,
      active: body.active,
    });
    return ok({ announcement });
  } catch (error) {
    return handleRouteError(error);
  }
}



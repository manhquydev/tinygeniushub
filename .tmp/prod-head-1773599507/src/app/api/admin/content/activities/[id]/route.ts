import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { deleteActivity, updateActivity } from "@/modules/admin/content-service";
import { z } from "zod";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const updateActivitySchema = z.object({
  prompt: z.string().trim().min(1).max(500),
  spec: z.record(z.string(), z.unknown()),
  passCriteria: z.coerce.number().int().min(0).max(100),
});

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    await requireAdminFromRequest(request);
    const { id } = await context.params;
    const body = updateActivitySchema.parse(await request.json());

    const activity = await updateActivity(id, {
      prompt: body.prompt,
      spec: body.spec,
      passCriteria: body.passCriteria,
    });

    return ok({ activity });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    await requireAdminFromRequest(request);
    const { id } = await context.params;
    await deleteActivity(id);
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}



import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { toggleLessonTrial } from "@/modules/admin/content-service";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    await requireAdminFromRequest(request);
    const { id } = await context.params;
    const lesson = await toggleLessonTrial(id);
    return ok({ lesson });
  } catch (error) {
    return handleRouteError(error);
  }
}



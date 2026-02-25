import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { updateLessonTrialFlagAdmin } from "@/modules/admin/service";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) {
      return rateLimit;
    }
    const admin = await requireAdminFromRequest(request);

    const { lessonId } = await params;
    const input = await request.json();
    const lesson = await updateLessonTrialFlagAdmin({
      lessonId,
      actorId: admin.id,
      input,
    });

    return ok({ lesson });
  } catch (error) {
    return handleRouteError(error);
  }
}

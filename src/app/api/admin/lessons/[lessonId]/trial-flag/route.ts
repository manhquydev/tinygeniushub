import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { fail, ok } from "@/lib/http";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { updateLessonTrialFlagAdmin } from "@/modules/admin/service";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";

async function enforceAdminMutationRateLimit(request: NextRequest) {
  const ipPolicy = await getRateLimitPolicy("admin.mutation.ip");
  const ip = getRequestIp(request);
  const ipRateLimit = await enforceRateLimit({
    key: `admin:mutation:${ip}`,
    limit: ipPolicy.limit,
    windowMs: ipPolicy.windowMs,
    storeFailureMode: "deny",
  });
  if (!ipRateLimit.allowed) {
    return fail("Too many admin mutation requests. Please retry later.", 429, {
      retryAfterMs: ipRateLimit.retryAfterMs,
    });
  }

  return null;
}

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

import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { buildRateLimitIdentity, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { markLessonVideoWatchHeartbeat } from "@/modules/learning/video-watch-service";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";
import type { NextRequest } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const [ipPolicy, parentPolicy] = await Promise.all([
      getRateLimitPolicy("learning.watch.heartbeat.ip"),
      getRateLimitPolicy("learning.watch.heartbeat.parent"),
    ]);
    const ip = getRequestIp(request);
    const ipLimit = await enforceRateLimit({
      key: `learning:watch:heartbeat:ip:${ip}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!ipLimit.allowed) {
      return fail("Too many heartbeat requests. Please retry later.", 429, {
        retryAfterMs: ipLimit.retryAfterMs,
      });
    }

    const parentLimit = await enforceRateLimit({
      key: `learning:watch:heartbeat:parent:${buildRateLimitIdentity(parent.id)}`,
      limit: parentPolicy.limit,
      windowMs: parentPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!parentLimit.allowed) {
      return fail("Too many heartbeat requests. Please retry later.", 429, {
        retryAfterMs: parentLimit.retryAfterMs,
      });
    }

    const { lessonId } = await params;
    const payload = await request.json();
    const watch = await markLessonVideoWatchHeartbeat({
      parentId: parent.id,
      lessonId,
      payload,
    });

    return ok({ watch });
  } catch (error) {
    return handleRouteError(error);
  }
}

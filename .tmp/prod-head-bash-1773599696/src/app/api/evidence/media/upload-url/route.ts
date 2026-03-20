import type { NextRequest } from "next/server";
import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { buildRateLimitIdentity, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";
import { createEvidenceMediaUploadSession } from "@/modules/progress/evidence-media-service";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const [ipPolicy, parentPolicy] = await Promise.all([
      getRateLimitPolicy("evidence.uploadUrl.ip"),
      getRateLimitPolicy("evidence.uploadUrl.parent"),
    ]);
    const ip = getRequestIp(request);
    const ipLimit = await enforceRateLimit({
      key: `evidence:upload-url:ip:${ip}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!ipLimit.allowed) {
      return fail("Too many upload URL requests. Please retry later.", 429, {
        retryAfterMs: ipLimit.retryAfterMs,
      });
    }

    const parentLimit = await enforceRateLimit({
      key: `evidence:upload-url:parent:${buildRateLimitIdentity(parent.id)}`,
      limit: parentPolicy.limit,
      windowMs: parentPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!parentLimit.allowed) {
      return fail("Too many upload URL requests. Please retry later.", 429, {
        retryAfterMs: parentLimit.retryAfterMs,
      });
    }

    const input = await request.json();
    const session = await createEvidenceMediaUploadSession({
      parentId: parent.id,
      input,
    });

    return ok({ session });
  } catch (error) {
    return handleRouteError(error);
  }
}

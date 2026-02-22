import type { NextRequest } from "next/server";
import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { buildRateLimitIdentity, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";
import { claimReferralCodeForParent } from "@/modules/referral/service";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const [ipPolicy, parentPolicy] = await Promise.all([
      getRateLimitPolicy("referrals.claim.ip"),
      getRateLimitPolicy("referrals.claim.parent"),
    ]);
    const ip = getRequestIp(request);
    const ipLimit = await enforceRateLimit({
      key: `referrals:claim:ip:${ip}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!ipLimit.allowed) {
      return fail("Too many referral claim requests. Please retry later.", 429, {
        retryAfterMs: ipLimit.retryAfterMs,
      });
    }

    const parentLimit = await enforceRateLimit({
      key: `referrals:claim:parent:${buildRateLimitIdentity(parent.id)}`,
      limit: parentPolicy.limit,
      windowMs: parentPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!parentLimit.allowed) {
      return fail("Too many referral claim requests. Please retry later.", 429, {
        retryAfterMs: parentLimit.retryAfterMs,
      });
    }

    const input = await request.json();
    const result = await claimReferralCodeForParent(parent.id, input);

    return ok({ result });
  } catch (error) {
    return handleRouteError(error);
  }
}

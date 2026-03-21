import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { validateCoupon } from "@/modules/admin/service";
import { getParentFromRequest } from "@/lib/auth/session";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { buildRateLimitIdentity, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const ip = getRequestIp(request);
    const ipPolicy = await getRateLimitPolicy("coupon.validate.ip");
    const ipLimit = await enforceRateLimit({
      key: `coupon:validate:ip:${buildRateLimitIdentity(ip)}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!ipLimit.allowed) {
      return fail("Too many requests. Please retry later.", 429, {
        retryAfterMs: ipLimit.retryAfterMs,
      });
    }

    const body = (await request.json()) as {
      code?: string;
    };

    const result = await validateCoupon(body.code ?? "");
    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

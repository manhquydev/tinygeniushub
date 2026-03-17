import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { fail, ok } from "@/lib/http";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";

const COOKIE_NAME = "ccth_admin_session";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const ipPolicy = await getRateLimitPolicy("auth.logout.ip");
    const ip = getRequestIp(request);
    const rateLimit = await enforceRateLimit({
      key: `admin:auth:logout:ip:${ip}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!rateLimit.allowed) {
      return fail("Too many logout attempts. Please retry later.", 429, {
        retryAfterMs: rateLimit.retryAfterMs,
      });
    }

    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
    return ok({ message: "Signed out" });
  } catch (error) {
    return handleRouteError(error);
  }
}

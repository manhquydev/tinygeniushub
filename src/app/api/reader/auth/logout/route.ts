import type { NextRequest } from "next/server";
import { fail, ok } from "@/lib/http";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";
import {
  READER_SESSION_COOKIE_NAME,
  logoutReader,
} from "@/modules/reader/reader-auth-service";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const ipPolicy = await getRateLimitPolicy("auth.logout.ip");
    const ip = getRequestIp(request);
    const ipRateLimit = await enforceRateLimit({
      key: `reader:auth:logout:ip:${ip}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!ipRateLimit.allowed) {
      return fail("Too many logout attempts. Please retry later.", 429, {
        retryAfterMs: ipRateLimit.retryAfterMs,
      });
    }

    const token = request.cookies.get(READER_SESSION_COOKIE_NAME)?.value ?? null;
    await logoutReader(token);

    const response = ok({ signedOut: true });
    response.cookies.delete(READER_SESSION_COOKIE_NAME);
    return response;
  } catch (error) {
    return handleRouteError(error, {
      routeId: "reader.auth.logout",
    });
  }
}

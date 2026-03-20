import { appendSetCookieHeaders, normalizeBetterAuthError } from "@/lib/auth/better-auth-utils";
import { auth } from "@/lib/auth/better-auth";
import { fail, ok } from "@/lib/http";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { DomainError } from "@/modules/platform/errors";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";
import { NextResponse, type NextRequest } from "next/server";

function shouldRedirectAfterLogout(request: NextRequest) {
  const fetchMode = request.headers.get("sec-fetch-mode");
  const fetchDest = request.headers.get("sec-fetch-dest");
  if (fetchMode === "navigate" || fetchDest === "document") {
    return true;
  }

  if (!fetchMode && !fetchDest) {
    const accept = request.headers.get("accept") ?? "";
    return accept.includes("text/html");
  }

  return false;
}

export async function POST(request: NextRequest) {
  let clientIp = "unknown";

  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const ipPolicy = await getRateLimitPolicy("auth.logout.ip");
    clientIp = getRequestIp(request);
    const ipRateLimit = await enforceRateLimit({
      key: `auth:logout:${clientIp}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!ipRateLimit.allowed) {
      logWarn("auth.logout.rate_limited", {
        scope: "ip",
        ip: clientIp,
        reason: ipRateLimit.reason,
        retryAfterMs: ipRateLimit.retryAfterMs,
      });

      return fail("Too many logout attempts. Please retry later.", 429, {
        retryAfterMs: ipRateLimit.retryAfterMs,
      });
    }

    const signOut = await auth.api.signOut({
      headers: request.headers,
      returnHeaders: true,
      returnStatus: true,
    });

    const response = shouldRedirectAfterLogout(request)
      ? NextResponse.redirect(new URL("/", request.url), { status: 303 })
      : ok({ signedOut: true });
    appendSetCookieHeaders(response, signOut.headers);

    logInfo("auth.logout.succeeded", {
      ip: clientIp,
    });

    return response;
  } catch (error) {
    const normalizedError = normalizeBetterAuthError(error);
    if (normalizedError instanceof DomainError) {
      logWarn("auth.logout.failed", {
        ip: clientIp,
        code: normalizedError.code,
        status: normalizedError.status,
      });
    }

    return handleRouteError(normalizedError, {
      routeId: "auth.logout",
      ip: clientIp,
    });
  }
}

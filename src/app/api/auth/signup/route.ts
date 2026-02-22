import { appendSetCookieHeaders, normalizeBetterAuthError } from "@/lib/auth/better-auth-utils";
import { auth } from "@/lib/auth/better-auth";
import { fail, ok } from "@/lib/http";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { buildRateLimitIdentity, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { registerParent, signupSchema } from "@/modules/identity/service";
import { DomainError } from "@/modules/platform/errors";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";

export async function POST(request: Request) {
  let clientIp = "unknown";
  let emailIdentityHash: string | undefined;

  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    clientIp = getRequestIp(request);
    const [ipPolicy, emailPolicy] = await Promise.all([
      getRateLimitPolicy("auth.signup.ip"),
      getRateLimitPolicy("auth.signup.email"),
    ]);
    const ipRateLimit = await enforceRateLimit({
      key: `auth:signup:${clientIp}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });

    if (!ipRateLimit.allowed) {
      logWarn("auth.signup.rate_limited", {
        scope: "ip",
        ip: clientIp,
        reason: ipRateLimit.reason,
        retryAfterMs: ipRateLimit.retryAfterMs,
      });

      return fail("Too many signup attempts. Please retry later.", 429, {
        retryAfterMs: ipRateLimit.retryAfterMs,
      });
    }

    const input = signupSchema.parse(await request.json());
    const emailBucket = buildRateLimitIdentity(input.email);
    emailIdentityHash = emailBucket;
    const emailRateLimit = await enforceRateLimit({
      key: `auth:signup:email:${emailBucket}`,
      limit: emailPolicy.limit,
      windowMs: emailPolicy.windowMs,
      storeFailureMode: "deny",
    });

    if (!emailRateLimit.allowed) {
      logWarn("auth.signup.rate_limited", {
        scope: "email",
        ip: clientIp,
        identityHash: emailBucket,
        reason: emailRateLimit.reason,
        retryAfterMs: emailRateLimit.retryAfterMs,
      });

      return fail("Too many signup attempts. Please retry later.", 429, {
        retryAfterMs: emailRateLimit.retryAfterMs,
      });
    }

    const parent = await registerParent(input);

    const signIn = await auth.api.signInEmail({
      headers: request.headers,
      body: {
        email: input.email,
        password: input.password,
        rememberMe: true,
      },
      returnHeaders: true,
      returnStatus: true,
    });

    const response = ok({
      parent: {
        id: parent.id,
        email: parent.email,
        displayName: parent.displayName,
      },
    });

    appendSetCookieHeaders(response, signIn.headers);

    logInfo("auth.signup.succeeded", {
      parentId: parent.id,
      ip: clientIp,
    });

    return response;
  } catch (error) {
    const normalizedError = normalizeBetterAuthError(error);
    if (normalizedError instanceof DomainError) {
      logWarn("auth.signup.failed", {
        reason: normalizedError.code === "EMAIL_EXISTS" ? "email_exists" : "domain_error",
        ip: clientIp,
        identityHash: emailIdentityHash,
        code: normalizedError.code,
        status: normalizedError.status,
      });
    }

    return handleRouteError(normalizedError, {
      routeId: "auth.signup",
      ip: clientIp,
      identityHash: emailIdentityHash,
    });
  }
}

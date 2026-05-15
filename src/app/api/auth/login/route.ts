import { appendSetCookieHeaders, normalizeBetterAuthError } from "@/lib/auth/better-auth-utils";
import { auth } from "@/lib/auth/better-auth";
import { prisma } from "@/lib/db";
import { fail, ok } from "@/lib/http";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { buildRateLimitIdentity, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import {
  isParentEmailVerified,
  issueParentEmailVerificationChallenge,
} from "@/modules/identity/parent-email-verification-service";
import { authenticateParent, loginSchema } from "@/modules/identity/service";
import { DomainError } from "@/modules/platform/errors";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getAdminSecurityControls, getRateLimitPolicy } from "@/modules/platform/security-policy-service";

const LOGIN_FAILURE_MIN_DURATION_MS = 250;

function normalizeLoginError(error: unknown) {
  const normalized = normalizeBetterAuthError(error);
  if (
    normalized instanceof DomainError &&
    normalized.status === 401 &&
    normalized.code === "AUTH_API_ERROR"
  ) {
    // Keep one generic credential failure message to reduce account-enumeration signals.
    return new DomainError("Invalid credentials", 401, "AUTH_API_ERROR");
  }

  return normalized;
}

async function waitMinimumLoginFailureDuration(startedAtMs: number) {
  const elapsed = Date.now() - startedAtMs;
  const remaining = LOGIN_FAILURE_MIN_DURATION_MS - elapsed;
  if (remaining <= 0) {
    return;
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, remaining);
  });
}

export async function POST(request: Request) {
  const requestStartedAtMs = Date.now();
  let clientIp = "unknown";
  let emailIdentityHash: string | undefined;

  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    clientIp = getRequestIp(request);
    const [ipPolicy, emailPolicy] = await Promise.all([
      getRateLimitPolicy("auth.login.ip"),
      getRateLimitPolicy("auth.login.email"),
    ]);
    const ipRateLimit = await enforceRateLimit({
      key: `auth:login:${clientIp}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });

    if (!ipRateLimit.allowed) {
      logWarn("auth.login.rate_limited", {
        scope: "ip",
        ip: clientIp,
        reason: ipRateLimit.reason,
        retryAfterMs: ipRateLimit.retryAfterMs,
      });

      return fail("Too many login attempts. Please retry later.", 429, {
        retryAfterMs: ipRateLimit.retryAfterMs,
      });
    }

    const input = loginSchema.parse(await request.json());
    const emailBucket = buildRateLimitIdentity(input.email);
    emailIdentityHash = emailBucket;
    const emailRateLimit = await enforceRateLimit({
      key: `auth:login:email:${emailBucket}`,
      limit: emailPolicy.limit,
      windowMs: emailPolicy.windowMs,
      storeFailureMode: "deny",
    });

    if (!emailRateLimit.allowed) {
      logWarn("auth.login.rate_limited", {
        scope: "email",
        ip: clientIp,
        identityHash: emailBucket,
        reason: emailRateLimit.reason,
        retryAfterMs: emailRateLimit.retryAfterMs,
      });

      return fail("Too many login attempts. Please retry later.", 429, {
        retryAfterMs: emailRateLimit.retryAfterMs,
      });
    }

    const parent = await authenticateParent(input, {
      touchLastActiveAt: false,
    });
    const controls = await getAdminSecurityControls();
    if (controls.parentEmailVerificationRequired) {
      const verified = await isParentEmailVerified(parent.id);
      if (!verified) {
        try {
          await issueParentEmailVerificationChallenge({
            parent: {
              id: parent.id,
              email: parent.email,
              displayName: parent.displayName,
            },
            ttlMinutes: controls.parentEmailVerificationTokenTtlMinutes,
          });
        } catch (challengeError) {
          logWarn("auth.login.verification_email_enqueue_failed", {
            parentId: parent.id,
            ip: clientIp,
            message: challengeError instanceof Error ? challengeError.message : "unknown_error",
          });
          throw new DomainError(
            "The email has not been verified and the system has not yet sent the verification email back. Please try again later.",
            403,
            "EMAIL_NOT_VERIFIED_DELIVERY_FAILED",
          );
        }

        throw new DomainError(
          "Email has not been verified. We have sent you a verification email again, please check your inbox.",
          403,
          "EMAIL_NOT_VERIFIED",
        );
      }
    }

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

    const authUserId = (signIn.response as { user?: { id?: unknown } } | null)?.user?.id;
    if (typeof authUserId !== "string" || authUserId.length === 0) {
      logWarn("auth.login.failed", {
        reason: "invalid_credentials",
        ip: clientIp,
        identityHash: emailIdentityHash,
      });
      await waitMinimumLoginFailureDuration(requestStartedAtMs);
      return fail("Invalid credentials", 401);
    }

    if (authUserId !== parent.id) {
      logWarn("auth.login.failed", {
        reason: "invalid_credentials",
        ip: clientIp,
        identityHash: emailIdentityHash,
      });
      await waitMinimumLoginFailureDuration(requestStartedAtMs);
      return fail("Invalid credentials", 401);
    }

    await prisma.parentAccount.update({
      where: { id: parent.id },
      data: { lastActiveAt: new Date() },
    });

    const response = ok({
      parent: {
        id: parent.id,
        email: parent.email,
        displayName: parent.displayName,
      },
    });
    appendSetCookieHeaders(response, signIn.headers);

    logInfo("auth.login.succeeded", {
      parentId: parent.id,
      ip: clientIp,
    });

    return response;
  } catch (error) {
    const normalizedError = normalizeLoginError(error);
    if (normalizedError instanceof DomainError && normalizedError.status === 401) {
      logWarn("auth.login.failed", {
        reason: "invalid_credentials",
        ip: clientIp,
        identityHash: emailIdentityHash,
        code: normalizedError.code,
      });
      await waitMinimumLoginFailureDuration(requestStartedAtMs);
    } else if (
      normalizedError instanceof DomainError &&
      (normalizedError.code === "EMAIL_NOT_VERIFIED" ||
        normalizedError.code === "EMAIL_NOT_VERIFIED_DELIVERY_FAILED")
    ) {
      logWarn("auth.login.failed", {
        reason: "email_not_verified",
        ip: clientIp,
        identityHash: emailIdentityHash,
        code: normalizedError.code,
      });
    } else if (normalizedError instanceof DomainError) {
      logWarn("auth.login.failed", {
        reason: "domain_error",
        ip: clientIp,
        identityHash: emailIdentityHash,
        code: normalizedError.code,
        status: normalizedError.status,
      });
    }

    return handleRouteError(normalizedError, {
      routeId: "auth.login",
      ip: clientIp,
      identityHash: emailIdentityHash,
    });
  }
}

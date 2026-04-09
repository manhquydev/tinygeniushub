import { fail, ok } from "@/lib/http";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { buildRateLimitIdentity, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { issueParentEmailVerificationChallenge } from "@/modules/identity/parent-email-verification-service";
import { registerParent, signupSchema } from "@/modules/identity/service";
import { DomainError } from "@/modules/platform/errors";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getAdminSecurityControls, getRateLimitPolicy } from "@/modules/platform/security-policy-service";
import { enqueueLifecycleEmail } from "@/worker/queue";
import { LifecycleEmailType } from "@prisma/client";

function resolveAuditIp(clientIp: string) {
  return clientIp !== "unknown" ? clientIp : null;
}

function resolveUserAgent(request: Request) {
  const userAgent = request.headers.get("user-agent")?.trim();
  return userAgent && userAgent.length > 0 ? userAgent : "unknown";
}

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

    const parent = await registerParent(input, {
      ipAddress: resolveAuditIp(clientIp),
      userAgent: resolveUserAgent(request),
    });

    const controls = await getAdminSecurityControls();
    let verificationExpiresAt: Date | null = null;
    let verificationEmailDispatch: "queued" | "failed" | "not_required" = "not_required";

    if (controls.parentEmailVerificationRequired) {
      try {
        const challenge = await issueParentEmailVerificationChallenge({
          parent: {
            id: parent.id,
            email: parent.email,
            displayName: parent.displayName,
          },
          ttlMinutes: controls.parentEmailVerificationTokenTtlMinutes,
        });
        verificationExpiresAt = challenge.expiresAt;
        verificationEmailDispatch = "queued";
      } catch (verificationError) {
        verificationEmailDispatch = "failed";
        logWarn("auth.signup.verification_email_enqueue_failed", {
          parentId: parent.id,
          ip: clientIp,
          message: verificationError instanceof Error ? verificationError.message : "unknown_error",
        });
      }
    } else {
      // Fire-and-forget: queue D0 welcome email (errors are non-fatal)
      enqueueLifecycleEmail(parent.id, LifecycleEmailType.TRIAL_WELCOME).catch(() => {
        logWarn("auth.signup.lifecycle_email_enqueue_failed", { parentId: parent.id });
      });
    }

    const response = ok({
      parent: {
        id: parent.id,
        email: parent.email,
        displayName: parent.displayName,
      },
      verification: {
        required: controls.parentEmailVerificationRequired,
        emailDispatch: verificationEmailDispatch,
        expiresAt: verificationExpiresAt?.toISOString() ?? null,
      },
    });

    logInfo("auth.signup.succeeded", {
      parentId: parent.id,
      ip: clientIp,
      verificationRequired: controls.parentEmailVerificationRequired,
    });

    return response;
  } catch (error) {
    if (error instanceof DomainError) {
      logWarn("auth.signup.failed", {
        reason: error.code === "EMAIL_EXISTS" ? "email_exists" : "domain_error",
        ip: clientIp,
        identityHash: emailIdentityHash,
        code: error.code,
        status: error.status,
      });
    }

    return handleRouteError(error, {
      routeId: "auth.signup",
      ip: clientIp,
      identityHash: emailIdentityHash,
    });
  }
}

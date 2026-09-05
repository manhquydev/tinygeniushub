import { z } from "zod";
import { normalizeBetterAuthError } from "@/lib/auth/better-auth-utils";
import { auth } from "@/lib/auth/better-auth";
import { env } from "@/lib/env";
import { fail, ok } from "@/lib/http";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { buildRateLimitIdentity, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError, translateError } from "@/lib/route-error";
import {
  assertRouteSecurityPreconditions,
  enforceRouteRateLimitBuckets,
} from "@/lib/security/route-security-controls";
import { DomainError } from "@/modules/platform/errors";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  let clientIp = "unknown";
  let emailIdentityHash: string | undefined;

  try {
    await assertRouteSecurityPreconditions(request);
    const successMessage = await translateError("errors.passwordResetRequested");
    clientIp = getRequestIp(request);
    const ipRateLimitDenied = await enforceRouteRateLimitBuckets([
      {
        policyKey: "auth.forgot_password.ip",
        key: `auth:forgot_password:${clientIp}`,
        onDenied: (rateLimit) => {
          logWarn("auth.forgot_password.rate_limited", {
            scope: "ip",
            ip: clientIp,
            reason: rateLimit.reason,
            retryAfterMs: rateLimit.retryAfterMs,
          });
          return ok({ message: successMessage });
        },
      },
    ]);
    if (ipRateLimitDenied) {
      return ipRateLimitDenied;
    }

    const input = forgotPasswordSchema.parse(await request.json());
    emailIdentityHash = buildRateLimitIdentity(input.email);

    const emailRateLimitDenied = await enforceRouteRateLimitBuckets([
      {
        policyKey: "auth.forgot_password.email",
        key: `auth:forgot_password:email:${emailIdentityHash}`,
        onDenied: (rateLimit) => {
          logWarn("auth.forgot_password.rate_limited", {
            scope: "email",
            ip: clientIp,
            identityHash: emailIdentityHash,
            reason: rateLimit.reason,
            retryAfterMs: rateLimit.retryAfterMs,
          });
          return ok({ message: successMessage });
        },
      },
    ]);
    if (emailRateLimitDenied) {
      return emailRateLimitDenied;
    }

    await auth.api.requestPasswordReset({
      headers: request.headers,
      body: {
        email: input.email,
        redirectTo: new URL("/auth/reset-password", env.BETTER_AUTH_URL).toString(),
      },
    });

    logInfo("auth.forgot_password.requested", {
      ip: clientIp,
      identityHash: emailIdentityHash,
    });

    return ok({ message: successMessage });
  } catch (error) {
    const normalizedError = normalizeBetterAuthError(error);
    if (
      normalizedError instanceof DomainError &&
      normalizedError.code === "AUTH_API_ERROR" &&
      /reset password isn't enabled/i.test(normalizedError.message)
    ) {
      logWarn("auth.forgot_password.not_configured", {
        ip: clientIp,
        identityHash: emailIdentityHash,
      });

      return fail(await translateError("errors.passwordResetNotEnabled"), 503, {
        code: "PASSWORD_RESET_NOT_ENABLED",
      });
    }

    return handleRouteError(normalizedError, {
      routeId: "auth.forgot-password",
      ip: clientIp,
      identityHash: emailIdentityHash,
    });
  }
}

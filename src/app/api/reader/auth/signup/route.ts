import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { fail, ok } from "@/lib/http";
import { buildRateLimitIdentity, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";
import {
  READER_SESSION_COOKIE_NAME,
  READER_SESSION_MAX_AGE_SECONDS,
  signupReader,
} from "@/modules/reader/reader-auth-service";
import { z } from "zod";

const readerLegalConsentSchema = z.object({
  legalAccepted: z.literal(true),
});

function resolveAuditIp(clientIp: string) {
  return clientIp !== "unknown" ? clientIp : null;
}

function resolveUserAgent(request: Request) {
  const userAgent = request.headers.get("user-agent")?.trim();
  return userAgent && userAgent.length > 0 ? userAgent : "unknown";
}

function resolveEmailForRateLimit(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";
  const email = (payload as { email?: unknown }).email;
  return typeof email === "string" ? email : "";
}

export async function POST(request: NextRequest) {
  let clientIp = "unknown";
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    clientIp = getRequestIp(request);
    const [ipPolicy, emailPolicy] = await Promise.all([
      getRateLimitPolicy("auth.signup.ip"),
      getRateLimitPolicy("auth.signup.email"),
    ]);

    const ipRateLimit = await enforceRateLimit({
      key: `reader:auth:signup:ip:${clientIp}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!ipRateLimit.allowed) {
      return fail("Too many signup attempts. Please retry later.", 429, {
        retryAfterMs: ipRateLimit.retryAfterMs,
      });
    }

    const rawBody = await request.json();
    const emailRateLimit = await enforceRateLimit({
      key: `reader:auth:signup:email:${buildRateLimitIdentity(resolveEmailForRateLimit(rawBody))}`,
      limit: emailPolicy.limit,
      windowMs: emailPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!emailRateLimit.allowed) {
      return fail("Too many signup attempts. Please retry later.", 429, {
        retryAfterMs: emailRateLimit.retryAfterMs,
      });
    }

    const consentValidation = readerLegalConsentSchema.safeParse(rawBody);
    if (!consentValidation.success) {
      return fail("Invalid request payload", 400, {
        issues: consentValidation.error.issues,
      });
    }

    const result = await signupReader(rawBody, {
      ipAddress: resolveAuditIp(clientIp),
      userAgent: resolveUserAgent(request),
    });

    const response = ok({
      reader: result.reader,
    });
    response.cookies.set(READER_SESSION_COOKIE_NAME, result.sessionToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: READER_SESSION_MAX_AGE_SECONDS,
    });
    return response;
  } catch (error) {
    return handleRouteError(error, {
      routeId: "reader.auth.signup",
      ip: clientIp,
    });
  }
}

import { compare } from "bcryptjs";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { z } from "zod";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { fail, ok } from "@/lib/http";
import { logWarn } from "@/lib/observability/logger";
import { buildRateLimitIdentity, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(255),
});

const SESSION_DURATION_S = 60 * 60 * 8;
const COOKIE_NAME = "ccth_admin_session";
const LOGIN_FAILURE_MIN_DURATION_MS = 300;

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

export async function POST(request: NextRequest) {
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
      key: `admin:auth:login:ip:${clientIp}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!ipRateLimit.allowed) {
      return fail("Too many login attempts. Please retry later.", 429, {
        retryAfterMs: ipRateLimit.retryAfterMs,
      });
    }

    const body = loginSchema.parse(await request.json());
    emailIdentityHash = buildRateLimitIdentity(body.email);
    const emailRateLimit = await enforceRateLimit({
      key: `admin:auth:login:email:${emailIdentityHash}`,
      limit: emailPolicy.limit,
      windowMs: emailPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!emailRateLimit.allowed) {
      return fail("Too many login attempts. Please retry later.", 429, {
        retryAfterMs: emailRateLimit.retryAfterMs,
      });
    }

    const admin = await prisma.adminAccount.findUnique({
      where: { email: body.email },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        passwordHash: true,
      },
    });
    if (!admin || !admin.isActive) {
      await waitMinimumLoginFailureDuration(requestStartedAtMs);
      return fail("Invalid credentials", 401);
    }

    const valid = await compare(body.password, admin.passwordHash);
    if (!valid) {
      await waitMinimumLoginFailureDuration(requestStartedAtMs);
      return fail("Invalid credentials", 401);
    }

    await prisma.adminAccount.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const secret = new TextEncoder().encode(`${env.BETTER_AUTH_SECRET}_admin`);
    const token = await new SignJWT({
      sub: admin.id,
      email: admin.email,
      role: admin.role,
      displayName: admin.displayName,
      isActive: admin.isActive,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_DURATION_S}s`)
      .sign(secret);

    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_DURATION_S,
    });

    return ok({
      user: { id: admin.id, email: admin.email, displayName: admin.displayName, role: admin.role },
    });
  } catch (error) {
    logWarn("admin.auth.login.failed", {
      ip: clientIp,
      identityHash: emailIdentityHash,
      error: error instanceof Error ? error.message : "unknown",
    });

    return handleRouteError(error);
  }
}

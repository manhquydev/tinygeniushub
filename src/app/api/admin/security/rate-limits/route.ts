import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { fail, ok } from "@/lib/http";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import {
  getAdminSecuritySettings,
  getRateLimitPolicy,
  updateAdminRateLimitPolicies,
} from "@/modules/platform/security-policy-service";

async function enforceAdminMutationRateLimit(request: NextRequest) {
  const ipPolicy = await getRateLimitPolicy("admin.mutation.ip");
  const ip = getRequestIp(request);
  const ipRateLimit = await enforceRateLimit({
    key: `admin:mutation:${ip}`,
    limit: ipPolicy.limit,
    windowMs: ipPolicy.windowMs,
    storeFailureMode: "deny",
  });
  if (!ipRateLimit.allowed) {
    return fail("Too many admin mutation requests. Please retry later.", 429, {
      retryAfterMs: ipRateLimit.retryAfterMs,
    });
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    await assertRequestAllowedBySecurityControls(request);
    await requireAdminFromRequest(request);
    const settings = await getAdminSecuritySettings();
    return ok(settings);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) {
      return rateLimit;
    }
    const admin = await requireAdminFromRequest(request);
    const input = await request.json();
    const policies = await updateAdminRateLimitPolicies({
      actorId: admin.id,
      input,
    });

    return ok(policies);
  } catch (error) {
    return handleRouteError(error);
  }
}

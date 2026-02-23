import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { buildRateLimitIdentity, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";
import { createCaregiverInvite, listCaregiverInvites } from "@/modules/caregivers/service";
import type { NextRequest } from "next/server";

async function enforceCaregiverMutationRateLimit(request: NextRequest, parentId: string) {
  const [ipPolicy, parentPolicy] = await Promise.all([
    getRateLimitPolicy("children.mutation.ip"),
    getRateLimitPolicy("children.mutation.parent"),
  ]);
  const ip = getRequestIp(request);

  const ipLimit = await enforceRateLimit({
    key: `caregiver:mutation:ip:${ip}`,
    limit: ipPolicy.limit,
    windowMs: ipPolicy.windowMs,
    storeFailureMode: "deny",
  });
  if (!ipLimit.allowed) {
    return fail("Too many caregiver mutation requests. Please retry later.", 429, {
      retryAfterMs: ipLimit.retryAfterMs,
    });
  }

  const parentLimit = await enforceRateLimit({
    key: `caregiver:mutation:parent:${buildRateLimitIdentity(parentId)}`,
    limit: parentPolicy.limit,
    windowMs: parentPolicy.windowMs,
    storeFailureMode: "deny",
  });
  if (!parentLimit.allowed) {
    return fail("Too many caregiver mutation requests. Please retry later.", 429, {
      retryAfterMs: parentLimit.retryAfterMs,
    });
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const rateLimit = await enforceCaregiverMutationRateLimit(request, parent.id);
    if (rateLimit) {
      return rateLimit;
    }

    const input = await request.json();
    const created = await createCaregiverInvite(parent.id, input);
    const snapshot = await listCaregiverInvites(parent.id);

    return ok(
      {
        invite: created.invite,
        emailDelivery: created.emailDelivery,
        ...snapshot,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

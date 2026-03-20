import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { buildRateLimitIdentity, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";
import { deleteChildProfile, updateChildProfile } from "@/modules/progress/children-service";
import type { NextRequest } from "next/server";

async function enforceChildMutationRateLimit(request: NextRequest, parentId: string) {
  const [ipPolicy, parentPolicy] = await Promise.all([
    getRateLimitPolicy("children.mutation.ip"),
    getRateLimitPolicy("children.mutation.parent"),
  ]);
  const ip = getRequestIp(request);
  const ipLimit = await enforceRateLimit({
    key: `children:mutation:ip:${ip}`,
    limit: ipPolicy.limit,
    windowMs: ipPolicy.windowMs,
    storeFailureMode: "deny",
  });
  if (!ipLimit.allowed) {
    return fail("Too many child profile mutation requests. Please retry later.", 429, {
      retryAfterMs: ipLimit.retryAfterMs,
    });
  }

  const parentLimit = await enforceRateLimit({
    key: `children:mutation:parent:${buildRateLimitIdentity(parentId)}`,
    limit: parentPolicy.limit,
    windowMs: parentPolicy.windowMs,
    storeFailureMode: "deny",
  });
  if (!parentLimit.allowed) {
    return fail("Too many child profile mutation requests. Please retry later.", 429, {
      retryAfterMs: parentLimit.retryAfterMs,
    });
  }

  return null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }
    const rateLimit = await enforceChildMutationRateLimit(request, parent.id);
    if (rateLimit) {
      return rateLimit;
    }

    const { childId } = await params;
    const input = await request.json();
    const child = await updateChildProfile(parent.id, childId, input);

    return ok({ child });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }
    const rateLimit = await enforceChildMutationRateLimit(request, parent.id);
    if (rateLimit) {
      return rateLimit;
    }

    const { childId } = await params;
    const result = await deleteChildProfile(parent.id, childId);

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

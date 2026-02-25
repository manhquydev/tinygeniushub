import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import {
  getAdminSecuritySettings,
  updateAdminRateLimitPolicies,
} from "@/modules/platform/security-policy-service";

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

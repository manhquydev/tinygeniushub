import type { NextRequest } from "next/server";
import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { buildRateLimitIdentity, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import {
  assertRouteSecurityPreconditions,
  enforceRouteRateLimitBuckets,
} from "@/lib/security/route-security-controls";
import { createBillingCheckoutSession } from "@/modules/billing/checkout-service";

export async function POST(request: NextRequest) {
  try {
    await assertRouteSecurityPreconditions(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const ip = getRequestIp(request);
    const deniedResponse = await enforceRouteRateLimitBuckets([
      {
        policyKey: "billing.checkout.ip",
        key: `billing:checkout:ip:${ip}`,
        onDenied: (rateLimit) =>
          fail("Too many checkout requests. Please retry later.", 429, {
            retryAfterMs: rateLimit.retryAfterMs,
          }),
      },
      {
        policyKey: "billing.checkout.parent",
        key: `billing:checkout:parent:${buildRateLimitIdentity(parent.id)}`,
        onDenied: (rateLimit) =>
          fail("Too many checkout requests. Please retry later.", 429, {
            retryAfterMs: rateLimit.retryAfterMs,
          }),
      },
    ]);
    if (deniedResponse) {
      return deniedResponse;
    }

    const input = await request.json();
    const checkout = await createBillingCheckoutSession({
      parentId: parent.id,
      input,
    });

    return ok({ checkout });
  } catch (error) {
    return handleRouteError(error);
  }
}

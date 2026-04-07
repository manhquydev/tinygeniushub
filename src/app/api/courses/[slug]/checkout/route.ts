import type { NextRequest } from "next/server";
import { AB_COURSES_COOKIE, AB_PRICING_COOKIE, type AbVariant } from "@/lib/ab-test-constants";
import { ok, fail } from "@/lib/http";
import { buildRateLimitIdentity, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import {
  assertRouteSecurityPreconditions,
  enforceRouteRateLimitBuckets,
} from "@/lib/security/route-security-controls";
import { createCourseCheckoutSession } from "@/modules/courses/course-checkout-service";
import {
  PILOT_ATTRIBUTION_COOKIE,
  resolvePilotAttributionForCheckout,
} from "@/modules/courses/pilot-attribution";

function parseAbVariantCookie(value: string | null | undefined): AbVariant | null {
  return value === "A" || value === "B" ? value : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
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
        key: `courses:checkout:ip:${ip}`,
        onDenied: (rateLimit) =>
          fail("Too many checkout requests. Please retry later.", 429, {
            retryAfterMs: rateLimit.retryAfterMs,
          }),
      },
      {
        policyKey: "billing.checkout.parent",
        key: `courses:checkout:parent:${buildRateLimitIdentity(parent.id)}`,
        onDenied: (rateLimit) =>
          fail("Too many checkout requests. Please retry later.", 429, {
            retryAfterMs: rateLimit.retryAfterMs,
          }),
      },
    ]);
    if (deniedResponse) {
      return deniedResponse;
    }

    const { slug } = await params;
    const attribution = resolvePilotAttributionForCheckout({
      cookieValue: request.cookies.get(PILOT_ATTRIBUTION_COOKIE)?.value ?? null,
      referer: request.headers.get("referer"),
      pricingVariant: parseAbVariantCookie(request.cookies.get(AB_PRICING_COOKIE)?.value ?? null),
      coursesVariant: parseAbVariantCookie(request.cookies.get(AB_COURSES_COOKIE)?.value ?? null),
    });

    const result = await createCourseCheckoutSession({
      parentId: parent.id,
      parentEmail: parent.email,
      slug,
      attribution,
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

import type { NextRequest } from "next/server";
import { AB_COURSES_COOKIE, AB_PRICING_COOKIE, type AbVariant } from "@/lib/ab-test-constants";
import { ok, fail } from "@/lib/http";
import { buildRateLimitIdentity, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { createCourseCheckoutSession } from "@/modules/courses/course-checkout-service";
import {
  PILOT_ATTRIBUTION_COOKIE,
  resolvePilotAttributionForCheckout,
} from "@/modules/courses/pilot-attribution";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";

function parseAbVariantCookie(value: string | null | undefined): AbVariant | null {
  return value === "A" || value === "B" ? value : null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const [ipPolicy, parentPolicy] = await Promise.all([
      getRateLimitPolicy("billing.checkout.ip"),
      getRateLimitPolicy("billing.checkout.parent"),
    ]);
    const ip = getRequestIp(request);
    const ipLimit = await enforceRateLimit({
      key: `courses:checkout:ip:${ip}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!ipLimit.allowed) {
      return fail("Too many checkout requests. Please retry later.", 429, {
        retryAfterMs: ipLimit.retryAfterMs,
      });
    }

    const parentLimit = await enforceRateLimit({
      key: `courses:checkout:parent:${buildRateLimitIdentity(parent.id)}`,
      limit: parentPolicy.limit,
      windowMs: parentPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!parentLimit.allowed) {
      return fail("Too many checkout requests. Please retry later.", 429, {
        retryAfterMs: parentLimit.retryAfterMs,
      });
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

import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { enforceRateLimit, getRequestIp, buildRateLimitIdentity } from "@/lib/rate-limit";
import { redeemGiftCode } from "@/modules/courses/gift-code-service";

export async function POST(request: NextRequest) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const ip = getRequestIp(request);
    const rateLimitKey = `gift-code-redeem:${buildRateLimitIdentity(ip)}`;
    const rateLimit = await enforceRateLimit({
      key: rateLimitKey,
      limit: 5,
      windowMs: 1000 * 60 * 60, // 1 hour
    });

    if (!rateLimit.allowed) {
      return fail("Too many attempts. Please try again later.", 429, {
        retryAfterMs: rateLimit.retryAfterMs,
      });
    }

    const body = (await request.json()) as { code?: string };
    const code = body.code?.trim().toUpperCase();
    if (!code) {
      return fail("Gift code is required", 400);
    }

    await redeemGiftCode(code, parent.id);
    return ok({ redeemed: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

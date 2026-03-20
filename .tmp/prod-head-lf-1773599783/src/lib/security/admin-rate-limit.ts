import type { NextRequest } from "next/server";
import { fail } from "@/lib/http";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";

export async function enforceAdminMutationRateLimit(request: NextRequest) {
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

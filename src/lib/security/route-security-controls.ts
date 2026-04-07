import { enforceRateLimit, type RateLimitResult } from "@/lib/rate-limit";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";
import type { RateLimitPolicyKey } from "@/modules/platform/security-policy";

type RouteRateLimitBucket = {
  policyKey: RateLimitPolicyKey;
  key: string;
  storeFailureMode?: "fallback_in_memory" | "deny" | "allow";
  onDenied: (result: RateLimitResult) => Response;
};

export async function assertRouteSecurityPreconditions(request: Request) {
  assertTrustedOrigin(request);
  await assertRequestAllowedBySecurityControls(request);
}

export async function enforceRouteRateLimitBuckets(
  buckets: RouteRateLimitBucket[],
): Promise<Response | null> {
  if (buckets.length === 0) {
    return null;
  }

  const policies = await Promise.all(buckets.map((bucket) => getRateLimitPolicy(bucket.policyKey)));

  for (const [index, bucket] of buckets.entries()) {
    const policy = policies[index];
    const result = await enforceRateLimit({
      key: bucket.key,
      limit: policy.limit,
      windowMs: policy.windowMs,
      storeFailureMode: bucket.storeFailureMode ?? "deny",
    });

    if (!result.allowed) {
      return bucket.onDenied(result);
    }
  }

  return null;
}

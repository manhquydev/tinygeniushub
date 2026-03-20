import { createIpNetworkMatcher } from "@/lib/network/ip-network";
import { getRequestIp } from "@/lib/rate-limit";
import { DomainError } from "@/modules/platform/errors";
import { getAdminSecurityControls } from "@/modules/platform/security-policy-service";

type MatcherCacheEntry = {
  signature: string;
  matcher: ReturnType<typeof createIpNetworkMatcher>;
};

let blockedMatcherCache: MatcherCacheEntry | null = null;
let readinessMatcherCache: MatcherCacheEntry | null = null;

function getMatcher(entries: string[], cache: MatcherCacheEntry | null) {
  const signature = entries.join("|");
  if (cache && cache.signature === signature) {
    return {
      nextCache: cache,
      matcher: cache.matcher,
    };
  }

  const nextCache = {
    signature,
    matcher: createIpNetworkMatcher(entries),
  };

  return {
    nextCache,
    matcher: nextCache.matcher,
  };
}

export async function assertRequestAllowedBySecurityControls(
  request: Request,
  options?: {
    enforceReadinessAllowlist?: boolean;
  },
) {
  const controls = await getAdminSecurityControls();
  const ip = getRequestIp(request);
  if (ip === "unknown") {
    if (controls.blockedIpCidrs.length > 0) {
      throw new DomainError(
        "Cannot evaluate blocked IP policy without resolved source IP",
        403,
        "SECURITY_IP_UNRESOLVED",
      );
    }
    if (options?.enforceReadinessAllowlist && controls.readinessAllowlistCidrs.length > 0) {
      throw new DomainError(
        "Cannot enforce readiness allowlist without resolved source IP",
        403,
        "SECURITY_IP_UNRESOLVED",
      );
    }
    return;
  }

  if (controls.blockedIpCidrs.length > 0) {
    const { matcher, nextCache } = getMatcher(controls.blockedIpCidrs, blockedMatcherCache);
    blockedMatcherCache = nextCache;
    if (matcher.matches(ip)) {
      throw new DomainError("Request blocked by admin security policy", 403, "SECURITY_IP_BLOCKED");
    }
  }

  if (options?.enforceReadinessAllowlist && controls.readinessAllowlistCidrs.length > 0) {
    const { matcher, nextCache } = getMatcher(controls.readinessAllowlistCidrs, readinessMatcherCache);
    readinessMatcherCache = nextCache;
    if (!matcher.matches(ip)) {
      throw new DomainError("Readiness probe source is not allowlisted", 403, "SECURITY_READINESS_IP_DENIED");
    }
  }
}

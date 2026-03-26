import { ok, fail } from "@/lib/http";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { LEGAL_POLICY_VERSION } from "@/lib/legal/legal-policy-version";
import { createAuditLog } from "@/modules/platform/audit-service";
import { z } from "zod";

const consentSchema = z.object({
  version: z.string().min(1).max(50),
  necessary: z.literal(true),
  analytics: z.boolean(),
  marketing: z.boolean(),
  updatedAt: z.string().datetime(),
});

const cookieConsentAuditSchema = z.object({
  consent: consentSchema,
  source: z.enum(["necessary", "all"]).optional(),
});

function resolveAuditIp(clientIp: string) {
  return clientIp !== "unknown" ? clientIp : null;
}

function resolveUserAgent(request: Request) {
  const userAgent = request.headers.get("user-agent")?.trim();
  return userAgent && userAgent.length > 0 ? userAgent : "unknown";
}

function hashValue(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function resolveRateLimitKey(clientIp: string, userAgent: string) {
  if (clientIp !== "unknown") {
    return `legal:cookie-consent:ip:${clientIp}`;
  }
  return `legal:cookie-consent:ua:${hashValue(userAgent.toLowerCase())}`;
}

export async function POST(request: Request) {
  let clientIp = "unknown";

  try {
    assertTrustedOrigin(request);

    clientIp = getRequestIp(request);
    const userAgent = resolveUserAgent(request);
    const rateLimit = await enforceRateLimit({
      key: resolveRateLimitKey(clientIp, userAgent),
      limit: 60,
      windowMs: 60_000,
      storeFailureMode: "deny",
    });
    if (!rateLimit.allowed) {
      return fail("Too many requests. Please retry later.", 429, {
        retryAfterMs: rateLimit.retryAfterMs,
      });
    }

    const payload = cookieConsentAuditSchema.parse(await request.json());

    if (payload.consent.version !== LEGAL_POLICY_VERSION) {
      return fail("Stale legal policy version", 409, {
        currentVersion: LEGAL_POLICY_VERSION,
        receivedVersion: payload.consent.version,
      });
    }

    await createAuditLog({
      actorType: "visitor",
      action: "COOKIE_CONSENT_UPDATED",
      resourceType: "cookie_consent",
      metadata: {
        policyVersion: payload.consent.version,
        necessary: payload.consent.necessary,
        analytics: payload.consent.analytics,
        marketing: payload.consent.marketing,
        consentUpdatedAt: payload.consent.updatedAt,
        source: payload.source ?? "unknown",
        ipAddress: resolveAuditIp(clientIp),
        userAgent,
      },
    });

    return ok({ recorded: true });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "legal.cookie_consent",
      ip: clientIp,
    });
  }
}

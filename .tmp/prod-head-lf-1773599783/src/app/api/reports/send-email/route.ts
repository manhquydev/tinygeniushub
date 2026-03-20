import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { buildRateLimitIdentity, enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { DomainError } from "@/modules/platform/errors";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";
import { deliverQueuedWeeklyReportEmails } from "@/modules/reports/email-delivery-service";
import type { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  let clientIp = "unknown";
  let parentId: string | null = null;

  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      logWarn("reports.send_email.unauthorized", {
        ip: getRequestIp(request),
      });
      return fail("Unauthorized", 401);
    }
    parentId = parent.id;

    const [ipPolicy, parentPolicy] = await Promise.all([
      getRateLimitPolicy("reports.sendEmail.ip"),
      getRateLimitPolicy("reports.sendEmail.parent"),
    ]);
    clientIp = getRequestIp(request);
    const ipLimit = await enforceRateLimit({
      key: `reports:send-email:ip:${clientIp}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!ipLimit.allowed) {
      logWarn("reports.send_email.rate_limited", {
        scope: "ip",
        ip: clientIp,
        parentId: parent.id,
        reason: ipLimit.reason,
        retryAfterMs: ipLimit.retryAfterMs,
      });

      return fail("Too many email delivery requests. Please retry later.", 429, {
        retryAfterMs: ipLimit.retryAfterMs,
      });
    }

    const parentIdentityHash = buildRateLimitIdentity(parent.id);
    const parentLimit = await enforceRateLimit({
      key: `reports:send-email:parent:${parentIdentityHash}`,
      limit: parentPolicy.limit,
      windowMs: parentPolicy.windowMs,
      storeFailureMode: "deny",
    });
    if (!parentLimit.allowed) {
      logWarn("reports.send_email.rate_limited", {
        scope: "parent",
        ip: clientIp,
        parentId: parent.id,
        parentIdentityHash,
        reason: parentLimit.reason,
        retryAfterMs: parentLimit.retryAfterMs,
      });

      return fail("Too many email delivery requests. Please retry later.", 429, {
        retryAfterMs: parentLimit.retryAfterMs,
      });
    }

    const result = await deliverQueuedWeeklyReportEmails(100, parent.id);
    logInfo("reports.send_email.completed", {
      parentId: parent.id,
      ip: clientIp,
      provider: result.provider,
      queued: result.queued,
      sent: result.sent,
      skipped: result.skipped,
      bounced: result.bounced,
      claimedByOtherWorker: result.claimedByOtherWorker,
    });
    return ok({ result });
  } catch (error) {
    if (error instanceof DomainError) {
      logWarn("reports.send_email.failed", {
        parentId,
        ip: clientIp,
        code: error.code,
        status: error.status,
      });
    }

    return handleRouteError(error, {
      routeId: "reports.send_email",
      parentId,
      ip: clientIp,
    });
  }
}

import { fail, ok } from "@/lib/http";
import { env } from "@/lib/env";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import { processPayosCourseWebhook } from "@/modules/courses/course-payment-webhook-service";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";

export async function POST(request: Request) {
  let clientIp = "unknown";

  try {
    await assertRequestAllowedBySecurityControls(request);

    const ipPolicy = await getRateLimitPolicy("billing.webhook.payos.ip");
    clientIp = getRequestIp(request);
    const rateLimit = await enforceRateLimit({
      key: `billing:webhook:payos:${clientIp}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });

    if (!rateLimit.allowed) {
      logWarn("billing.webhook.payos.rate_limited", {
        ip: clientIp,
        reason: rateLimit.reason,
        retryAfterMs: rateLimit.retryAfterMs,
      });

      return fail("Too many webhook requests. Please retry later.", 429, {
        retryAfterMs: rateLimit.retryAfterMs,
      });
    }

    const contentLengthRaw = request.headers.get("content-length");
    if (contentLengthRaw) {
      const contentLength = Number.parseInt(contentLengthRaw, 10);
      if (Number.isFinite(contentLength) && contentLength > env.BILLING_WEBHOOK_MAX_BYTES) {
        logWarn("billing.webhook.payos.payload_too_large", {
          ip: clientIp,
          contentLength,
          maxBytes: env.BILLING_WEBHOOK_MAX_BYTES,
        });
        return fail("Webhook payload too large", 413);
      }
    }

    const payload = await request.json();
    const result = await processPayosCourseWebhook(payload);

    if (!result.accepted) {
      logWarn("billing.webhook.payos.invalid_signature", {
        ip: clientIp,
      });
      return fail(result.message, result.status);
    }

    const duplicate = "duplicate" in result ? result.duplicate : false;
    const paymentStatus = "paymentStatus" in result ? result.paymentStatus : null;

    logInfo("billing.webhook.payos.processed", {
      ip: clientIp,
      duplicate,
      paymentStatus,
    });

    return ok({
      duplicate,
      message: result.message,
      paymentStatus,
    });
  } catch (error) {
    return handleRouteError(error, {
      routeId: "billing.webhook.payos",
      ip: clientIp,
    });
  }
}


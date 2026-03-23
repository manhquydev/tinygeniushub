import { fail, ok } from "@/lib/http";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { env } from "@/lib/env";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import {
  isValidBillingSignature,
  processBillingWebhook,
} from "@/modules/billing/webhook-service";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";

export async function POST(request: Request) {
  if (env.NODE_ENV === "production" || env.BILLING_PROVIDER !== "mock_gateway") {
    return fail("Not found", 404);
  }

  let clientIp = "unknown";

  try {
    await assertRequestAllowedBySecurityControls(request);

    const ipPolicy = await getRateLimitPolicy("billing.webhook.mock.ip");
    clientIp = getRequestIp(request);
    const rateLimit = await enforceRateLimit({
      key: `billing:webhook:mock:${clientIp}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });

    if (!rateLimit.allowed) {
      logWarn("billing.webhook.mock.rate_limited", {
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
        logWarn("billing.webhook.mock.payload_too_large", {
          ip: clientIp,
          contentLength,
          maxBytes: env.BILLING_WEBHOOK_MAX_BYTES,
        });

        return fail("Webhook payload too large", 413);
      }
    }

    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > env.BILLING_WEBHOOK_MAX_BYTES) {
      logWarn("billing.webhook.mock.payload_too_large", {
        ip: clientIp,
        contentLength: Buffer.byteLength(rawBody, "utf8"),
        maxBytes: env.BILLING_WEBHOOK_MAX_BYTES,
      });

      return fail("Webhook payload too large", 413);
    }

    const signature = request.headers.get("x-provider-signature");
    if (!isValidBillingSignature(rawBody, signature)) {
      logWarn("billing.webhook.mock.invalid_signature", {
        ip: clientIp,
        signaturePresent: Boolean(signature),
      });
      return fail("Invalid webhook signature", 401);
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      logWarn("billing.webhook.mock.invalid_json", {
        ip: clientIp,
      });
      return fail("Invalid JSON payload", 400);
    }

    const result = await processBillingWebhook({
      payload: parsedBody as never,
    });

    logInfo("billing.webhook.mock.processed", {
      ip: clientIp,
      duplicate: result.duplicate ?? false,
      paymentStatus: result.paymentStatus ?? null,
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error, {
      routeId: "billing.webhook.mock",
      ip: clientIp,
    });
  }
}

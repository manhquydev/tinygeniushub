import { fail, ok } from "@/lib/http";
import { env } from "@/lib/env";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { handleRouteError } from "@/lib/route-error";
import {
  isValidStripeWebhookSignature,
  mapStripeEventToBillingWebhookPayload,
} from "@/modules/billing/stripe-webhook-service";
import { processBillingWebhook } from "@/modules/billing/webhook-service";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";

export async function POST(request: Request) {
  let clientIp = "unknown";

  try {
    await assertRequestAllowedBySecurityControls(request);

    const ipPolicy = await getRateLimitPolicy("billing.webhook.stripe.ip");
    clientIp = getRequestIp(request);
    const rateLimit = await enforceRateLimit({
      key: `billing:webhook:stripe:${clientIp}`,
      limit: ipPolicy.limit,
      windowMs: ipPolicy.windowMs,
      storeFailureMode: "deny",
    });

    if (!rateLimit.allowed) {
      logWarn("billing.webhook.stripe.rate_limited", {
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
        logWarn("billing.webhook.stripe.payload_too_large", {
          ip: clientIp,
          contentLength,
          maxBytes: env.BILLING_WEBHOOK_MAX_BYTES,
        });
        return fail("Webhook payload too large", 413);
      }
    }

    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > env.BILLING_WEBHOOK_MAX_BYTES) {
      logWarn("billing.webhook.stripe.payload_too_large", {
        ip: clientIp,
        contentLength: Buffer.byteLength(rawBody, "utf8"),
        maxBytes: env.BILLING_WEBHOOK_MAX_BYTES,
      });
      return fail("Webhook payload too large", 413);
    }

    const signatureHeader = request.headers.get("stripe-signature");
    const signatureValid = isValidStripeWebhookSignature({
      rawBody,
      signatureHeader,
    });
    if (!signatureValid) {
      logWarn("billing.webhook.stripe.invalid_signature", {
        ip: clientIp,
        signaturePresent: Boolean(signatureHeader),
      });
      return fail("Invalid webhook signature", 401);
    }

    let stripeEvent: unknown;
    try {
      stripeEvent = JSON.parse(rawBody);
    } catch {
      logWarn("billing.webhook.stripe.invalid_json", {
        ip: clientIp,
      });
      return fail("Invalid JSON payload", 400);
    }

    const mappedPayload = mapStripeEventToBillingWebhookPayload(stripeEvent);
    if (!mappedPayload) {
      logInfo("billing.webhook.stripe.ignored", {
        ip: clientIp,
        reason: "unsupported_event_type",
      });
      return ok({
        duplicate: false,
        ignored: true,
        message: "Unsupported stripe event type",
      });
    }

    const result = await processBillingWebhook({
      payload: mappedPayload,
    });

    logInfo("billing.webhook.stripe.processed", {
      ip: clientIp,
      duplicate: result.duplicate ?? false,
      paymentStatus: result.paymentStatus ?? null,
      eventId: mappedPayload.eventId,
      transactionId: mappedPayload.transactionId,
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error, {
      routeId: "billing.webhook.stripe",
      ip: clientIp,
    });
  }
}


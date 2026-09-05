import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  enforceRateLimitMock,
  getRequestIpMock,
  isValidStripeWebhookSignatureMock,
  mapStripeEventToBillingWebhookPayloadMock,
  processBillingWebhookMock,
  logInfoMock,
  logWarnMock,
  logErrorMock,
} = vi.hoisted(() => ({
  enforceRateLimitMock: vi.fn(),
  getRequestIpMock: vi.fn(),
  isValidStripeWebhookSignatureMock: vi.fn(),
  mapStripeEventToBillingWebhookPayloadMock: vi.fn(),
  processBillingWebhookMock: vi.fn(),
  logInfoMock: vi.fn(),
  logWarnMock: vi.fn(),
  logErrorMock: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
  getRequestIp: getRequestIpMock,
}));

vi.mock("@/modules/billing/stripe-webhook-service", () => ({
  isValidStripeWebhookSignature: isValidStripeWebhookSignatureMock,
  mapStripeEventToBillingWebhookPayload: mapStripeEventToBillingWebhookPayloadMock,
}));

vi.mock("@/modules/billing/webhook-service", () => ({
  processBillingWebhook: processBillingWebhookMock,
}));

vi.mock("@/lib/observability/logger", () => ({
  logInfo: logInfoMock,
  logWarn: logWarnMock,
  logError: logErrorMock,
}));

import { POST } from "@/app/api/billing/webhooks/stripe/route";

describe("billing stripe webhook route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enforceRateLimitMock.mockResolvedValue({
      allowed: true,
      remaining: 99,
      retryAfterMs: 0,
    });
    getRequestIpMock.mockReturnValue("203.0.113.11");
    isValidStripeWebhookSignatureMock.mockReturnValue(true);
    mapStripeEventToBillingWebhookPayloadMock.mockReturnValue({
      provider: "stripe",
      eventId: "evt_123",
      eventType: "payment_succeeded",
      transactionId: "pi_123",
      parentEmail: "parent@example.com",
      amountVnd: 120000,
      planCode: "YEARLY_STANDARD",
      occurredAt: new Date("2026-02-21T00:00:00.000Z"),
      raw: {},
    });
    processBillingWebhookMock.mockResolvedValue({
      duplicate: false,
      message: "Webhook processed",
      paymentStatus: "SUCCEEDED",
    });
  });

  it("returns 429 and logs when rate limit is exceeded", async () => {
    enforceRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterMs: 15_000,
      reason: "quota_exceeded",
    });

    const response = await POST(
      new Request("http://localhost/api/billing/webhooks/stripe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": "t=1,v1=abc",
        },
        body: JSON.stringify({ id: "evt_429" }),
      }),
    );

    expect(response.status).toBe(429);
    expect(logWarnMock).toHaveBeenCalledWith(
      "billing.webhook.stripe.rate_limited",
      expect.objectContaining({
        ip: "203.0.113.11",
        retryAfterMs: 15_000,
      }),
    );
  });

  it("returns 401 when stripe signature is invalid", async () => {
    isValidStripeWebhookSignatureMock.mockReturnValueOnce(false);

    const response = await POST(
      new Request("http://localhost/api/billing/webhooks/stripe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": "invalid",
        },
        body: JSON.stringify({ id: "evt_invalid_sig" }),
      }),
    );

    expect(response.status).toBe(401);
    expect(mapStripeEventToBillingWebhookPayloadMock).not.toHaveBeenCalled();
    expect(processBillingWebhookMock).not.toHaveBeenCalled();
    expect(logWarnMock).toHaveBeenCalledWith(
      "billing.webhook.stripe.invalid_signature",
      expect.objectContaining({
        ip: "203.0.113.11",
        signaturePresent: true,
      }),
    );
  });

  it("returns 413 when content-length exceeds webhook max bytes", async () => {
    const response = await POST(
      new Request("http://localhost/api/billing/webhooks/stripe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": "99999999",
          "stripe-signature": "t=1,v1=abc",
        },
        body: JSON.stringify({ id: "evt_too_large" }),
      }),
    );

    expect(response.status).toBe(413);
    expect(isValidStripeWebhookSignatureMock).not.toHaveBeenCalled();
    expect(logWarnMock).toHaveBeenCalledWith(
      "billing.webhook.stripe.payload_too_large",
      expect.objectContaining({
        ip: "203.0.113.11",
      }),
    );
  });

  it("returns 413 when raw payload bytes exceed webhook max bytes", async () => {
    const oversizedBody = "x".repeat(300_000);

    const response = await POST(
      new Request("http://localhost/api/billing/webhooks/stripe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "content-length": "invalid",
          "stripe-signature": "t=1,v1=abc",
        },
        body: oversizedBody,
      }),
    );

    expect(response.status).toBe(413);
    expect(isValidStripeWebhookSignatureMock).not.toHaveBeenCalled();
    expect(logWarnMock).toHaveBeenCalledWith(
      "billing.webhook.stripe.payload_too_large",
      expect.objectContaining({
        ip: "203.0.113.11",
      }),
    );
  });

  it("returns 400 when stripe payload is not valid json", async () => {
    const response = await POST(
      new Request("http://localhost/api/billing/webhooks/stripe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": "t=1,v1=abc",
        },
        body: "{invalid-json",
      }),
    );

    expect(response.status).toBe(400);
    expect(mapStripeEventToBillingWebhookPayloadMock).not.toHaveBeenCalled();
    expect(processBillingWebhookMock).not.toHaveBeenCalled();
    expect(logWarnMock).toHaveBeenCalledWith(
      "billing.webhook.stripe.invalid_json",
      expect.objectContaining({
        ip: "203.0.113.11",
      }),
    );
  });

  it("returns ignored response for unsupported stripe events", async () => {
    mapStripeEventToBillingWebhookPayloadMock.mockReturnValueOnce(null);

    const response = await POST(
      new Request("http://localhost/api/billing/webhooks/stripe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": "t=1,v1=abc",
        },
        body: JSON.stringify({ id: "evt_ignored", type: "invoice.created" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      ok: true,
      data: {
        duplicate: false,
        ignored: true,
        message: "Unsupported stripe event type",
      },
    });
    expect(processBillingWebhookMock).not.toHaveBeenCalled();
    expect(logInfoMock).toHaveBeenCalledWith(
      "billing.webhook.stripe.ignored",
      expect.objectContaining({
        ip: "203.0.113.11",
      }),
    );
  });

  it("processes mapped stripe event payload", async () => {
    const response = await POST(
      new Request("http://localhost/api/billing/webhooks/stripe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": "t=1,v1=abc",
        },
        body: JSON.stringify({ id: "evt_123" }),
      }),
    );

    expect(response.status).toBe(200);
    expect(processBillingWebhookMock).toHaveBeenCalledTimes(1);
    expect(processBillingWebhookMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          provider: "stripe",
          eventId: "evt_123",
          transactionId: "pi_123",
        }),
      }),
    );
    expect(logInfoMock).toHaveBeenCalledWith(
      "billing.webhook.stripe.processed",
      expect.objectContaining({
        ip: "203.0.113.11",
        eventId: "evt_123",
        transactionId: "pi_123",
      }),
    );
  });

  it("returns 500 when processing throws unexpected error", async () => {
    processBillingWebhookMock.mockRejectedValueOnce(new Error("processing failed"));

    const response = await POST(
      new Request("http://localhost/api/billing/webhooks/stripe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "stripe-signature": "t=1,v1=abc",
        },
        body: JSON.stringify({ id: "evt_failure" }),
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      ok: false,
      error: {
        message: "Something went wrong.",
      },
    });
    expect(logErrorMock).toHaveBeenCalledWith(
      "route.unhandled_error",
      expect.objectContaining({
        context: expect.objectContaining({
          routeId: "billing.webhook.stripe",
          ip: "203.0.113.11",
        }),
      }),
    );
  });
});

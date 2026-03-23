import { beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "@/lib/env";

const {
  enforceRateLimitMock,
  getRequestIpMock,
  logInfoMock,
  logWarnMock,
  isValidBillingSignatureMock,
  processBillingWebhookMock,
} = vi.hoisted(() => ({
  enforceRateLimitMock: vi.fn(),
  getRequestIpMock: vi.fn(),
  logInfoMock: vi.fn(),
  logWarnMock: vi.fn(),
  isValidBillingSignatureMock: vi.fn(),
  processBillingWebhookMock: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: enforceRateLimitMock,
  getRequestIp: getRequestIpMock,
}));

vi.mock("@/modules/billing/webhook-service", () => ({
  isValidBillingSignature: isValidBillingSignatureMock,
  processBillingWebhook: processBillingWebhookMock,
}));

vi.mock("@/lib/observability/logger", () => ({
  logInfo: logInfoMock,
  logWarn: logWarnMock,
}));

import { POST } from "@/app/api/billing/webhooks/mock/route";

describe("billing webhook route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    enforceRateLimitMock.mockResolvedValue({
      allowed: true,
      remaining: 99,
      retryAfterMs: 0,
    });
    getRequestIpMock.mockReturnValue("203.0.113.10");
    isValidBillingSignatureMock.mockReset();
    processBillingWebhookMock.mockReset();
    env.NODE_ENV = "test";
    env.BILLING_PROVIDER = "mock_gateway";
  });

  it("returns 404 when route is disabled outside mock mode", async () => {
    env.NODE_ENV = "production";

    const response = await POST(
      new Request("http://localhost/api/billing/webhooks/mock", {
        method: "POST",
        headers: {
          "x-provider-signature": "fake",
          "content-type": "application/json",
        },
        body: "{}",
      }),
    );

    expect(response.status).toBe(404);
    expect(isValidBillingSignatureMock).not.toHaveBeenCalled();
  });

  it("rejects oversized payload before signature verification", async () => {
    const response = await POST(
      new Request("http://localhost/api/billing/webhooks/mock", {
        method: "POST",
        headers: {
          "content-length": "300000",
          "x-provider-signature": "fake",
          "content-type": "application/json",
        },
        body: "{}",
      }),
    );

    expect(response.status).toBe(413);
    expect(isValidBillingSignatureMock).not.toHaveBeenCalled();
    expect(processBillingWebhookMock).not.toHaveBeenCalled();
    expect(logWarnMock).toHaveBeenCalledWith(
      "billing.webhook.mock.payload_too_large",
      expect.objectContaining({
        ip: "203.0.113.10",
      }),
    );
  });

  it("rejects invalid signature before processing", async () => {
    isValidBillingSignatureMock.mockReturnValue(false);

    const response = await POST(
      new Request("http://localhost/api/billing/webhooks/mock", {
        method: "POST",
        headers: {
          "x-provider-signature": "invalid",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          provider: "mock_gateway",
          eventId: "evt_123",
        }),
      }),
    );

    expect(response.status).toBe(401);
    expect(processBillingWebhookMock).not.toHaveBeenCalled();
    expect(logWarnMock).toHaveBeenCalledWith(
      "billing.webhook.mock.invalid_signature",
      expect.objectContaining({
        ip: "203.0.113.10",
        signaturePresent: true,
      }),
    );
  });

  it("returns 429 and logs when rate limit is exceeded", async () => {
    enforceRateLimitMock.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      retryAfterMs: 15_000,
      reason: "quota_exceeded",
    });

    const response = await POST(
      new Request("http://localhost/api/billing/webhooks/mock", {
        method: "POST",
        headers: {
          "x-provider-signature": "irrelevant",
          "content-type": "application/json",
        },
        body: JSON.stringify({ eventId: "evt_429" }),
      }),
    );

    expect(response.status).toBe(429);
    expect(logWarnMock).toHaveBeenCalledWith(
      "billing.webhook.mock.rate_limited",
      expect.objectContaining({
        ip: "203.0.113.10",
        retryAfterMs: 15_000,
      }),
    );
  });

  it("processes valid payload and signature", async () => {
    isValidBillingSignatureMock.mockReturnValue(true);
    processBillingWebhookMock.mockResolvedValue({
      duplicate: false,
      message: "Webhook processed",
    });

    const payload = {
      provider: "mock_gateway",
      eventId: "evt_1",
      eventType: "payment_succeeded",
      transactionId: "txn_1",
      parentEmail: "demo.parent@cungcontuhoc.io.vn",
      amountVnd: 1000000,
      planCode: "YEARLY_STANDARD",
    };

    const response = await POST(
      new Request("http://localhost/api/billing/webhooks/mock", {
        method: "POST",
        headers: {
          "x-provider-signature": "valid-signature",
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      }),
    );

    expect(response.status).toBe(200);
    expect(processBillingWebhookMock).toHaveBeenCalledTimes(1);
    expect(processBillingWebhookMock).toHaveBeenCalledWith({
      payload,
    });
    expect(logInfoMock).toHaveBeenCalledWith(
      "billing.webhook.mock.processed",
      expect.objectContaining({
        ip: "203.0.113.10",
        duplicate: false,
      }),
    );
  });
});

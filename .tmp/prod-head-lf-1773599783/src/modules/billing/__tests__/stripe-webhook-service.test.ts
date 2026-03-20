import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  isValidStripeWebhookSignature,
  mapStripeEventToBillingWebhookPayload,
} from "@/modules/billing/stripe-webhook-service";

function createStripeSignatureHeader(rawBody: string, secret: string, timestamp = 1_777_777_777) {
  const signedPayload = `${timestamp}.${rawBody}`;
  const signature = createHmac("sha256", secret).update(signedPayload).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

describe("isValidStripeWebhookSignature", () => {
  it("accepts valid v1 signature and supports secret rotation", () => {
    const rawBody = JSON.stringify({
      id: "evt_test",
      type: "checkout.session.completed",
    });

    const header = createStripeSignatureHeader(rawBody, "new_secret", 1_777_777_777);
    const nowMs = 1_777_777_777 * 1000 + 120_000;

    expect(
      isValidStripeWebhookSignature({
        rawBody,
        signatureHeader: header,
        secrets: ["old_secret", "new_secret"],
        toleranceSeconds: 300,
        nowMs,
      }),
    ).toBe(true);
  });

  it("rejects signature when timestamp is outside tolerance", () => {
    const rawBody = JSON.stringify({
      id: "evt_test",
      type: "checkout.session.completed",
    });

    const header = createStripeSignatureHeader(rawBody, "secret", 1_777_777_777);
    const nowMs = 1_777_777_777 * 1000 + 900_000;

    expect(
      isValidStripeWebhookSignature({
        rawBody,
        signatureHeader: header,
        secrets: ["secret"],
        toleranceSeconds: 300,
        nowMs,
      }),
    ).toBe(false);
  });
});

describe("mapStripeEventToBillingWebhookPayload", () => {
  it("maps checkout.session.completed into billing webhook payload", () => {
    const payload = mapStripeEventToBillingWebhookPayload({
      id: "evt_123",
      type: "checkout.session.completed",
      created: 1_777_777_777,
      data: {
        object: {
          id: "cs_test_123",
          payment_intent: "pi_test_123",
          amount_total: 120000,
          metadata: {
            planCode: "YEARLY_STANDARD",
            parentId: "parent-1",
            parentEmail: "parent@example.com",
          },
          payment_status: "paid",
        },
      },
    });

    expect(payload).toEqual(
      expect.objectContaining({
        provider: "stripe",
        eventId: "evt_123",
        eventType: "payment_succeeded",
        transactionId: "pi_test_123",
        parentId: "parent-1",
        parentEmail: "parent@example.com",
        amountVnd: 120000,
        planCode: "YEARLY_STANDARD",
      }),
    );
  });

  it("maps charge.refunded into payment_refunded billing payload", () => {
    const payload = mapStripeEventToBillingWebhookPayload({
      id: "evt_refund_123",
      type: "charge.refunded",
      created: 1_777_777_888,
      data: {
        object: {
          id: "ch_test_123",
          payment_intent: "pi_test_refund_123",
          amount_refunded: 120000,
          metadata: {
            planCode: "YEARLY_STANDARD",
            parentId: "parent-1",
            parentEmail: "parent@example.com",
          },
          billing_details: {
            email: "parent@example.com",
          },
        },
      },
    });

    expect(payload).toEqual(
      expect.objectContaining({
        provider: "stripe",
        eventId: "evt_refund_123",
        eventType: "payment_refunded",
        transactionId: "pi_test_refund_123",
        parentId: "parent-1",
        parentEmail: "parent@example.com",
        amountVnd: 120000,
        planCode: "YEARLY_STANDARD",
      }),
    );
  });

  it("returns null for unsupported stripe events", () => {
    const payload = mapStripeEventToBillingWebhookPayload({
      id: "evt_ignored",
      type: "invoice.created",
      data: {
        object: {},
      },
    });

    expect(payload).toBeNull();
  });
});

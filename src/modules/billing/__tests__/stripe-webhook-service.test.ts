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

  it("maps MONTHLY_STANDARD invoice.paid without UNMAPPABLE", () => {
    const payload = mapStripeEventToBillingWebhookPayload({
      id: "evt_invoice_paid",
      type: "invoice.paid",
      created: 1_777_777_777,
      data: {
        object: {
          id: "in_test_1",
          amount_paid: 149000,
          customer_email: "parent@example.com",
          subscription: "sub_test_1",
          metadata: {},
          subscription_details: {
            metadata: {
              planCode: "MONTHLY_STANDARD",
              parentId: "parent-1",
              parentEmail: "parent@example.com",
            },
          },
          lines: {
            data: [{ period: { end: 1_780_369_777 } }],
          },
        },
      },
    });

    expect(payload).toEqual(
      expect.objectContaining({
        eventType: "payment_succeeded",
        planCode: "MONTHLY_STANDARD",
        transactionId: "sub_test_1",
        periodEnd: new Date(1_780_369_777 * 1000),
      }),
    );
  });

  it("maps invoice.payment_failed to payment_failed", () => {
    const payload = mapStripeEventToBillingWebhookPayload({
      id: "evt_invoice_fail",
      type: "invoice.payment_failed",
      created: 1_777_777_777,
      data: {
        object: {
          id: "in_fail",
          amount_due: 149000,
          customer_email: "parent@example.com",
          metadata: {},
          subscription_details: {
            metadata: { planCode: "MONTHLY_STANDARD", parentEmail: "parent@example.com" },
          },
        },
      },
    });

    expect(payload?.eventType).toBe("payment_failed");
    expect(payload?.planCode).toBe("MONTHLY_STANDARD");
  });

  it("maps customer.subscription.deleted to subscription_deleted", () => {
    const payload = mapStripeEventToBillingWebhookPayload({
      id: "evt_sub_deleted",
      type: "customer.subscription.deleted",
      created: 1_777_777_777,
      data: {
        object: {
          id: "sub_gone",
          status: "canceled",
          metadata: { planCode: "YEARLY_STANDARD", parentEmail: "parent@example.com" },
        },
      },
    });

    expect(payload?.eventType).toBe("subscription_deleted");
    expect(payload?.transactionId).toBe("sub_gone");
  });

  it("maps past_due subscription.updated to payment_failed", () => {
    const payload = mapStripeEventToBillingWebhookPayload({
      id: "evt_sub_past_due",
      type: "customer.subscription.updated",
      created: 1_777_777_777,
      data: {
        object: {
          id: "sub_past",
          status: "past_due",
          metadata: { planCode: "YEARLY_STANDARD", parentEmail: "parent@example.com" },
        },
      },
    });

    expect(payload?.eventType).toBe("payment_failed");
  });
});

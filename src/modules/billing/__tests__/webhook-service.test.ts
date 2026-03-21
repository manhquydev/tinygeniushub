import { createHmac } from "node:crypto";
import { PaymentStatus, SubscriptionStatus, WebhookStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { env } from "@/lib/env";

const { prismaMock, txMock, createAuditLogMock } = vi.hoisted(() => {
  const txMock = {
    $queryRawUnsafe: vi.fn().mockResolvedValue([]),
    webhookEvent: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    parentAccount: {
      findUnique: vi.fn(),
    },
    subscription: {
      update: vi.fn(),
      create: vi.fn(),
    },
    paymentRecord: {
      upsert: vi.fn(),
    },
  };

  return {
    txMock,
    prismaMock: {
      $transaction: vi.fn(async (callback: (tx: typeof txMock) => Promise<unknown>) => callback(txMock)),
    },
    createAuditLogMock: vi.fn(),
  };
});

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

vi.mock("@/modules/platform/audit-service", () => ({
  createAuditLog: createAuditLogMock,
}));

import {
  isValidBillingSignature,
  processBillingWebhook,
  resolveSubscriptionPlanConfig,
} from "@/modules/billing/webhook-service";

const basePayload = {
  provider: "mock_gateway",
  eventId: "evt_1",
  eventType: "payment_succeeded" as const,
  transactionId: "txn_1",
  parentEmail: "parent@example.com",
  amountVnd: 1_299_000,
  planCode: "YEARLY_STANDARD" as const,
  occurredAt: new Date("2026-02-20T10:00:00.000Z"),
};

describe("resolveSubscriptionPlanConfig", () => {
  it("returns subscription-safe fields without amountVnd", () => {
    const config = resolveSubscriptionPlanConfig("YEARLY_STANDARD");

    expect(config).toEqual({
      childProfileLimit: 3,
      caregiverLimit: 2,
      portfolioRetentionMaxDays: 90,
      status: "ACTIVE_STANDARD",
    });
    expect("amountVnd" in config).toBe(false);
  });
});

describe("isValidBillingSignature", () => {
  it("accepts valid HMAC signatures and rejects invalid ones", () => {
    const rawBody = JSON.stringify(basePayload);
    const validSignature = createHmac("sha256", env.BILLING_WEBHOOK_SECRET).update(rawBody).digest("hex");

    expect(isValidBillingSignature(rawBody, validSignature)).toBe(true);
    expect(isValidBillingSignature(rawBody, `${validSignature}00`)).toBe(false);
    expect(isValidBillingSignature(rawBody, null)).toBe(false);
  });
});

describe("processBillingWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    txMock.webhookEvent.findUnique.mockResolvedValue(null);
    txMock.webhookEvent.create.mockResolvedValue({
      id: "wh_1",
      provider: basePayload.provider,
      eventId: basePayload.eventId,
      status: WebhookStatus.RECEIVED,
    });
    txMock.webhookEvent.update.mockResolvedValue({ id: "wh_1", status: WebhookStatus.PROCESSED });

    txMock.parentAccount.findUnique.mockResolvedValue({
      id: "parent-1",
      email: basePayload.parentEmail,
      subscription: {
        id: "sub-1",
      },
    });

    txMock.subscription.update.mockResolvedValue({ id: "sub-1", status: SubscriptionStatus.ACTIVE_STANDARD });
    txMock.subscription.create.mockResolvedValue({ id: "sub-2", status: SubscriptionStatus.ACTIVE_STANDARD });
    txMock.paymentRecord.upsert.mockResolvedValue({ id: "pay-1" });
    createAuditLogMock.mockResolvedValue(undefined);
  });

  it("processes valid webhook and marks event as PROCESSED", async () => {
    const result = await processBillingWebhook({
      payload: basePayload,
    });

    expect(result).toMatchObject({
      duplicate: false,
      paymentStatus: PaymentStatus.SUCCEEDED,
      parentId: "parent-1",
      planCode: "YEARLY_STANDARD",
    });

    expect(txMock.webhookEvent.create).toHaveBeenCalledTimes(1);
    expect(txMock.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          parentId: "parent-1",
        },
        data: expect.objectContaining({
          status: SubscriptionStatus.ACTIVE_STANDARD,
        }),
      }),
    );
    expect(txMock.paymentRecord.upsert).toHaveBeenCalledTimes(1);
    expect(txMock.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "wh_1" },
        data: expect.objectContaining({
          status: WebhookStatus.PROCESSED,
        }),
      }),
    );
    expect(createAuditLogMock).toHaveBeenCalledTimes(1);
  });

  it("is idempotent for duplicate provider+eventId already processed", async () => {
    txMock.webhookEvent.findUnique.mockResolvedValueOnce({
      id: "wh_dup",
      status: WebhookStatus.PROCESSED,
      provider: basePayload.provider,
      eventId: basePayload.eventId,
    });

    const result = await processBillingWebhook({
      payload: basePayload,
    });

    expect(result).toEqual({
      duplicate: true,
      message: "Webhook already processed",
    });
    expect(txMock.webhookEvent.create).not.toHaveBeenCalled();
    expect(txMock.paymentRecord.upsert).not.toHaveBeenCalled();
    expect(txMock.subscription.update).not.toHaveBeenCalled();
  });

  it("does not touch DB when signature is missing or invalid", () => {
    const rawBody = JSON.stringify(basePayload);

    expect(isValidBillingSignature(rawBody, null)).toBe(false);
    expect(isValidBillingSignature(rawBody, "invalid-signature")).toBe(false);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(txMock.webhookEvent.create).not.toHaveBeenCalled();
  });

  it("updates subscription for payment succeeded event", async () => {
    await processBillingWebhook({
      payload: {
        ...basePayload,
        eventId: "evt_2",
        transactionId: "txn_2",
        eventType: "payment_succeeded",
      },
    });

    expect(txMock.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          parentId: "parent-1",
        },
        data: expect.objectContaining({
          status: SubscriptionStatus.ACTIVE_STANDARD,
          autoRenew: true,
        }),
      }),
    );
  });
});

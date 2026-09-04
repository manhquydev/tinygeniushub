import { PaymentStatus, SubscriptionStatus, WebhookStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  transactionMock,
  createAuditLogMock,
  isPrismaUniqueConstraintErrorMock,
} = vi.hoisted(() => ({
  transactionMock: vi.fn(),
  createAuditLogMock: vi.fn(),
  isPrismaUniqueConstraintErrorMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: transactionMock,
  },
}));

vi.mock("@/modules/platform/audit-service", () => ({
  createAuditLog: createAuditLogMock,
}));

vi.mock("@/lib/prisma-error", () => ({
  isPrismaUniqueConstraintError: isPrismaUniqueConstraintErrorMock,
}));

import { processBillingWebhook } from "@/modules/billing/webhook-service";

type TxContext = {
  $queryRawUnsafe: ReturnType<typeof vi.fn>;
  webhookEvent: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  parentAccount: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  subscription: {
    update: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  paymentRecord: {
    upsert: ReturnType<typeof vi.fn>;
  };
  offering: {
    findUnique: ReturnType<typeof vi.fn>;
  };
  entitlement: {
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

function createTxContext(): TxContext {
  return {
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
    offering: {
      findUnique: vi.fn().mockResolvedValue({ id: "offering-pass", code: "platform-pass" }),
    },
    entitlement: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: "ent-1" }),
      update: vi.fn(),
    },
  };
}

function buildPayload(
  overrides: Partial<{
    eventType: "payment_succeeded" | "payment_failed" | "payment_refunded";
    eventId: string;
    transactionId: string;
    parentId: string;
  }> = {},
) {
  return {
    provider: "mock_gateway",
    eventId: overrides.eventId ?? "evt-1",
    eventType: overrides.eventType ?? "payment_succeeded",
    transactionId: overrides.transactionId ?? "txn-1",
    parentId: overrides.parentId,
    parentEmail: "parent@example.com",
    amountVnd: 120_000,
    planCode: "YEARLY_STANDARD" as const,
    occurredAt: new Date("2026-02-20T00:00:00.000Z"),
  };
}

describe("processBillingWebhook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isPrismaUniqueConstraintErrorMock.mockReturnValue(false);
    createAuditLogMock.mockResolvedValue(undefined);
  });

  it("returns duplicate when webhook event is already processed", async () => {
    const tx = createTxContext();
    tx.webhookEvent.findUnique.mockResolvedValueOnce({
      id: "we-1",
      status: WebhookStatus.PROCESSED,
    });
    transactionMock.mockImplementationOnce(async (callback: (input: TxContext) => Promise<unknown>) => callback(tx));

    const result = await processBillingWebhook({ payload: buildPayload() });

    expect(result).toEqual({
      duplicate: true,
      message: "Webhook already processed",
    });
    expect(tx.webhookEvent.create).not.toHaveBeenCalled();
    expect(createAuditLogMock).not.toHaveBeenCalled();
  });

  it("marks event ignored when parent account is missing", async () => {
    const tx = createTxContext();
    tx.webhookEvent.findUnique.mockResolvedValueOnce(null);
    tx.webhookEvent.create.mockResolvedValueOnce({
      id: "we-1",
      status: WebhookStatus.RECEIVED,
    });
    tx.parentAccount.findUnique.mockResolvedValueOnce(null);
    tx.webhookEvent.update.mockResolvedValue({});
    transactionMock.mockImplementationOnce(async (callback: (input: TxContext) => Promise<unknown>) => callback(tx));

    const result = await processBillingWebhook({ payload: buildPayload() });

    expect(result).toEqual({
      duplicate: false,
      message: "Parent not found. Event ignored.",
    });
    expect(tx.webhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: WebhookStatus.IGNORED,
          errorMessage: "Parent account not found",
        }),
      }),
    );
    expect(tx.paymentRecord.upsert).not.toHaveBeenCalled();
  });

  it("processes successful payments and updates existing subscription", async () => {
    const tx = createTxContext();
    tx.webhookEvent.findUnique.mockResolvedValueOnce(null);
    tx.webhookEvent.create.mockResolvedValueOnce({
      id: "we-1",
      status: WebhookStatus.RECEIVED,
    });
    tx.parentAccount.findUnique.mockResolvedValueOnce({
      id: "parent-1",
      subscription: {
        id: "sub-1",
      },
    });
    tx.subscription.update.mockResolvedValueOnce({
      id: "sub-1",
    });
    tx.paymentRecord.upsert.mockResolvedValue({});
    tx.webhookEvent.update.mockResolvedValue({});
    transactionMock.mockImplementationOnce(async (callback: (input: TxContext) => Promise<unknown>) => callback(tx));

    const result = await processBillingWebhook({ payload: buildPayload() });

    expect(result).toMatchObject({
      duplicate: false,
      paymentStatus: PaymentStatus.SUCCEEDED,
      parentId: "parent-1",
    });
    expect(tx.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { parentId: "parent-1" },
        data: expect.objectContaining({
          planCode: "YEARLY_STANDARD",
          status: SubscriptionStatus.ACTIVE_STANDARD,
          childProfileLimit: 3,
          caregiverLimit: 2,
          portfolioRetentionMaxDays: 90,
          autoRenew: true,
        }),
      }),
    );
    expect(tx.paymentRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          provider: "mock_gateway",
          providerTransactionId: "txn-1",
          subscriptionId: "sub-1",
          status: PaymentStatus.SUCCEEDED,
        }),
      }),
    );
    expect(createAuditLogMock).toHaveBeenCalledTimes(1);
    expect(tx.entitlement.create).toHaveBeenCalledTimes(1);
  });

  it("moves existing subscription to grace when payment fails", async () => {
    const tx = createTxContext();
    tx.webhookEvent.findUnique.mockResolvedValueOnce(null);
    tx.webhookEvent.create.mockResolvedValueOnce({
      id: "we-1",
      status: WebhookStatus.RECEIVED,
    });
    tx.parentAccount.findUnique.mockResolvedValueOnce({
      id: "parent-1",
      subscription: {
        id: "sub-1",
      },
    });
    tx.subscription.update.mockResolvedValueOnce({
      id: "sub-1",
    });
    tx.paymentRecord.upsert.mockResolvedValue({});
    tx.webhookEvent.update.mockResolvedValue({});
    transactionMock.mockImplementationOnce(async (callback: (input: TxContext) => Promise<unknown>) => callback(tx));

    const result = await processBillingWebhook({
      payload: buildPayload({
        eventType: "payment_failed",
      }),
    });

    expect(result).toMatchObject({
      duplicate: false,
      paymentStatus: PaymentStatus.FAILED,
    });
    expect(tx.subscription.update).toHaveBeenCalledWith({
      where: { parentId: "parent-1" },
      data: {
        status: SubscriptionStatus.GRACE,
      },
    });
    expect(tx.entitlement.create).not.toHaveBeenCalled();
  });

  it("marks subscription refunded and disables auto-renew on refund event", async () => {
    const tx = createTxContext();
    tx.webhookEvent.findUnique.mockResolvedValueOnce(null);
    tx.webhookEvent.create.mockResolvedValueOnce({
      id: "we-1",
      status: WebhookStatus.RECEIVED,
    });
    tx.parentAccount.findUnique.mockResolvedValueOnce({
      id: "parent-1",
      subscription: {
        id: "sub-1",
      },
    });
    tx.subscription.update.mockResolvedValueOnce({
      id: "sub-1",
    });
    tx.paymentRecord.upsert.mockResolvedValue({});
    tx.webhookEvent.update.mockResolvedValue({});
    transactionMock.mockImplementationOnce(async (callback: (input: TxContext) => Promise<unknown>) => callback(tx));

    const result = await processBillingWebhook({
      payload: buildPayload({
        eventType: "payment_refunded",
      }),
    });

    expect(result).toMatchObject({
      duplicate: false,
      paymentStatus: PaymentStatus.REFUNDED,
    });
    expect(tx.subscription.update).toHaveBeenCalledWith({
      where: { parentId: "parent-1" },
      data: {
        status: SubscriptionStatus.REFUNDED,
        autoRenew: false,
      },
    });
    expect(tx.entitlement.create).not.toHaveBeenCalled();
  });

  it("handles unique-collision fallback and returns duplicate when recovered row is processed", async () => {
    const tx = createTxContext();
    const uniqueError = new Error("duplicate");

    tx.webhookEvent.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "we-2",
        status: WebhookStatus.PROCESSED,
      });
    tx.webhookEvent.create.mockRejectedValueOnce(uniqueError);
    isPrismaUniqueConstraintErrorMock.mockReturnValueOnce(true);
    transactionMock.mockImplementationOnce(async (callback: (input: TxContext) => Promise<unknown>) => callback(tx));

    const result = await processBillingWebhook({
      payload: buildPayload({
        eventId: "evt-collision",
      }),
    });

    expect(result).toEqual({
      duplicate: true,
      message: "Webhook already processed",
    });
    expect(isPrismaUniqueConstraintErrorMock).toHaveBeenCalledWith(uniqueError, ["provider", "eventid"]);
    expect(tx.parentAccount.findUnique).not.toHaveBeenCalled();
  });
});

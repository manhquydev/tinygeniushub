import { EntitlementStatus, PlanCode, SubscriptionStatus } from "@prisma/client";
import { addDays } from "date-fns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/modules/platform/errors";
import { PLATFORM_PASS_CODE } from "@/modules/entitlement/offering-types";

const { prismaMock, txMock } = vi.hoisted(() => {
  const txMock = {
    giftCode: { updateMany: vi.fn() },
    subscription: { findUnique: vi.fn(), upsert: vi.fn() },
    offering: { findUnique: vi.fn() },
    entitlement: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  };
  return {
    txMock,
    prismaMock: {
      giftCode: { findUnique: vi.fn() },
      $transaction: vi.fn(async (work: (tx: typeof txMock) => Promise<unknown>) => work(txMock)),
    },
  };
});

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/route-error", () => ({
  translateError: vi.fn(async (key: string) => key),
}));

import { redeemGiftCode } from "@/modules/courses/gift-code-service";

const parentId = "parent-1";
const now = new Date("2026-09-05T00:00:00.000Z");

function unusedGift(planCode: string) {
  return {
    id: "gift-1",
    code: "ABCD1234",
    planCode,
    durationDays: 30,
    expiresAt: new Date("2026-12-31T00:00:00.000Z"),
    usedAt: null,
    usedByParentId: null,
  };
}

describe("redeemGiftCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(now);
    prismaMock.$transaction.mockImplementation(async (work: (tx: typeof txMock) => Promise<unknown>) =>
      work(txMock),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not set usedAt when planCode is invalid", async () => {
    prismaMock.giftCode.findUnique.mockResolvedValue(unusedGift("NOT_A_PAYABLE_PLAN"));

    await expect(redeemGiftCode("ABCD1234", parentId)).rejects.toMatchObject({
      code: "GIFT_CODE_PLAN_INVALID",
      status: 422,
    } satisfies Partial<DomainError>);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(txMock.giftCode.updateMany).not.toHaveBeenCalled();
  });

  it("creates a parent entitlement when redeeming a valid plan", async () => {
    const periodEnd = addDays(now, 30);
    prismaMock.giftCode.findUnique.mockResolvedValue(unusedGift("YEARLY_STANDARD"));
    txMock.subscription.findUnique.mockResolvedValue(null);
    txMock.subscription.upsert.mockResolvedValue({ id: "sub-1" });
    txMock.giftCode.updateMany.mockResolvedValue({ count: 1 });
    txMock.offering.findUnique.mockResolvedValue({ id: "offering-pass", code: PLATFORM_PASS_CODE });
    txMock.entitlement.findFirst.mockResolvedValue(null);
    txMock.entitlement.create.mockResolvedValue({ id: "ent-1", status: EntitlementStatus.ACTIVE });

    await redeemGiftCode("ABCD1234", parentId);

    expect(txMock.giftCode.updateMany).toHaveBeenCalledWith({
      where: { id: "gift-1", usedAt: null },
      data: { usedByParentId: parentId, usedAt: now },
    });
    expect(txMock.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { parentId },
        create: expect.objectContaining({
          parentId,
          planCode: PlanCode.YEARLY_STANDARD,
          status: SubscriptionStatus.ACTIVE_STANDARD,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        }),
      }),
    );
    expect(txMock.entitlement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        parentId,
        offeringId: "offering-pass",
        status: EntitlementStatus.ACTIVE,
        validFrom: now,
        validUntil: periodEnd,
      }),
    });
  });
});

import { EntitlementStatus, PlanCode, SubscriptionStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PLATFORM_PASS_CODE } from "@/modules/entitlement/offering-types";

const { prismaMock, txMock } = vi.hoisted(() => {
  const txMock = {
    subscription: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    offering: {
      findUnique: vi.fn(),
    },
    entitlement: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  return {
    txMock,
    prismaMock: {
      $transaction: vi.fn(async (callback: (tx: typeof txMock) => Promise<unknown>) =>
        callback(txMock),
      ),
      adminActionLog: {
        create: vi.fn(),
      },
    },
  };
});

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import { updateAdminUserSubscription } from "@/modules/admin/admin-users-subscription-service";

const parentId = "parent-1";
const periodEnd = new Date("2026-10-05T00:00:00.000Z");

describe("updateAdminUserSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    txMock.subscription.findUnique.mockResolvedValue({
      id: "sub-1",
      planCode: PlanCode.YEARLY_STANDARD,
      status: SubscriptionStatus.EXPIRED,
      currentPeriodEnd: new Date("2020-01-01T00:00:00.000Z"),
      autoRenew: false,
    });
    txMock.subscription.update.mockResolvedValue({
      id: "sub-1",
      planCode: PlanCode.YEARLY_STANDARD,
      status: SubscriptionStatus.ACTIVE_STANDARD,
      currentPeriodStart: new Date("2020-01-01T00:00:00.000Z"),
      currentPeriodEnd: periodEnd,
      autoRenew: true,
      updatedAt: new Date("2026-09-05T00:00:00.000Z"),
    });
    txMock.offering.findUnique.mockResolvedValue({
      id: "offering-pass",
      code: PLATFORM_PASS_CODE,
    });
    txMock.entitlement.findFirst.mockResolvedValue(null);
    txMock.entitlement.create.mockResolvedValue({
      id: "ent-1",
      status: EntitlementStatus.ACTIVE,
    });
    prismaMock.adminActionLog.create.mockResolvedValue({ id: "log-1" });
  });

  it("activate leaves a live entitlement for a parent with no prior ticket", async () => {
    const subscription = await updateAdminUserSubscription({
      parentId,
      action: "activate",
      adminEmail: "admin@example.com",
    });

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    expect(txMock.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { parentId },
        data: expect.objectContaining({
          status: SubscriptionStatus.ACTIVE_STANDARD,
          autoRenew: true,
        }),
      }),
    );
    expect(txMock.offering.findUnique).toHaveBeenCalledWith({
      where: { code: PLATFORM_PASS_CODE },
    });
    expect(txMock.entitlement.findFirst).toHaveBeenCalledWith({
      where: {
        parentId,
        offeringId: "offering-pass",
        status: { in: [EntitlementStatus.ACTIVE, EntitlementStatus.GRACE] },
      },
    });
    expect(txMock.entitlement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        parentId,
        offeringId: "offering-pass",
        status: EntitlementStatus.ACTIVE,
        validUntil: periodEnd,
      }),
    });
    expect(txMock.entitlement.update).not.toHaveBeenCalled();
    expect(subscription.status).toBe(SubscriptionStatus.ACTIVE_STANDARD);
  });

  it("cancel at period end keeps the ticket until currentPeriodEnd", async () => {
    txMock.subscription.update.mockResolvedValue({
      id: "sub-1",
      planCode: PlanCode.YEARLY_STANDARD,
      status: SubscriptionStatus.CANCELED_AT_PERIOD_END,
      currentPeriodStart: new Date("2026-01-01T00:00:00.000Z"),
      currentPeriodEnd: periodEnd,
      autoRenew: false,
      updatedAt: new Date("2026-09-05T00:00:00.000Z"),
    });
    txMock.entitlement.findFirst.mockResolvedValue({
      id: "ent-1",
      status: EntitlementStatus.ACTIVE,
      validUntil: new Date("2027-01-01T00:00:00.000Z"),
    });
    txMock.entitlement.update.mockResolvedValue({
      id: "ent-1",
      status: EntitlementStatus.ACTIVE,
      validUntil: periodEnd,
    });

    const subscription = await updateAdminUserSubscription({
      parentId,
      action: "cancel",
      adminEmail: "admin@example.com",
    });

    expect(subscription.status).toBe(SubscriptionStatus.CANCELED_AT_PERIOD_END);
    expect(txMock.entitlement.create).not.toHaveBeenCalled();
    expect(txMock.entitlement.update).toHaveBeenCalledWith({
      where: { id: "ent-1" },
      data: expect.objectContaining({
        status: EntitlementStatus.ACTIVE,
        validUntil: periodEnd,
      }),
    });
  });
});

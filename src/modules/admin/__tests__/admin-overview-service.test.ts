import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    parentAccount: {
      count: vi.fn(),
    },
    childProfile: {
      count: vi.fn(),
    },
    subscription: {
      groupBy: vi.fn(),
    },
    paymentRecord: {
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
    webhookEvent: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    referralCode: {
      count: vi.fn(),
    },
    referralAttribution: {
      count: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import { getAdminOverview } from "@/modules/admin/admin-overview-service";

describe("getAdminOverview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.parentAccount.count.mockResolvedValue(10);
    prismaMock.childProfile.count.mockResolvedValue(16);
    prismaMock.subscription.groupBy.mockResolvedValue([
      { status: "TRIALING", _count: { _all: 4 } },
      { status: "ACTIVE_STANDARD", _count: { _all: 6 } },
    ]);
    prismaMock.paymentRecord.aggregate.mockResolvedValue({
      _count: { _all: 11 },
      _sum: { amountVnd: 9_900_000 },
    });
    prismaMock.webhookEvent.groupBy.mockResolvedValue([
      { status: "PROCESSED", _count: { _all: 8 } },
      { status: "FAILED", _count: { _all: 2 } },
    ]);
    prismaMock.paymentRecord.findMany.mockResolvedValue([{ id: "pay-1" }]);
    prismaMock.webhookEvent.findMany.mockResolvedValue([{ id: "wh-1" }]);
    prismaMock.referralCode.count.mockResolvedValue(7);
    prismaMock.referralAttribution.count
      .mockResolvedValueOnce(13)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(3);
  });

  it("returns the overview shape consumed by admin/overview page and route", async () => {
    const result = await getAdminOverview();

    expect(result).toEqual({
      counts: {
        parents: 10,
        children: 16,
        successfulPayments30d: 11,
        successfulRevenueVnd30d: 9_900_000,
        referralCodes: 7,
        referralAttributions: 13,
        paidReferrals: 5,
        rewardedReferrals: 3,
      },
      subscriptionsByStatus: {
        TRIALING: 4,
        ACTIVE_STANDARD: 6,
      },
      webhooksByStatus: {
        PROCESSED: 8,
        FAILED: 2,
      },
      recentPayments: [{ id: "pay-1" }],
      recentWebhookEvents: [{ id: "wh-1" }],
    });
  });

  it("aggregates dashboard stats and maps grouped status counts", async () => {
    const result = await getAdminOverview();

    expect(result.counts).toEqual({
      parents: 10,
      children: 16,
      successfulPayments30d: 11,
      successfulRevenueVnd30d: 9_900_000,
      referralCodes: 7,
      referralAttributions: 13,
      paidReferrals: 5,
      rewardedReferrals: 3,
    });
    expect(result.subscriptionsByStatus).toEqual({
      TRIALING: 4,
      ACTIVE_STANDARD: 6,
    });
    expect(result.webhooksByStatus).toEqual({
      PROCESSED: 8,
      FAILED: 2,
    });
    expect(result.recentPayments).toEqual([{ id: "pay-1" }]);
    expect(result.recentWebhookEvents).toEqual([{ id: "wh-1" }]);
  });
});

import { PlanCode, SubscriptionStatus } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/modules/platform/errors";

const { prismaMock, grantCourseOfferingInTxMock, grantPlanOfferingInTxMock } = vi.hoisted(() => ({
  prismaMock: {
    courseEnrollment: { findMany: vi.fn() },
    subscription: { findMany: vi.fn() },
    entitlement: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
  grantCourseOfferingInTxMock: vi.fn(),
  grantPlanOfferingInTxMock: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/modules/entitlement/grant-from-billing", () => ({
  grantCourseOfferingInTx: grantCourseOfferingInTxMock,
  grantPlanOfferingInTx: grantPlanOfferingInTxMock,
}));

import { backfillEntitlementGrants } from "@/modules/entitlement/backfill-grants";

describe("backfillEntitlementGrants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (work: (tx: { tag: string }) => Promise<unknown>) =>
      work({ tag: "tx" }),
    );
  });

  it("grants course tickets for enrollments and plan tickets for live subscriptions", async () => {
    prismaMock.courseEnrollment.findMany.mockResolvedValueOnce([
      { id: "enroll-1", parentId: "parent-1", courseId: "course-1", paymentId: "pay-1" },
    ]);
    prismaMock.subscription.findMany.mockResolvedValueOnce([
      {
        parentId: "parent-1",
        planCode: PlanCode.TRIAL,
        currentPeriodStart: new Date("2026-09-01"),
        currentPeriodEnd: new Date("2026-09-08"),
      },
    ]);
    grantCourseOfferingInTxMock.mockResolvedValueOnce({ id: "ent-course" });
    grantPlanOfferingInTxMock.mockResolvedValueOnce({ id: "ent-pass" });
    prismaMock.entitlement.findMany.mockResolvedValueOnce([
      { parentId: "parent-1", offering: { catalogKey: "course:course-1" } },
    ]);
    await expect(backfillEntitlementGrants()).resolves.toEqual({
      enrollmentCount: 1,
      subscriptionCount: 1,
      courseTickets: 1,
      planTickets: 1,
    });

    expect(grantCourseOfferingInTxMock).toHaveBeenCalledWith(
      { tag: "tx" },
      { parentId: "parent-1", courseId: "course-1", sourcePaymentId: "pay-1" },
    );
    expect(grantPlanOfferingInTxMock).toHaveBeenCalledWith(
      { tag: "tx" },
      expect.objectContaining({ parentId: "parent-1", planCode: PlanCode.TRIAL }),
    );
    expect(prismaMock.subscription.findMany.mock.calls[0][0].where.status.in).toEqual([
      SubscriptionStatus.TRIALING,
      SubscriptionStatus.ACTIVE_STANDARD,
      SubscriptionStatus.ACTIVE_FAMILYPLUS,
    ]);
  });

  it("fails cutover when an enrollment still has no live ticket", async () => {
    prismaMock.courseEnrollment.findMany.mockResolvedValueOnce([
      { id: "enroll-1", parentId: "parent-1", courseId: "course-1", paymentId: "pay-1" },
    ]);
    prismaMock.subscription.findMany.mockResolvedValueOnce([]);
    grantCourseOfferingInTxMock.mockResolvedValueOnce({ id: "ent-course" });
    prismaMock.entitlement.findMany.mockResolvedValueOnce([]);

    await expect(backfillEntitlementGrants()).rejects.toMatchObject({
      code: "CUTOVER_ENROLLMENTS_UNMATCHED",
      status: 409,
    } satisfies Partial<DomainError>);
  });
});

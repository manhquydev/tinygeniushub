import { EntitlementStatus, OfferingKind } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { syncEnrollmentsFromPaymentTarget } from "@/modules/admin/payment-reconcile-sync";
import { offeringCodeForCourse } from "@/modules/entitlement/grant-from-billing";

const parentId = "parent-1";
const paymentRecordId = "pay-1";

function createTx() {
  return {
    course: {
      findMany: vi.fn(),
    },
    courseEnrollment: {
      upsert: vi.fn().mockResolvedValue({ id: "enr-1" }),
    },
    offering: {
      findUnique: vi.fn(),
      upsert: vi.fn().mockImplementation(async ({ where }: { where: { code: string } }) => ({
        id: `offering-${where.code}`,
        code: where.code,
      })),
    },
    entitlement: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(async ({ data }: { data: { offeringId: string } }) => ({
        id: `ent-${data.offeringId}`,
      })),
      update: vi.fn(),
    },
  };
}

describe("syncEnrollmentsFromPaymentTarget", () => {
  it("keeps enrollment as ledger and grants a course ticket on the same tx", async () => {
    const tx = createTx();
    const courseId = "course-1";

    const result = await syncEnrollmentsFromPaymentTarget({
      tx: tx as never,
      parentId,
      paymentRecordId,
      rawPayload: { target: { kind: "course", courseId } },
    });

    expect(result).toEqual({ courseIds: [courseId], syncedEnrollmentCount: 1 });
    expect(tx.courseEnrollment.upsert).toHaveBeenCalledWith({
      where: { courseId_parentId: { courseId, parentId } },
      update: { paymentId: paymentRecordId },
      create: { courseId, parentId, paymentId: paymentRecordId },
    });
    expect(tx.offering.upsert).toHaveBeenCalledWith({
      where: { code: offeringCodeForCourse(courseId) },
      update: {},
      create: {
        code: offeringCodeForCourse(courseId),
        kind: OfferingKind.ONE_TIME_PROGRAM,
        catalogKey: `course:${courseId}`,
        active: true,
      },
    });
    expect(tx.entitlement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        parentId,
        offeringId: `offering-${offeringCodeForCourse(courseId)}`,
        status: EntitlementStatus.ACTIVE,
        validUntil: null,
        sourcePaymentId: paymentRecordId,
      }),
    });
    expect(tx.offering.upsert.mock.invocationCallOrder[0]).toBeGreaterThan(
      tx.courseEnrollment.upsert.mock.invocationCallOrder[0]!,
    );
  });

  it("grants one ticket per resolved bundle courseId without a second payload parser", async () => {
    const tx = createTx();
    tx.course.findMany.mockResolvedValue([{ id: "c1" }, { id: "c2" }]);

    const result = await syncEnrollmentsFromPaymentTarget({
      tx: tx as never,
      parentId,
      paymentRecordId,
      rawPayload: { target: { kind: "bundle", courseIds: ["c1", "c2"] } },
    });

    expect(result.courseIds).toEqual(["c1", "c2"]);
    expect(tx.courseEnrollment.upsert).toHaveBeenCalledTimes(2);
    expect(tx.entitlement.create).toHaveBeenCalledTimes(2);
    expect(tx.entitlement.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        parentId,
        offeringId: `offering-${offeringCodeForCourse("c1")}`,
        sourcePaymentId: paymentRecordId,
      }),
    });
    expect(tx.entitlement.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        parentId,
        offeringId: `offering-${offeringCodeForCourse("c2")}`,
        sourcePaymentId: paymentRecordId,
      }),
    });
  });

  it("fails closed when checkout target cannot be resolved", async () => {
    const tx = createTx();

    await expect(
      syncEnrollmentsFromPaymentTarget({
        tx: tx as never,
        parentId,
        paymentRecordId,
        rawPayload: { target: { kind: "plan" } },
      }),
    ).rejects.toMatchObject({
      status: 409,
      code: "PAYMENT_RECONCILE_TARGET_INVALID",
    });

    expect(tx.courseEnrollment.upsert).not.toHaveBeenCalled();
    expect(tx.offering.upsert).not.toHaveBeenCalled();
    expect(tx.entitlement.create).not.toHaveBeenCalled();
  });
});

import { EntitlementStatus, OfferingKind } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DomainError } from "@/modules/platform/errors";
import {
  expirePlanOfferingInTx,
  grantCourseOfferingInTx,
  grantPlanOfferingInTx,
  markPlanOfferingGraceInTx,
  offeringCodeForCourse,
  offeringCodeForPlan,
} from "@/modules/entitlement/grant-from-billing";
import { PLATFORM_PASS_CODE, PLATFORM_PASS_KEY } from "@/modules/entitlement/offering-types";

const parentId = "parent-1";
const offeringId = "offering-pass";

function createTx() {
  return {
    offering: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    entitlement: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
}

describe("offeringCodeForPlan", () => {
  it("maps trial monthly and yearly plans to platform-pass", () => {
    expect(offeringCodeForPlan("TRIAL")).toBe(PLATFORM_PASS_CODE);
    expect(offeringCodeForPlan("YEARLY_STANDARD")).toBe(PLATFORM_PASS_CODE);
    expect(offeringCodeForPlan("YEARLY_FAMILY_PLUS")).toBe(PLATFORM_PASS_CODE);
    expect(offeringCodeForPlan("MONTHLY_STANDARD")).toBe(PLATFORM_PASS_CODE);
  });
});

describe("grantPlanOfferingInTx", () => {
  let tx = createTx();

  beforeEach(() => {
    tx = createTx();
  });

  it("creates one ACTIVE ticket when none exists", async () => {
    const validUntil = new Date("2026-09-11T00:00:00.000Z");
    tx.offering.findUnique.mockResolvedValue({ id: offeringId, code: PLATFORM_PASS_CODE, catalogKey: PLATFORM_PASS_KEY });
    tx.entitlement.findFirst.mockResolvedValue(null);
    tx.entitlement.create.mockResolvedValue({ id: "ent-1", status: EntitlementStatus.ACTIVE });

    await grantPlanOfferingInTx(tx as never, {
      parentId,
      planCode: "TRIAL",
      validUntil,
    });

    expect(tx.entitlement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        parentId,
        offeringId,
        status: EntitlementStatus.ACTIVE,
        validUntil,
      }),
    });
    expect(tx.entitlement.update).not.toHaveBeenCalled();
  });

  it("extends validUntil on the existing ACTIVE ticket and does not duplicate", async () => {
    const currentUntil = new Date("2026-09-11T00:00:00.000Z");
    const laterUntil = new Date("2027-02-20T00:00:00.000Z");
    tx.offering.findUnique.mockResolvedValue({ id: offeringId, code: PLATFORM_PASS_CODE });
    tx.entitlement.findFirst.mockResolvedValue({
      id: "ent-1",
      parentId,
      offeringId,
      status: EntitlementStatus.ACTIVE,
      validUntil: currentUntil,
      sourcePaymentId: "pay-old",
    });
    tx.entitlement.update.mockResolvedValue({ id: "ent-1" });

    await grantPlanOfferingInTx(tx as never, {
      parentId,
      planCode: "YEARLY_STANDARD",
      validUntil: laterUntil,
      sourcePaymentId: "pay-new",
    });

    expect(tx.entitlement.create).not.toHaveBeenCalled();
    expect(tx.entitlement.update).toHaveBeenCalledWith({
      where: { id: "ent-1" },
      data: {
        status: EntitlementStatus.ACTIVE,
        validUntil: laterUntil,
        sourcePaymentId: "pay-new",
      },
    });
  });

  it("does not shrink an existing later validUntil", async () => {
    const yearlyUntil = new Date("2027-02-20T00:00:00.000Z");
    tx.offering.findUnique.mockResolvedValue({ id: offeringId, code: PLATFORM_PASS_CODE });
    tx.entitlement.findFirst.mockResolvedValue({
      id: "ent-1",
      validUntil: yearlyUntil,
      sourcePaymentId: "pay-year",
    });

    const result = await grantPlanOfferingInTx(tx as never, {
      parentId,
      planCode: "TRIAL",
      validUntil: new Date("2026-09-11T00:00:00.000Z"),
    });

    expect(result).toMatchObject({ id: "ent-1" });
    expect(tx.entitlement.create).not.toHaveBeenCalled();
    expect(tx.entitlement.update).not.toHaveBeenCalled();
  });

  it("grants MONTHLY_STANDARD onto platform-pass", async () => {
    tx.offering.findUnique.mockResolvedValue({ id: offeringId, code: PLATFORM_PASS_CODE });
    tx.entitlement.findFirst.mockResolvedValue(null);
    tx.entitlement.create.mockResolvedValue({ id: "ent-month", status: EntitlementStatus.ACTIVE });

    await grantPlanOfferingInTx(tx as never, {
      parentId,
      planCode: "MONTHLY_STANDARD",
      validUntil: new Date("2026-10-04T00:00:00.000Z"),
    });

    expect(tx.offering.findUnique).toHaveBeenCalledWith({ where: { code: PLATFORM_PASS_CODE } });
    expect(tx.entitlement.create).toHaveBeenCalled();
  });

  it("throws when platform-pass offering is missing", async () => {
    tx.offering.findUnique.mockResolvedValue(null);

    await expect(grantPlanOfferingInTx(tx as never, { parentId, planCode: "TRIAL" })).rejects.toMatchObject({
      code: "OFFERING_NOT_FOUND",
    } satisfies Partial<DomainError>);
  });
});

describe("grantCourseOfferingInTx", () => {
  it("upserts a course offering and grants a non-expiring ACTIVE ticket", async () => {
    const tx = createTx();
    const courseId = "course-42";
    tx.offering.upsert.mockResolvedValue({
      id: "offering-course",
      code: offeringCodeForCourse(courseId),
    });
    tx.entitlement.findFirst.mockResolvedValue(null);
    tx.entitlement.create.mockResolvedValue({ id: "ent-course" });

    await grantCourseOfferingInTx(tx as never, {
      parentId,
      courseId,
      sourcePaymentId: "pay-course",
    });

    expect(tx.offering.upsert).toHaveBeenCalledWith({
      where: { code: "course-course-42" },
      update: {},
      create: {
        code: "course-course-42",
        kind: OfferingKind.ONE_TIME_PROGRAM,
        catalogKey: "course:course-42",
        active: true,
      },
    });
    expect(tx.entitlement.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        parentId,
        offeringId: "offering-course",
        status: EntitlementStatus.ACTIVE,
        validUntil: null,
        sourcePaymentId: "pay-course",
      }),
    });
  });

  it("does not create a second course ticket when one is already live", async () => {
    const tx = createTx();
    tx.offering.upsert.mockResolvedValue({
      id: "offering-course",
      code: offeringCodeForCourse("course-42"),
    });
    tx.entitlement.findFirst.mockResolvedValue({
      id: "ent-course",
      parentId,
      offeringId: "offering-course",
      status: EntitlementStatus.ACTIVE,
      validUntil: null,
      sourcePaymentId: "pay-old",
    });

    await expect(
      grantCourseOfferingInTx(tx as never, {
        parentId,
        courseId: "course-42",
        sourcePaymentId: "pay-new",
      }),
    ).resolves.toMatchObject({ id: "ent-course" });

    expect(tx.entitlement.create).not.toHaveBeenCalled();
    expect(tx.entitlement.update).not.toHaveBeenCalled();
  });
});

describe("dunning ticket status", () => {
  it("marks GRACE, expires, and reactivates on later grant", async () => {
    const tx = createTx();
    const graceUntil = new Date("2026-09-07T00:00:00.000Z");
    tx.offering.findUnique.mockResolvedValue({ id: offeringId, code: PLATFORM_PASS_CODE });
    tx.entitlement.findFirst.mockResolvedValue({
      id: "ent-1",
      status: EntitlementStatus.ACTIVE,
      validUntil: new Date("2026-09-04T00:00:00.000Z"),
    });
    tx.entitlement.update.mockResolvedValue({ id: "ent-1" });

    await markPlanOfferingGraceInTx(tx as never, {
      parentId,
      planCode: "MONTHLY_STANDARD",
      validUntil: graceUntil,
    });
    await expirePlanOfferingInTx(tx as never, { parentId, planCode: "MONTHLY_STANDARD" });

    tx.entitlement.findFirst.mockResolvedValue({
      id: "ent-1",
      status: EntitlementStatus.GRACE,
      validUntil: graceUntil,
      sourcePaymentId: "pay-old",
    });
    await grantPlanOfferingInTx(tx as never, {
      parentId,
      planCode: "MONTHLY_STANDARD",
      validUntil: new Date("2026-10-04T00:00:00.000Z"),
      sourcePaymentId: "pay-new",
    });

    expect(tx.entitlement.update).toHaveBeenCalledWith({
      where: { id: "ent-1" },
      data: { status: EntitlementStatus.GRACE, validUntil: graceUntil },
    });
    expect(tx.entitlement.update).toHaveBeenCalledWith({
      where: { id: "ent-1" },
      data: { status: EntitlementStatus.EXPIRED },
    });
    expect(tx.entitlement.update).toHaveBeenCalledWith({
      where: { id: "ent-1" },
      data: {
        status: EntitlementStatus.ACTIVE,
        validUntil: new Date("2026-10-04T00:00:00.000Z"),
        sourcePaymentId: "pay-new",
      },
    });
  });
});

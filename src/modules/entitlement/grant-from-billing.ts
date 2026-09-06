import { EntitlementStatus, OfferingKind, Prisma } from "@prisma/client";
import { courseCatalogKey } from "@/modules/entitlement/catalog-key";
import { PLATFORM_PASS_CODE } from "@/modules/entitlement/offering-types";
import { DomainError } from "@/modules/platform/errors";

type BillingTx = Prisma.TransactionClient;

const PLAN_OFFERING_CODE: Record<string, string> = {
  TRIAL: PLATFORM_PASS_CODE,
  MONTHLY_STANDARD: PLATFORM_PASS_CODE,
  YEARLY_STANDARD: PLATFORM_PASS_CODE,
  YEARLY_FAMILY_PLUS: PLATFORM_PASS_CODE,
};

const LIVE_TICKET_STATUSES = [EntitlementStatus.ACTIVE, EntitlementStatus.GRACE];

export function offeringCodeForPlan(planCode: string): string | null {
  return PLAN_OFFERING_CODE[planCode] ?? null;
}

export function offeringCodeForCourse(courseId: string) {
  return `course-${courseId}`;
}

function isLaterValidUntil(next: Date | null, current: Date | null) {
  if (next === null) {
    return current !== null;
  }

  if (current === null) {
    return false;
  }

  return next.getTime() > current.getTime();
}

export async function grantOfferingInTx(
  tx: BillingTx,
  input: {
    parentId: string;
    offeringCode: string;
    validFrom?: Date;
    validUntil?: Date | null;
    sourcePaymentId?: string | null;
    ensureOffering?: { kind: OfferingKind; catalogKey: string };
  },
) {
  const offering = input.ensureOffering
    ? await tx.offering.upsert({
        where: { code: input.offeringCode },
        update: {},
        create: {
          code: input.offeringCode,
          kind: input.ensureOffering.kind,
          catalogKey: input.ensureOffering.catalogKey,
          active: true,
        },
      })
    : await tx.offering.findUnique({ where: { code: input.offeringCode } });

  if (!offering) {
    throw new DomainError("Offering not found", 404, "OFFERING_NOT_FOUND");
  }

  const live = await tx.entitlement.findFirst({
    where: {
      parentId: input.parentId,
      offeringId: offering.id,
      status: { in: LIVE_TICKET_STATUSES },
    },
  });
  if (offering.active === false && !live) {
    throw new DomainError("Offering is inactive", 409, "OFFERING_INACTIVE");
  }

  if (live) {
    const shouldExtend =
      input.validUntil !== undefined && isLaterValidUntil(input.validUntil, live.validUntil);
    if (!shouldExtend && live.status !== EntitlementStatus.GRACE) {
      return live;
    }

    return tx.entitlement.update({
      where: { id: live.id },
      data: {
        status: EntitlementStatus.ACTIVE,
        ...(shouldExtend ? { validUntil: input.validUntil } : {}),
        sourcePaymentId: input.sourcePaymentId ?? live.sourcePaymentId,
      },
    });
  }

  return tx.entitlement.create({
    data: {
      parentId: input.parentId,
      offeringId: offering.id,
      status: EntitlementStatus.ACTIVE,
      validFrom: input.validFrom ?? new Date(),
      validUntil: input.validUntil ?? null,
      sourcePaymentId: input.sourcePaymentId ?? null,
    },
  });
}

export async function grantPlanOfferingInTx(
  tx: BillingTx,
  input: {
    parentId: string;
    planCode: string;
    validFrom?: Date;
    validUntil?: Date | null;
    sourcePaymentId?: string | null;
  },
) {
  const offeringCode = offeringCodeForPlan(input.planCode);
  if (!offeringCode) {
    return null;
  }

  return grantOfferingInTx(tx, {
    parentId: input.parentId,
    offeringCode,
    validFrom: input.validFrom,
    validUntil: input.validUntil,
    sourcePaymentId: input.sourcePaymentId,
  });
}

export async function grantCourseOfferingInTx(
  tx: BillingTx,
  input: {
    parentId: string;
    courseId: string;
    sourcePaymentId?: string | null;
  },
) {
  return grantOfferingInTx(tx, {
    parentId: input.parentId,
    offeringCode: offeringCodeForCourse(input.courseId),
    validUntil: null,
    sourcePaymentId: input.sourcePaymentId,
    ensureOffering: {
      kind: OfferingKind.ONE_TIME_PROGRAM,
      catalogKey: courseCatalogKey(input.courseId),
    },
  });
}

async function findLivePlanTicket(tx: BillingTx, parentId: string, planCode: string) {
  const offeringCode = PLAN_OFFERING_CODE[planCode];
  if (!offeringCode) {
    return null;
  }

  const offering = await tx.offering.findUnique({ where: { code: offeringCode } });
  if (!offering) {
    return null;
  }

  return tx.entitlement.findFirst({
    where: {
      parentId,
      offeringId: offering.id,
      status: { in: LIVE_TICKET_STATUSES },
    },
  });
}

export async function markPlanOfferingGraceInTx(
  tx: BillingTx,
  input: { parentId: string; planCode: string; validUntil: Date },
) {
  const ticket = await findLivePlanTicket(tx, input.parentId, input.planCode);
  if (!ticket) {
    return null;
  }

  return tx.entitlement.update({
    where: { id: ticket.id },
    data: {
      status: EntitlementStatus.GRACE,
      validUntil: input.validUntil,
    },
  });
}

export async function expirePlanOfferingInTx(
  tx: BillingTx,
  input: { parentId: string; planCode: string },
) {
  const ticket = await findLivePlanTicket(tx, input.parentId, input.planCode);
  if (!ticket) {
    return null;
  }

  return tx.entitlement.update({
    where: { id: ticket.id },
    data: { status: EntitlementStatus.EXPIRED },
  });
}

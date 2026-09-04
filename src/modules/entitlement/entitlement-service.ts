import { EntitlementStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { resolveLessonCatalogKeys, ticketCoversLesson } from "@/modules/entitlement/catalog-key";
import { LIVE_ENTITLEMENT_STATUSES } from "@/modules/entitlement/offering-types";
import { DomainError } from "@/modules/platform/errors";

const MAX_GRANT_RETRIES = 3;
const LIVE_STATUSES: EntitlementStatus[] = [...LIVE_ENTITLEMENT_STATUSES];

function isSerializationFailure(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";
}

function isCurrentlyValid(ticket: { validFrom: Date; validUntil: Date | null }, now: Date) {
  if (ticket.validFrom > now) {
    return false;
  }
  if (ticket.validUntil != null && ticket.validUntil <= now) {
    return false;
  }
  return true;
}

async function runSerializable<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < MAX_GRANT_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(work, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (attempt < MAX_GRANT_RETRIES - 1 && isSerializationFailure(error)) {
        continue;
      }
      throw error;
    }
  }

  throw new DomainError(
    "Could not grant entitlement due to concurrent updates. Please retry.",
    409,
    "ENTITLEMENT_GRANT_RETRY_REQUIRED",
  );
}

export async function grantEntitlement(input: {
  parentId: string;
  offeringId: string;
  validFrom?: Date;
  validUntil?: Date | null;
  sourcePaymentId?: string | null;
  status?: (typeof LIVE_ENTITLEMENT_STATUSES)[number];
}) {
  const validFrom = input.validFrom ?? new Date();
  const status = input.status ?? EntitlementStatus.ACTIVE;

  return runSerializable(async (tx) => {
    const offering = await tx.offering.findUnique({ where: { id: input.offeringId } });
    if (!offering) {
      throw new DomainError("Offering not found", 404, "OFFERING_NOT_FOUND");
    }

    const live = await tx.entitlement.findFirst({
      where: {
        parentId: input.parentId,
        offeringId: input.offeringId,
        status: { in: LIVE_STATUSES },
      },
    });
    if (live) {
      throw new DomainError("Household already has a live ticket for this offering.", 409, "ENTITLEMENT_ALREADY_ACTIVE");
    }

    return tx.entitlement.create({
      data: {
        parentId: input.parentId,
        offeringId: input.offeringId,
        status,
        validFrom,
        validUntil: input.validUntil ?? null,
        sourcePaymentId: input.sourcePaymentId ?? null,
      },
    });
  });
}

export async function expireEntitlement(input: { parentId: string; entitlementId: string }) {
  const row = await prisma.entitlement.findFirst({
    where: { id: input.entitlementId, parentId: input.parentId },
  });
  if (!row) {
    throw new DomainError("Entitlement not found", 404, "ENTITLEMENT_NOT_FOUND");
  }

  return prisma.entitlement.update({
    where: { id: row.id },
    data: { status: EntitlementStatus.EXPIRED },
  });
}

export async function listEntitlements(parentId: string) {
  return prisma.entitlement.findMany({
    where: { parentId },
    include: { offering: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function canAccess(input: { parentId: string; lessonId: string; childId?: string }) {
  if (input.childId) {
    const child = await prisma.childProfile.findFirst({
      where: { id: input.childId, parentId: input.parentId },
      select: { id: true },
    });
    if (!child) {
      return false;
    }
  }

  const lessonKeys = await resolveLessonCatalogKeys(input.lessonId);
  if (lessonKeys.length === 0) {
    return false;
  }

  const now = new Date();
  const tickets = await prisma.entitlement.findMany({
    where: {
      parentId: input.parentId,
      status: { in: LIVE_STATUSES },
    },
    select: {
      validFrom: true,
      validUntil: true,
      offering: {
        select: { catalogKey: true },
      },
    },
  });

  return tickets.some(
    (ticket) => isCurrentlyValid(ticket, now) && ticketCoversLesson(ticket.offering.catalogKey, lessonKeys),
  );
}

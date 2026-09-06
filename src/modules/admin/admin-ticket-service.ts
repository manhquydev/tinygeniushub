import { EntitlementStatus, OfferingKind, PlanCode, Prisma } from "@prisma/client";
import { addDays } from "date-fns";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { listEntitlements } from "@/modules/entitlement/entitlement-service";
import {
  expirePlanOfferingInTx,
  grantOfferingInTx,
} from "@/modules/entitlement/grant-from-billing";
import { PLATFORM_PASS_CODE } from "@/modules/entitlement/offering-types";
import { DomainError } from "@/modules/platform/errors";
import { createAdminActionLog } from "./admin-user-service";

const LIVE_TICKET_STATUSES = [EntitlementStatus.ACTIVE, EntitlementStatus.GRACE];

export const adminTicketActionSchema = z.object({
  offeringCode: z.string().trim().min(1).max(120),
  action: z.enum(["grant", "extend", "expire"]),
  days: z.number().int().min(1).max(3650).optional(),
});

export type AdminHouseholdTicket = {
  id: string;
  offeringCode: string;
  catalogKey: string;
  kind: OfferingKind;
  status: EntitlementStatus;
  validFrom: Date;
  validUntil: Date | null;
};

type EntitlementOfferingRow = {
  id: string;
  status: EntitlementStatus;
  validFrom: Date;
  validUntil: Date | null;
  offering: {
    code: string;
    catalogKey: string;
    kind: OfferingKind;
  };
};

export function mapAdminHouseholdTickets(rows: EntitlementOfferingRow[]): AdminHouseholdTicket[] {
  return rows.map((row) => ({
    id: row.id,
    offeringCode: row.offering.code,
    catalogKey: row.offering.catalogKey,
    kind: row.offering.kind,
    status: row.status,
    validFrom: row.validFrom,
    validUntil: row.validUntil,
  }));
}

export async function listAdminHouseholdTickets(parentId: string) {
  return mapAdminHouseholdTickets(await listEntitlements(parentId));
}

async function expireLiveOfferingInTx(
  tx: Prisma.TransactionClient,
  input: { parentId: string; offeringCode: string },
) {
  if (input.offeringCode === PLATFORM_PASS_CODE) {
    return expirePlanOfferingInTx(tx, {
      parentId: input.parentId,
      planCode: PlanCode.MONTHLY_STANDARD,
    });
  }

  const offering = await tx.offering.findUnique({ where: { code: input.offeringCode } });
  if (!offering) {
    return null;
  }

  const live = await tx.entitlement.findFirst({
    where: {
      parentId: input.parentId,
      offeringId: offering.id,
      status: { in: LIVE_TICKET_STATUSES },
    },
  });
  if (!live) {
    return null;
  }

  return tx.entitlement.update({
    where: { id: live.id },
    data: { status: EntitlementStatus.EXPIRED },
  });
}

export async function updateAdminParentTicket(input: {
  parentId: string;
  offeringCode: string;
  action: "grant" | "extend" | "expire";
  days?: number;
  adminEmail: string;
}) {
  const payload = adminTicketActionSchema.parse({
    offeringCode: input.offeringCode,
    action: input.action,
    days: input.days,
  });

  const parent = await prisma.parentAccount.findUnique({
    where: { id: input.parentId },
    select: { id: true },
  });
  if (!parent) {
    throw new DomainError("Parent account not found", 404, "PARENT_NOT_FOUND");
  }

  const now = new Date();
  const ticket = await prisma.$transaction(async (tx) => {
    const offering = await tx.offering.findUnique({
      where: { code: payload.offeringCode },
    });
    if (!offering) {
      throw new DomainError("Unknown offering code", 400, "UNKNOWN_OFFERING_CODE");
    }

    if (payload.action === "expire") {
      const expired = await expireLiveOfferingInTx(tx, {
        parentId: parent.id,
        offeringCode: payload.offeringCode,
      });
      if (!expired) {
        throw new DomainError("No live ticket to expire", 409, "TICKET_NOT_LIVE");
      }
      return expired;
    }

    if (payload.action === "extend") {
      const live = await tx.entitlement.findFirst({
        where: {
          parentId: parent.id,
          offeringId: offering.id,
          status: { in: LIVE_TICKET_STATUSES },
        },
      });
      if (!live) {
        throw new DomainError("No live ticket to extend", 409, "TICKET_NOT_LIVE");
      }
      const base =
        live.validUntil && live.validUntil.getTime() > now.getTime() ? live.validUntil : now;
      return grantOfferingInTx(tx, {
        parentId: parent.id,
        offeringCode: payload.offeringCode,
        validUntil: addDays(base, payload.days ?? 30),
      });
    }

    return grantOfferingInTx(tx, {
      parentId: parent.id,
      offeringCode: payload.offeringCode,
      ...(payload.days ? { validUntil: addDays(now, payload.days) } : {}),
    });
  });

  await createAdminActionLog({
    adminEmail: input.adminEmail,
    action: "UPDATE_USER_TICKET",
    target: input.parentId,
    detail: {
      action: payload.action,
      offeringCode: payload.offeringCode,
      days: payload.days ?? null,
      ticketId: ticket.id,
      status: ticket.status,
    },
  });

  return ticket;
}

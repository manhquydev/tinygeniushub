import { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DomainError } from "@/modules/platform/errors";
import { z } from "zod";

export {
  adminBulkUsersActionSchema,
  executeAdminBulkUsersAction,
  getAdminActionLogs,
  getAdminUnifiedLogs,
  type AdminUnifiedLogEntry,
} from "./admin-user-ops-service";
export { getAdminParentDetail } from "./admin-parent-detail-service";

export const adminActionLogCreateSchema = z.object({
  action: z.string().trim().min(1).max(100),
  target: z.string().trim().min(1).max(320).optional(),
  detail: z.unknown().optional(),
});


export const createAdminNoteSchema = z.object({
  note: z.string().trim().min(1).max(500),
});

export async function listAdminUsersForExport() {
  const parents = await prisma.parentAccount.findMany({
    orderBy: { createdAt: "desc" },
    take: 10001,
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
      lastActiveAt: true,
      subscription: { select: { status: true } },
      _count: { select: { childProfiles: true } },
    },
  });

  const parentIds = parents.map((parent) => parent.id);
  const successfulPaymentsByParent =
    parentIds.length === 0
      ? []
      : await prisma.paymentRecord.groupBy({
          by: ["parentId"],
          where: {
            parentId: { in: parentIds },
            status: PaymentStatus.SUCCEEDED,
          },
          _count: { parentId: true },
        });

  const successfulPaymentCountByParentId = new Map(
    successfulPaymentsByParent.map((row) => [row.parentId, row._count.parentId]),
  );

  return {
    rows: parents.slice(0, 10000).map((parent) => ({
      id: parent.id,
      email: parent.email,
      displayName: parent.displayName,
      createdAt: parent.createdAt,
      lastActiveAt: parent.lastActiveAt,
      subscriptionStatus: parent.subscription?.status ?? null,
      childrenCount: parent._count.childProfiles,
      successfulPaymentsCount: successfulPaymentCountByParentId.get(parent.id) ?? 0,
    })),
    truncated: parents.length > 10000,
  };
}

export async function createAdminActionLog(input: {
  adminEmail: string;
  action: string;
  target?: string | null;
  detail?: unknown;
}) {
  const payload = adminActionLogCreateSchema.parse({
    action: input.action,
    target: input.target ?? undefined,
    detail: input.detail,
  });
  const detail =
    payload.detail === undefined ? undefined : (payload.detail as Prisma.InputJsonValue);

  return prisma.adminActionLog.create({
    data: {
      adminEmail: input.adminEmail,
      action: payload.action,
      target: payload.target ?? null,
      detail,
    },
    select: {
      id: true,
      adminEmail: true,
      action: true,
      target: true,
      detail: true,
      createdAt: true,
    },
  });
}

export async function getAdminNotes(parentId: string) {
  return prisma.adminNote.findMany({
    where: { parentId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      parentId: true,
      note: true,
      createdAt: true,
      createdBy: true,
    },
  });
}

export async function createAdminNote(input: {
  parentId: string;
  note: string;
  adminEmail: string;
}) {
  const payload = createAdminNoteSchema.parse({ note: input.note });

  const parent = await prisma.parentAccount.findUnique({
    where: { id: input.parentId },
    select: { id: true },
  });

  if (!parent) {
    throw new DomainError("Parent account not found", 404, "PARENT_NOT_FOUND");
  }

  return prisma.adminNote.create({
    data: {
      parentId: input.parentId,
      note: payload.note,
      createdBy: input.adminEmail,
    },
    select: {
      id: true,
      parentId: true,
      note: true,
      createdAt: true,
      createdBy: true,
    },
  });
}

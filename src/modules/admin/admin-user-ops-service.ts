import { z } from "zod";
import { prisma } from "@/lib/db";
import { createNotificationForParent } from "@/modules/platform/notification-service";

export const adminBulkUsersActionSchema = z.object({
  parentIds: z.array(z.string().min(1)).min(1).max(100),
  action: z.enum(["SUSPEND", "ACTIVATE", "SEND_NOTIFICATION"]),
  payload: z
    .object({
      message: z.string().trim().min(1).max(500).optional(),
    })
    .optional(),
});

export async function getAdminActionLogs(limit = 50) {
  const normalizedLimit = Math.min(Math.max(limit, 1), 200);

  return prisma.adminActionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: normalizedLimit,
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

export type AdminUnifiedLogEntry = {
  id: string;
  source: "ADMIN_ACTION" | "AUDIT_LOG";
  actor: string;
  action: string;
  target: string | null;
  detail: unknown;
  createdAt: Date;
};

export async function getAdminUnifiedLogs(limit = 50): Promise<AdminUnifiedLogEntry[]> {
  const normalizedLimit = Math.min(Math.max(limit, 1), 200);

  const [adminActionLogs, auditLogs] = await Promise.all([
    prisma.adminActionLog.findMany({
      orderBy: { createdAt: "desc" },
      take: normalizedLimit,
      select: {
        id: true,
        adminEmail: true,
        action: true,
        target: true,
        detail: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: normalizedLimit,
      select: {
        id: true,
        actorType: true,
        actorId: true,
        action: true,
        resourceType: true,
        resourceId: true,
        metadata: true,
        createdAt: true,
      },
    }),
  ]);

  const normalizedAdminActionLogs: AdminUnifiedLogEntry[] = adminActionLogs.map((entry) => ({
    id: `admin:${entry.id}`,
    source: "ADMIN_ACTION",
    actor: entry.adminEmail,
    action: entry.action,
    target: entry.target,
    detail: entry.detail,
    createdAt: entry.createdAt,
  }));

  const normalizedAuditLogs: AdminUnifiedLogEntry[] = auditLogs.map((entry) => ({
    id: `audit:${entry.id}`,
    source: "AUDIT_LOG",
    actor: entry.actorId ? `${entry.actorType}:${entry.actorId}` : entry.actorType,
    action: entry.action,
    target: entry.resourceId ? `${entry.resourceType}:${entry.resourceId}` : entry.resourceType,
    detail: entry.metadata,
    createdAt: entry.createdAt,
  }));

  return [...normalizedAdminActionLogs, ...normalizedAuditLogs]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, normalizedLimit);
}

export async function executeAdminBulkUsersAction(input: unknown) {
  const payload = adminBulkUsersActionSchema.parse(input);
  const uniqueParentIds = Array.from(new Set(payload.parentIds));

  const parents = await prisma.parentAccount.findMany({
    where: { id: { in: uniqueParentIds } },
    select: { id: true, email: true, displayName: true },
  });

  const parentById = new Map(parents.map((parent) => [parent.id, parent]));
  let succeeded = 0;
  let failed = 0;

  if (payload.action === "SUSPEND" || payload.action === "ACTIVATE") {
    if (parents.length > 0) {
      const updateResult = await prisma.parentAccount.updateMany({
        where: { id: { in: parents.map((parent) => parent.id) } },
        data: { suspended: payload.action === "SUSPEND" },
      });
      succeeded = updateResult.count;
    }

    failed = uniqueParentIds.length - succeeded;
    return { succeeded, failed };
  }

  const message =
    payload.payload?.message ?? "Parents please check for new updates in the dashboard.";

  const results = await Promise.all(
    uniqueParentIds.map(async (parentId) => {
      const parent = parentById.get(parentId);
      if (!parent) return false;
      const notification = await createNotificationForParent({
        parentId: parent.id,
        parentEmail: parent.email,
        notification: {
          type: "TIP",
          title: "Notice from admin",
          message,
          href: "/parent/dashboard",
        },
      });
      return !!notification;
    }),
  );

  succeeded = results.filter(Boolean).length;
  failed = results.filter((result) => !result).length;

  return { succeeded, failed };
}

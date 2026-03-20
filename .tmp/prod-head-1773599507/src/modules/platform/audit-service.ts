import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function createAuditLog(input: {
  dbClient?: Prisma.TransactionClient | typeof prisma;
  actorType: string;
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  const db = input.dbClient ?? prisma;

  return db.auditLog.create({
    data: {
      actorType: input.actorType,
      actorId: input.actorId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata,
    },
  });
}

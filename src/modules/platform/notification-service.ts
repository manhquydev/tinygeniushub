import { Prisma, type NotificationType } from "@prisma/client";
import { prisma } from "@/lib/db";

type DbClient = Prisma.TransactionClient | typeof prisma;

export type NotificationPayload = {
  type: NotificationType;
  title: string;
  message: string;
  href: string;
  read?: boolean;
};

export async function resolveUserIdForParent(input: {
  parentId: string;
  parentEmail: string;
  dbClient?: DbClient;
}) {
  const db = input.dbClient ?? prisma;

  const user = await db.user.findFirst({
    where: {
      OR: [
        { parentId: input.parentId },
        {
          email: {
            equals: input.parentEmail,
            mode: "insensitive",
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  return user?.id ?? null;
}

export async function createNotification(
  userId: string,
  data: NotificationPayload,
  dbClient?: DbClient,
) {
  const db = dbClient ?? prisma;

  return db.notification.create({
    data: {
      userId,
      type: data.type,
      title: data.title,
      message: data.message,
      href: data.href,
      read: data.read ?? false,
    },
  });
}

export async function createNotificationForParent(input: {
  parentId: string;
  parentEmail: string;
  notification: NotificationPayload;
  dbClient?: DbClient;
}) {
  const db = input.dbClient ?? prisma;
  const userId = await resolveUserIdForParent({
    parentId: input.parentId,
    parentEmail: input.parentEmail,
    dbClient: db,
  });

  if (!userId) {
    return null;
  }

  return createNotification(userId, input.notification, db);
}


import { PaymentStatus, Prisma } from "@prisma/client";
import { subDays } from "date-fns";
import { prisma } from "@/lib/db";
import { createNotificationForParent, resolveUserIdForParent } from "@/modules/platform/notification-service";
import { DomainError } from "@/modules/platform/errors";
import { z } from "zod";

export const adminUserSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(320),
  limit: z.coerce.number().int().min(1).max(20).default(20),
});

export const adminActionLogCreateSchema = z.object({
  action: z.string().trim().min(1).max(100),
  target: z.string().trim().min(1).max(320).optional(),
  detail: z.unknown().optional(),
});

export const adminBulkUsersActionSchema = z.object({
  parentIds: z.array(z.string().min(1)).min(1).max(100),
  action: z.enum(["SUSPEND", "ACTIVATE", "SEND_NOTIFICATION"]),
  payload: z
    .object({
      message: z.string().trim().min(1).max(500).optional(),
    })
    .optional(),
});

export const createAdminNoteSchema = z.object({
  note: z.string().trim().min(1).max(500),
});

export async function listAdminUsersForExport() {
  const parents = await prisma.parentAccount.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: 10001,
    select: {
      id: true,
      email: true,
      displayName: true,
      createdAt: true,
      lastActiveAt: true,
      subscription: {
        select: {
          status: true,
        },
      },
      _count: {
        select: {
          childProfiles: true,
        },
      },
    },
  });

  const parentIds = parents.map((parent) => parent.id);
  const successfulPaymentsByParent =
    parentIds.length === 0
      ? []
      : await prisma.paymentRecord.groupBy({
          by: ["parentId"],
          where: {
            parentId: {
              in: parentIds,
            },
            status: PaymentStatus.SUCCEEDED,
          },
          _count: {
            parentId: true,
          },
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

export async function getAdminActionLogs(limit = 50) {
  const normalizedLimit = Math.min(Math.max(limit, 1), 200);

  return prisma.adminActionLog.findMany({
    orderBy: {
      createdAt: "desc",
    },
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

export async function executeAdminBulkUsersAction(input: unknown) {
  const payload = adminBulkUsersActionSchema.parse(input);
  const uniqueParentIds = Array.from(new Set(payload.parentIds));

  const parents = await prisma.parentAccount.findMany({
    where: {
      id: {
        in: uniqueParentIds,
      },
    },
    select: {
      id: true,
      email: true,
      displayName: true,
    },
  });

  const parentById = new Map(parents.map((parent) => [parent.id, parent]));
  let succeeded = 0;
  let failed = 0;

  if (payload.action === "SUSPEND" || payload.action === "ACTIVATE") {
    if (parents.length > 0) {
      const updateResult = await prisma.parentAccount.updateMany({
        where: {
          id: {
            in: parents.map((parent) => parent.id),
          },
        },
        data: {
          suspended: payload.action === "SUSPEND",
        },
      });
      succeeded = updateResult.count;
    }

    failed = uniqueParentIds.length - succeeded;
    return { succeeded, failed };
  }

  const message =
    payload.payload?.message ??
    "Phá»¥ huynh vui lÃ²ng kiá»ƒm tra cáº­p nháº­t má»›i trong báº£ng Ä‘iá»u khiá»ƒn.";

  for (const parentId of uniqueParentIds) {
    const parent = parentById.get(parentId);
    if (!parent) {
      failed += 1;
      continue;
    }

    const notification = await createNotificationForParent({
      parentId: parent.id,
      parentEmail: parent.email,
      notification: {
        type: "TIP",
        title: "ThÃ´ng bÃ¡o tá»« quáº£n trá»‹ viÃªn",
        message,
        href: "/parent/dashboard",
      },
    });

    if (notification) {
      succeeded += 1;
    } else {
      failed += 1;
    }
  }

  return { succeeded, failed };
}

export async function searchAdminUsersByEmail(input: unknown) {
  const query = adminUserSearchQuerySchema.parse(input);

  const parents = await prisma.parentAccount.findMany({
    where: {
      email: {
        contains: query.q,
        mode: "insensitive",
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: query.limit,
    select: {
      id: true,
      email: true,
      displayName: true,
      suspended: true,
      createdAt: true,
      subscription: {
        select: {
          status: true,
        },
      },
      childProfiles: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          nickname: true,
        },
      },
      _count: {
        select: {
          payments: {
            where: {
              status: PaymentStatus.SUCCEEDED,
            },
          },
        },
      },
    },
  });

  return parents.map((parent) => ({
    id: parent.id,
    email: parent.email,
    displayName: parent.displayName,
    suspended: parent.suspended,
    createdAt: parent.createdAt,
    subscription: {
      status: parent.subscription?.status ?? null,
    },
    childProfiles: {
      count: parent.childProfiles.length,
      nicknames: parent.childProfiles.map((childProfile) => childProfile.nickname),
    },
    successfulPaymentsCount: parent._count.payments,
  }));
}

export async function getAdminNotes(parentId: string) {
  return prisma.adminNote.findMany({
    where: {
      parentId,
    },
    orderBy: {
      createdAt: "desc",
    },
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
    where: {
      id: input.parentId,
    },
    select: {
      id: true,
    },
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

function readStringFromUnknownRecord(input: unknown, key: string) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  const value = (input as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

export async function getAdminParentDetail(parentId: string) {
  const since30d = subDays(new Date(), 30);

  const parent = await prisma.parentAccount.findUnique({
    where: { id: parentId },
    select: {
      id: true,
      email: true,
      displayName: true,
      suspended: true,
      createdAt: true,
      lastActiveAt: true,
      subscription: {
        select: {
          id: true,
          planCode: true,
          status: true,
          childProfileLimit: true,
          caregiverLimit: true,
          currentPeriodStart: true,
          currentPeriodEnd: true,
          autoRenew: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      childProfiles: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          nickname: true,
          createdAt: true,
        },
      },
    },
  });

  if (!parent) {
    throw new DomainError("Parent account not found", 404, "PARENT_NOT_FOUND");
  }

  const [lessonCounts30dByChildRows, paymentHistory, subscriptionHistoryRaw, caregiverInvites, userId] =
    await Promise.all([
      prisma.lessonCompletion.groupBy({
        by: ["childId"],
        where: {
          child: {
            parentId: parent.id,
          },
          completedAt: {
            gte: since30d,
          },
        },
        _count: { childId: true },
      }),
      prisma.paymentRecord.findMany({
        where: {
          parentId: parent.id,
        },
        orderBy: {
          processedAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          provider: true,
          providerTransactionId: true,
          amountVnd: true,
          currency: true,
          status: true,
          processedAt: true,
        },
      }),
      prisma.paymentRecord.findMany({
        where: {
          parentId: parent.id,
        },
        orderBy: {
          processedAt: "desc",
        },
        select: {
          id: true,
          provider: true,
          providerTransactionId: true,
          amountVnd: true,
          status: true,
          processedAt: true,
          rawPayload: true,
          subscription: {
            select: {
              id: true,
              planCode: true,
              status: true,
              currentPeriodStart: true,
              currentPeriodEnd: true,
              autoRenew: true,
            },
          },
        },
      }),
      prisma.caregiverInvite.findMany({
        where: {
          parentId: parent.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          email: true,
          accepted: true,
          createdAt: true,
          expiresAt: true,
        },
      }),
      resolveUserIdForParent({
        parentId: parent.id,
        parentEmail: parent.email,
      }),
    ]);

  const lessonCount30dByChildId = new Map(
    lessonCounts30dByChildRows.map((row) => [row.childId, row._count.childId]),
  );
  const notificationCount = userId
    ? await prisma.notification.count({
        where: {
          userId,
        },
      })
    : 0;

  const subscriptionHistory = subscriptionHistoryRaw.map((record) => {
    const planCode = readStringFromUnknownRecord(record.rawPayload, "planCode");
    const eventType = readStringFromUnknownRecord(record.rawPayload, "eventType");
    return {
      id: record.id,
      provider: record.provider,
      providerTransactionId: record.providerTransactionId,
      amountVnd: record.amountVnd,
      status: record.status,
      processedAt: record.processedAt,
      planCode,
      eventType,
      subscription: record.subscription,
    };
  });

  return {
    parent: {
      id: parent.id,
      email: parent.email,
      displayName: parent.displayName,
      suspended: parent.suspended,
      createdAt: parent.createdAt,
      lastActiveAt: parent.lastActiveAt,
      notificationCount,
    },
    currentSubscription: parent.subscription,
    subscriptionHistory,
    children: parent.childProfiles.map((childProfile) => ({
      id: childProfile.id,
      nickname: childProfile.nickname,
      createdAt: childProfile.createdAt,
      lessonsCompleted30d: lessonCount30dByChildId.get(childProfile.id) ?? 0,
    })),
    paymentHistory,
    caregiverInvites,
  };
}


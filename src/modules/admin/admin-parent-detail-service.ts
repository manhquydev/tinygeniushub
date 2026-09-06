import { subDays } from "date-fns";
import { prisma } from "@/lib/db";
import { listEntitlements } from "@/modules/entitlement/entitlement-service";
import { resolveUserIdForParent } from "@/modules/platform/notification-service";
import { DomainError } from "@/modules/platform/errors";

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
        orderBy: { createdAt: "asc" },
        select: { id: true, nickname: true, createdAt: true },
      },
    },
  });

  if (!parent) {
    throw new DomainError("Parent account not found", 404, "PARENT_NOT_FOUND");
  }

  const [lessonCounts30dByChildRows, allPaymentRecords, caregiverInvites, userId, entitlementRows] =
    await Promise.all([
      prisma.lessonCompletion.groupBy({
        by: ["childId"],
        where: {
          child: { parentId: parent.id },
          completedAt: { gte: since30d },
        },
        _count: { childId: true },
      }),
      prisma.paymentRecord.findMany({
        where: { parentId: parent.id },
        orderBy: { processedAt: "desc" },
        take: 50,
        select: {
          id: true,
          provider: true,
          providerTransactionId: true,
          amountVnd: true,
          currency: true,
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
        where: { parentId: parent.id },
        orderBy: { createdAt: "desc" },
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
      listEntitlements(parent.id),
    ]);

  const lessonCount30dByChildId = new Map(
    lessonCounts30dByChildRows.map((row) => [row.childId, row._count.childId]),
  );
  const notificationCount = userId
    ? await prisma.notification.count({ where: { userId } })
    : 0;

  const paymentHistory = allPaymentRecords.slice(0, 10).map((record) => ({
    id: record.id,
    provider: record.provider,
    providerTransactionId: record.providerTransactionId,
    amountVnd: record.amountVnd,
    currency: record.currency,
    status: record.status,
    processedAt: record.processedAt,
  }));

  const subscriptionHistory = allPaymentRecords.map((record) => {
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
    entitlements: entitlementRows.map((row) => ({
      offeringCode: row.offering.code,
      catalogKey: row.offering.catalogKey,
      kind: row.offering.kind,
      status: row.status,
      validFrom: row.validFrom,
      validUntil: row.validUntil,
    })),
  };
}

import { PaymentStatus, Prisma, SubscriptionStatus, WebhookStatus } from "@prisma/client";
import { differenceInCalendarDays, subDays } from "date-fns";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/modules/platform/audit-service";
import { createNotificationForParent, resolveUserIdForParent } from "@/modules/platform/notification-service";
import { DomainError } from "@/modules/platform/errors";
import { z } from "zod";

type CountByStatus = Record<string, number>;

function toStatusMap(input: Array<{ status: string; _count: { _all: number } }>): CountByStatus {
  return input.reduce<CountByStatus>((acc, item) => {
    acc[item.status] = item._count._all;
    return acc;
  }, {});
}

export const adminPaymentQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(PaymentStatus).optional(),
});

export const adminWebhookQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(WebhookStatus).optional(),
});

export const adminLessonTrialFlagSchema = z.object({
  trialEnabled: z.boolean(),
});

export const adminUserSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(320),
  limit: z.coerce.number().int().min(1).max(20).default(20),
});

export const adminPaymentExportQuerySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  status: z.union([z.literal("ALL"), z.nativeEnum(PaymentStatus)]).default("ALL"),
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

const announcementTypeSchema = z.enum(["INFO", "WARNING", "SUCCESS"]);

export const createAnnouncementSchema = z.object({
  message: z.string().trim().min(1).max(200),
  type: announcementTypeSchema.default("INFO"),
  scheduledAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
});

export const updateAnnouncementSchema = z.object({
  active: z.boolean().optional(),
});

export const updateFeatureFlagSchema = z.object({
  enabled: z.boolean(),
});

export const createCouponSchema = z.object({
  code: z.string().trim().min(3).max(64),
  discountPercent: z.coerce.number().int().min(5).max(100),
  maxUses: z
    .union([z.coerce.number().int().min(1), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value === "" || value === null || value === undefined ? null : value)),
  expiresAt: z
    .union([z.coerce.date(), z.literal(""), z.null(), z.undefined()])
    .transform((value) => (value === "" || value === null || value === undefined ? null : value)),
});

export const validateCouponSchema = z.object({
  code: z.string().trim().min(3).max(64),
});

export type AdminLearningAnalytics = {
  activeChildrenLast7d: number;
  activeChildrenLast30d: number;
  totalLessonsCompleted30d: number;
  avgMinutesPerChildPerDay: number;
  topLessons: Array<{
    lessonId: string;
    title: string;
    completionCount: number;
  }>;
  streakDistribution: {
    zero: number;
    low: number;
    medium: number;
    high: number;
  };
};

export type AdminRetentionAnalytics = {
  newParents7d: number;
  newParents30d: number;
  churned30d: number;
  retentionRate: number;
  avgDaysToFirstLesson: number;
  avgLessonsPerChildPerWeek: number;
};

const defaultFeatureFlags = [
  {
    key: "PARENT_V2_DASHBOARD",
    description: "Dashboard phá»¥ huynh phiÃªn báº£n má»›i",
  },
  {
    key: "BETA_LESSON_EDITOR",
    description: "TrÃ¬nh soáº¡n ná»™i dung beta",
  },
  {
    key: "CAREGIVER_VIDEO_CALL",
    description: "TÃ­nh nÄƒng video call ngÆ°á»i chÄƒm sÃ³c (sáº¯p ra máº¯t)",
  },
  {
    key: "REFERRAL_V2",
    description: "Há»‡ thá»‘ng giá»›i thiá»‡u v2",
  },
  {
    key: "AI_LESSON_SUGGESTIONS",
    description: "Gá»£i Ã½ bÃ i há»c báº±ng AI (sáº¯p ra máº¯t)",
  },
] as const;

function normalizeCouponCode(code: string) {
  return code.trim().toUpperCase();
}

function assertCouponCodeFormat(code: string) {
  if (!/^[A-Z0-9_-]{3,64}$/.test(code)) {
    throw new DomainError(
      "MÃ£ giáº£m giÃ¡ chá»‰ gá»“m chá»¯ in hoa, sá»‘, dáº¥u gáº¡ch ngang hoáº·c gáº¡ch dÆ°á»›i.",
      400,
      "INVALID_COUPON_CODE",
    );
  }
}

async function ensureDefaultFeatureFlags() {
  await prisma.$transaction(
    defaultFeatureFlags.map((flag) =>
      prisma.featureFlag.upsert({
        where: {
          key: flag.key,
        },
        create: {
          key: flag.key,
          enabled: false,
          description: flag.description,
          updatedBy: "system",
        },
        update: {
          description: flag.description,
        },
      }),
    ),
  );
}

export async function getAdminOverview() {
  const since30d = subDays(new Date(), 30);

  const [
    parentsCount,
    childrenCount,
    subscriptionsByStatusRaw,
    payments30d,
    webhooksByStatusRaw,
    recentPayments,
    recentWebhookEvents,
    referralCodesCount,
    referralAttributionsCount,
    paidReferralsCount,
    rewardedReferralsCount,
  ] = await Promise.all([
    prisma.parentAccount.count(),
    prisma.childProfile.count(),
    prisma.subscription.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.paymentRecord.aggregate({
      where: {
        processedAt: { gte: since30d },
        status: PaymentStatus.SUCCEEDED,
      },
      _count: { _all: true },
      _sum: { amountVnd: true },
    }),
    prisma.webhookEvent.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.paymentRecord.findMany({
      orderBy: { processedAt: "desc" },
      take: 8,
      select: {
        id: true,
        provider: true,
        providerTransactionId: true,
        amountVnd: true,
        status: true,
        processedAt: true,
        parent: {
          select: {
            email: true,
          },
        },
      },
    }),
    prisma.webhookEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        provider: true,
        eventId: true,
        status: true,
        signatureValid: true,
        processedAt: true,
        createdAt: true,
      },
    }),
    prisma.referralCode.count(),
    prisma.referralAttribution.count(),
    prisma.referralAttribution.count({
      where: {
        paidAt: { not: null },
      },
    }),
    prisma.referralAttribution.count({
      where: {
        rewardGranted: true,
      },
    }),
  ]);

  return {
    counts: {
      parents: parentsCount,
      children: childrenCount,
      successfulPayments30d: payments30d._count._all,
      successfulRevenueVnd30d: payments30d._sum.amountVnd ?? 0,
      referralCodes: referralCodesCount,
      referralAttributions: referralAttributionsCount,
      paidReferrals: paidReferralsCount,
      rewardedReferrals: rewardedReferralsCount,
    },
    subscriptionsByStatus: toStatusMap(
      subscriptionsByStatusRaw.map((item) => ({ status: item.status, _count: item._count })),
    ),
    webhooksByStatus: toStatusMap(
      webhooksByStatusRaw.map((item) => ({ status: item.status, _count: item._count })),
    ),
    recentPayments,
    recentWebhookEvents,
  };
}

export async function getAdminLearningAnalytics(): Promise<AdminLearningAnalytics> {
  const since7d = subDays(new Date(), 7);
  const since30d = subDays(new Date(), 30);

  const [
    totalChildren,
    activeChildren7d,
    activeChildren30d,
    completedLessons30dAggregate,
    topLessonCompletionRows,
    progressStates,
  ] = await Promise.all([
    prisma.childProfile.count(),
    prisma.lessonCompletion.groupBy({
      by: ["childId"],
      where: {
        completedAt: { gte: since7d },
      },
    }),
    prisma.lessonCompletion.groupBy({
      by: ["childId"],
      where: {
        completedAt: { gte: since30d },
      },
    }),
    prisma.lessonCompletion.aggregate({
      where: {
        completedAt: { gte: since30d },
      },
      _count: { _all: true },
      _sum: { minutesLearned: true },
    }),
    prisma.lessonCompletion.groupBy({
      by: ["lessonId"],
      where: {
        completedAt: { gte: since30d },
      },
      _count: { lessonId: true },
      orderBy: [{ _count: { lessonId: "desc" } }, { lessonId: "asc" }],
      take: 10,
    }),
    prisma.progressState.findMany({
      select: {
        childId: true,
        streakCount: true,
      },
    }),
  ]);

  const topLessonIds = topLessonCompletionRows.map((row) => row.lessonId);
  const topLessonTitleRows =
    topLessonIds.length === 0
      ? []
      : await prisma.lesson.findMany({
          where: {
            id: { in: topLessonIds },
          },
          select: {
            id: true,
            title: true,
          },
        });

  const titleByLessonId = new Map(topLessonTitleRows.map((lesson) => [lesson.id, lesson.title]));
  const topLessons = topLessonCompletionRows.map((row) => ({
    lessonId: row.lessonId,
    title: titleByLessonId.get(row.lessonId) ?? "Unknown lesson",
    completionCount: row._count.lessonId,
  }));

  const maxStreakByChild = new Map<string, number>();
  for (const progressState of progressStates) {
    const existingMax = maxStreakByChild.get(progressState.childId) ?? 0;
    if (progressState.streakCount > existingMax) {
      maxStreakByChild.set(progressState.childId, progressState.streakCount);
    }
  }

  let zero = Math.max(totalChildren - maxStreakByChild.size, 0);
  let low = 0;
  let medium = 0;
  let high = 0;

  for (const streakCount of maxStreakByChild.values()) {
    if (streakCount <= 0) {
      zero += 1;
      continue;
    }

    if (streakCount <= 3) {
      low += 1;
      continue;
    }

    if (streakCount <= 7) {
      medium += 1;
      continue;
    }

    high += 1;
  }

  const totalMinutes30d = completedLessons30dAggregate._sum.minutesLearned ?? 0;
  const averageMinutesPerChildPerDay =
    totalChildren > 0 ? Number((totalMinutes30d / totalChildren / 30).toFixed(2)) : 0;

  return {
    activeChildrenLast7d: activeChildren7d.length,
    activeChildrenLast30d: activeChildren30d.length,
    totalLessonsCompleted30d: completedLessons30dAggregate._count._all,
    avgMinutesPerChildPerDay: averageMinutesPerChildPerDay,
    topLessons,
    streakDistribution: {
      zero,
      low,
      medium,
      high,
    },
  };
}

export async function getAdminRetentionAnalytics(): Promise<AdminRetentionAnalytics> {
  const since7d = subDays(new Date(), 7);
  const since30d = subDays(new Date(), 30);

  const [newParents7d, newParents30d, churned30d, activeSubscriptionCount, totalSubscriptionCount, childrenCount, lessons30dCount] =
    await Promise.all([
      prisma.parentAccount.count({
        where: {
          createdAt: {
            gte: since7d,
          },
        },
      }),
      prisma.parentAccount.count({
        where: {
          createdAt: {
            gte: since30d,
          },
        },
      }),
      prisma.subscription.count({
        where: {
          status: SubscriptionStatus.CANCELED_AT_PERIOD_END,
          updatedAt: {
            gte: since30d,
          },
        },
      }),
      prisma.subscription.count({
        where: {
          status: {
            in: [
              SubscriptionStatus.TRIALING,
              SubscriptionStatus.ACTIVE_STANDARD,
              SubscriptionStatus.ACTIVE_FAMILYPLUS,
              SubscriptionStatus.GRACE,
            ],
          },
        },
      }),
      prisma.subscription.count(),
      prisma.childProfile.count(),
      prisma.lessonCompletion.count({
        where: {
          completedAt: {
            gte: since30d,
          },
        },
      }),
    ]);

  const firstCompletions = await prisma.lessonCompletion.groupBy({
    by: ["childId"],
    _min: {
      completedAt: true,
    },
  });

  const firstCompletionChildIds = firstCompletions.map((item) => item.childId);
  const childRows =
    firstCompletionChildIds.length === 0
      ? []
      : await prisma.childProfile.findMany({
          where: {
            id: {
              in: firstCompletionChildIds,
            },
          },
          select: {
            id: true,
            createdAt: true,
          },
        });

  const childCreatedAtById = new Map(childRows.map((child) => [child.id, child.createdAt]));
  const daysToFirstLesson: number[] = [];

  for (const completion of firstCompletions) {
    if (!completion._min.completedAt) {
      continue;
    }

    const childCreatedAt = childCreatedAtById.get(completion.childId);
    if (!childCreatedAt) {
      continue;
    }

    daysToFirstLesson.push(
      Math.max(0, differenceInCalendarDays(completion._min.completedAt, childCreatedAt)),
    );
  }

  const avgDaysToFirstLesson =
    daysToFirstLesson.length > 0
      ? Number(
          (daysToFirstLesson.reduce((sum, current) => sum + current, 0) / daysToFirstLesson.length).toFixed(1),
        )
      : 0;

  const retentionRate =
    totalSubscriptionCount > 0 ? Number(((activeSubscriptionCount / totalSubscriptionCount) * 100).toFixed(1)) : 0;
  const avgLessonsPerChildPerWeek =
    childrenCount > 0 ? Number((lessons30dCount / childrenCount / (30 / 7)).toFixed(2)) : 0;

  return {
    newParents7d,
    newParents30d,
    churned30d,
    retentionRate,
    avgDaysToFirstLesson,
    avgLessonsPerChildPerWeek,
  };
}

export async function getActiveAnnouncement() {
  const now = new Date();
  return prisma.systemAnnouncement.findFirst({
    where: {
      active: true,
      AND: [
        {
          OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
        },
        {
          OR: [{ endsAt: null }, { endsAt: { gt: now } }],
        },
      ],
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      message: true,
      type: true,
      active: true,
      scheduledAt: true,
      endsAt: true,
      createdAt: true,
      createdBy: true,
    },
  });
}

export async function listSystemAnnouncements(limit = 5) {
  const normalizedLimit = Math.min(Math.max(limit, 1), 50);
  return prisma.systemAnnouncement.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: normalizedLimit,
    select: {
      id: true,
      message: true,
      type: true,
      active: true,
      scheduledAt: true,
      endsAt: true,
      createdAt: true,
      createdBy: true,
    },
  });
}

export async function createAnnouncement(params: {
  message: string;
  type?: "INFO" | "WARNING" | "SUCCESS";
  scheduledAt?: Date | null;
  endsAt?: Date | null;
  adminEmail: string;
}) {
  const payload = createAnnouncementSchema.parse({
    message: params.message,
    type: params.type ?? "INFO",
    scheduledAt: params.scheduledAt ?? null,
    endsAt: params.endsAt ?? null,
  });

  if (payload.endsAt && payload.endsAt <= new Date()) {
    throw new DomainError("Thá»i gian káº¿t thÃºc pháº£i á»Ÿ tÆ°Æ¡ng lai.", 400, "INVALID_ANNOUNCEMENT_ENDS_AT");
  }

  if (payload.scheduledAt && payload.endsAt && payload.scheduledAt >= payload.endsAt) {
    throw new DomainError(
      "Thời gian lập lịch phải sớm hơn thời gian kết thúc.",
      400,
      "INVALID_ANNOUNCEMENT_SCHEDULE",
    );
  }

  return prisma.$transaction(async (tx) => {
    await tx.systemAnnouncement.updateMany({
      where: {
        active: true,
      },
      data: {
        active: false,
      },
    });

    return tx.systemAnnouncement.create({
      data: {
        message: payload.message,
        type: payload.type,
        scheduledAt: payload.scheduledAt ?? null,
        endsAt: payload.endsAt ?? null,
        active: true,
        createdBy: params.adminEmail,
      },
      select: {
        id: true,
        message: true,
        type: true,
        active: true,
        scheduledAt: true,
        endsAt: true,
        createdAt: true,
        createdBy: true,
      },
    });
  });
}

export async function updateAnnouncementActive(params: {
  id: string;
  active?: boolean;
}) {
  const payload = updateAnnouncementSchema.parse({
    active: params.active,
  });

  const current = await prisma.systemAnnouncement.findUnique({
    where: {
      id: params.id,
    },
    select: {
      id: true,
      active: true,
    },
  });

  if (!current) {
    throw new DomainError("KhÃ´ng tÃ¬m tháº¥y thÃ´ng bÃ¡o há»‡ thá»‘ng.", 404, "ANNOUNCEMENT_NOT_FOUND");
  }

  const nextActive = payload.active ?? !current.active;

  return prisma.$transaction(async (tx) => {
    if (nextActive) {
      await tx.systemAnnouncement.updateMany({
        where: {
          id: {
            not: params.id,
          },
          active: true,
        },
        data: {
          active: false,
        },
      });
    }

    return tx.systemAnnouncement.update({
      where: {
        id: params.id,
      },
      data: {
        active: nextActive,
      },
      select: {
        id: true,
        message: true,
        type: true,
        active: true,
        scheduledAt: true,
        endsAt: true,
        createdAt: true,
        createdBy: true,
      },
    });
  });
}

export async function deactivateAnnouncement(id: string) {
  return updateAnnouncementActive({ id, active: false });
}

export async function getAllFeatureFlags() {
  await ensureDefaultFeatureFlags();

  return prisma.featureFlag.findMany({
    orderBy: {
      key: "asc",
    },
    select: {
      key: true,
      enabled: true,
      description: true,
      updatedAt: true,
      updatedBy: true,
    },
  });
}

export async function updateFeatureFlag(params: {
  key: string;
  enabled: boolean;
  adminEmail: string;
}) {
  await ensureDefaultFeatureFlags();

  const payload = updateFeatureFlagSchema.parse({
    enabled: params.enabled,
  });

  const existing = await prisma.featureFlag.findUnique({
    where: {
      key: params.key,
    },
    select: {
      key: true,
    },
  });

  if (!existing) {
    throw new DomainError("KhÃ´ng tÃ¬m tháº¥y feature flag.", 404, "FEATURE_FLAG_NOT_FOUND");
  }

  return prisma.featureFlag.update({
    where: {
      key: params.key,
    },
    data: {
      enabled: payload.enabled,
      updatedBy: params.adminEmail,
    },
    select: {
      key: true,
      enabled: true,
      description: true,
      updatedAt: true,
      updatedBy: true,
    },
  });
}

export async function listCoupons(limit = 100) {
  const normalizedLimit = Math.min(Math.max(limit, 1), 500);
  return prisma.couponCode.findMany({
    orderBy: {
      createdAt: "desc",
    },
    take: normalizedLimit,
    select: {
      id: true,
      code: true,
      discountPercent: true,
      maxUses: true,
      usedCount: true,
      active: true,
      expiresAt: true,
      createdAt: true,
      createdBy: true,
    },
  });
}

export async function createCoupon(
  input: {
    code: string;
    discountPercent: number;
    maxUses?: number | null;
    expiresAt?: Date | null;
  },
  adminEmail: string,
) {
  const payload = createCouponSchema.parse(input);
  const normalizedCode = normalizeCouponCode(payload.code);
  assertCouponCodeFormat(normalizedCode);

  if (payload.expiresAt && payload.expiresAt <= new Date()) {
    throw new DomainError("Thá»i gian háº¿t háº¡n pháº£i á»Ÿ tÆ°Æ¡ng lai.", 400, "INVALID_COUPON_EXPIRES_AT");
  }

  return prisma.couponCode.create({
    data: {
      code: normalizedCode,
      discountPercent: payload.discountPercent,
      maxUses: payload.maxUses,
      expiresAt: payload.expiresAt,
      createdBy: adminEmail,
      active: true,
    },
    select: {
      id: true,
      code: true,
      discountPercent: true,
      maxUses: true,
      usedCount: true,
      active: true,
      expiresAt: true,
      createdAt: true,
      createdBy: true,
    },
  });
}

export async function toggleCoupon(id: string) {
  const existing = await prisma.couponCode.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      active: true,
    },
  });

  if (!existing) {
    throw new DomainError("KhÃ´ng tÃ¬m tháº¥y mÃ£ giáº£m giÃ¡.", 404, "COUPON_NOT_FOUND");
  }

  return prisma.couponCode.update({
    where: {
      id,
    },
    data: {
      active: !existing.active,
    },
    select: {
      id: true,
      code: true,
      discountPercent: true,
      maxUses: true,
      usedCount: true,
      active: true,
      expiresAt: true,
      createdAt: true,
      createdBy: true,
    },
  });
}

export async function validateCoupon(codeInput: string) {
  const payload = validateCouponSchema.parse({
    code: codeInput,
  });

  const code = normalizeCouponCode(payload.code);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const coupon = await tx.couponCode.findUnique({
      where: {
        code,
      },
      select: {
        id: true,
        discountPercent: true,
        maxUses: true,
        usedCount: true,
        active: true,
        expiresAt: true,
      },
    });

    if (!coupon) {
      return { valid: false, message: "MÃ£ giáº£m giÃ¡ khÃ´ng tá»“n táº¡i." };
    }

    if (!coupon.active) {
      return { valid: false, message: "MÃ£ giáº£m giÃ¡ Ä‘Ã£ táº¡m ngÆ°ng." };
    }

    if (coupon.expiresAt && coupon.expiresAt <= now) {
      return { valid: false, message: "MÃ£ giáº£m giÃ¡ Ä‘Ã£ háº¿t háº¡n." };
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return { valid: false, message: "MÃ£ giáº£m giÃ¡ Ä‘Ã£ háº¿t lÆ°á»£t sá»­ dá»¥ng." };
    }

    if (coupon.maxUses !== null) {
      const updateResult = await tx.couponCode.updateMany({
        where: {
          id: coupon.id,
          usedCount: {
            lt: coupon.maxUses,
          },
        },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });

      if (updateResult.count === 0) {
        return { valid: false, message: "MÃ£ giáº£m giÃ¡ Ä‘Ã£ háº¿t lÆ°á»£t sá»­ dá»¥ng." };
      }
    } else {
      await tx.couponCode.update({
        where: {
          id: coupon.id,
        },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });
    }

    return {
      valid: true,
      discountPercent: coupon.discountPercent,
    };
  });
}

export async function listAdminPaymentsForExport(input: unknown) {
  const query = adminPaymentExportQuerySchema.parse(input);
  const maxRangeMs = 90 * 24 * 60 * 60 * 1000;

  if (query.from >= query.to) {
    throw new DomainError("`from` must be before `to`", 400, "INVALID_DATE_RANGE");
  }

  if (query.to.getTime() - query.from.getTime() > maxRangeMs) {
    throw new DomainError("Date range cannot exceed 90 days", 400, "DATE_RANGE_TOO_LARGE");
  }

  const records = await prisma.paymentRecord.findMany({
    where: {
      processedAt: {
        gte: query.from,
        lte: query.to,
      },
      ...(query.status !== "ALL"
        ? {
            status: query.status,
          }
        : {}),
    },
    orderBy: {
      processedAt: "desc",
    },
    take: 5001,
    select: {
      id: true,
      provider: true,
      providerTransactionId: true,
      amountVnd: true,
      currency: true,
      status: true,
      processedAt: true,
      parent: {
        select: {
          email: true,
        },
      },
    },
  });

  return {
    rows: records.slice(0, 5000),
    truncated: records.length > 5000,
  };
}

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

  const subscriptionHistory = subscriptionHistoryRaw.map((record) => ({
    id: record.id,
    provider: record.provider,
    providerTransactionId: record.providerTransactionId,
    amountVnd: record.amountVnd,
    status: record.status,
    processedAt: record.processedAt,
    planCode: readStringFromUnknownRecord(record.rawPayload, "planCode"),
    eventType: readStringFromUnknownRecord(record.rawPayload, "eventType"),
    subscription: record.subscription,
  }));

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

export async function listPaymentRecordsAdmin(input: unknown) {
  const query = adminPaymentQuerySchema.parse(input);

  return prisma.paymentRecord.findMany({
    where: {
      ...(query.status ? { status: query.status } : {}),
    },
    orderBy: {
      processedAt: "desc",
    },
    take: query.limit,
    select: {
      id: true,
      parentId: true,
      provider: true,
      providerTransactionId: true,
      amountVnd: true,
      currency: true,
      status: true,
      processedAt: true,
      parent: {
        select: {
          email: true,
        },
      },
    },
  });
}

export async function listWebhookEventsAdmin(input: unknown) {
  const query = adminWebhookQuerySchema.parse(input);

  return prisma.webhookEvent.findMany({
    where: {
      ...(query.status ? { status: query.status } : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    take: query.limit,
    select: {
      id: true,
      provider: true,
      eventId: true,
      signatureValid: true,
      status: true,
      errorMessage: true,
      processedAt: true,
      createdAt: true,
    },
  });
}

export async function updateLessonTrialFlagAdmin(params: {
  lessonId: string;
  actorId: string;
  input: unknown;
}) {
  const payload = adminLessonTrialFlagSchema.parse(params.input);

  const lesson = await prisma.lesson.findUnique({
    where: { id: params.lessonId },
    select: {
      id: true,
      slug: true,
      trialEnabled: true,
    },
  });

  if (!lesson) {
    throw new DomainError("Lesson not found", 404, "LESSON_NOT_FOUND");
  }

  const updatedLesson = await prisma.lesson.update({
    where: { id: params.lessonId },
    data: {
      trialEnabled: payload.trialEnabled,
    },
    select: {
      id: true,
      slug: true,
      title: true,
      trialEnabled: true,
    },
  });

  await createAuditLog({
    actorType: "admin",
    actorId: params.actorId,
    action: "content.lesson.trial_flag.updated",
    resourceType: "lesson",
    resourceId: updatedLesson.id,
    metadata: {
      slug: updatedLesson.slug,
      previousTrialEnabled: lesson.trialEnabled,
      nextTrialEnabled: updatedLesson.trialEnabled,
    },
  });

  return updatedLesson;
}

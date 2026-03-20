import { prisma } from "@/lib/db";
import { createAuditLog } from "@/modules/platform/audit-service";
import { DomainError } from "@/modules/platform/errors";
import { z } from "zod";

export const adminLessonTrialFlagSchema = z.object({
  trialEnabled: z.boolean(),
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
  {
    key: "KID_SKY_GARDEN_MVP",
    description: "Giao diện khu vườn trên mây cho trang học của bé",
  },
] as const;

// Module-level cache: only seed default flags once per process lifetime
let defaultFlagsEnsured = false;

async function ensureDefaultFeatureFlags() {
  if (defaultFlagsEnsured) return;
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
  defaultFlagsEnsured = true;
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


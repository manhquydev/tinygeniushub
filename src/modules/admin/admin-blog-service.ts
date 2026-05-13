import { prisma } from "@/lib/db";
import { EMAIL_FEATURE_FLAG_DEFINITIONS } from "@/lib/email/email-feature-flags";
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

type DefaultFeatureFlagSeed = {
  key: string;
  description: string;
  enabled: boolean;
};

const defaultFeatureFlags: DefaultFeatureFlagSeed[] = [
  {
    key: "PARENT_V2_DASHBOARD",
    description: "New version of parent dashboard",
    enabled: false,
  },
  {
    key: "BETA_LESSON_EDITOR",
    description: "Beta content editor",
    enabled: false,
  },
  {
    key: "CAREGIVER_VIDEO_CALL",
    description: "Caregiver video call feature (coming soon)",
    enabled: false,
  },
  {
    key: "REFERRAL_V2",
    description: "Referral system v2",
    enabled: false,
  },
  {
    key: "AI_LESSON_SUGGESTIONS",
    description: "AI lesson suggestions (coming soon)",
    enabled: false,
  },
  {
    key: "KID_SKY_GARDEN_MVP",
    description: "Cloud garden interface for your child's school site",
    enabled: false,
  },
  ...EMAIL_FEATURE_FLAG_DEFINITIONS.map((flag) => ({
    key: flag.key,
    description: flag.description,
    enabled: true,
  })),
];

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
          enabled: flag.enabled,
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
    throw new DomainError("The end time must be in the future.", 400, "INVALID_ANNOUNCEMENT_ENDS_AT");
  }

  if (payload.scheduledAt && payload.endsAt && payload.scheduledAt >= payload.endsAt) {
    throw new DomainError(
      "The scheduling time must be earlier than the end time.",
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
    throw new DomainError("System messages not found.", 404, "ANNOUNCEMENT_NOT_FOUND");
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
    throw new DomainError("Feature flag not found.", 404, "FEATURE_FLAG_NOT_FOUND");
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


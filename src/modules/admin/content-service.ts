import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DomainError } from "@/modules/platform/errors";
import { z } from "zod";

const lessonCreateSchema = z.object({
  unitId: z.string().min(1),
  orderNo: z.coerce.number().int().min(1).max(9999),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug only includes lowercase letters, numbers and hyphens."),
  title: z.string().trim().min(1).max(200),
  objective: z.string().trim().min(1).max(500),
  estimatedMinutes: z.coerce.number().int().min(1).max(180),
  trialEnabled: z.boolean().default(false),
  videoSource: z.string().trim().max(1000).optional().nullable(),
  offlineCardMarkdown: z.string().trim().max(5000).optional().nullable(),
  parentScriptMarkdown: z.string().trim().max(5000).optional().nullable(),
});

const lessonUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    objective: z.string().trim().min(1).max(500).optional(),
    estimatedMinutes: z.coerce.number().int().min(1).max(180).optional(),
    trialEnabled: z.boolean().optional(),
    videoSource: z.string().trim().max(1000).optional().nullable(),
    offlineCardMarkdown: z.string().trim().max(5000).optional().nullable(),
    parentScriptMarkdown: z.string().trim().max(5000).optional().nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, "There are no fields to update.");

const activityTypeSchema = z.enum(["MCQ", "TRUE_FALSE", "WORD_MATCH", "FILL_BLANK"]);

const mcqSpecSchema = z
  .object({
    choices: z
      .array(
        z.object({
          id: z.string().trim().min(1).max(20),
          text: z.string().trim().min(1).max(200),
          isCorrect: z.boolean(),
        }),
      )
      .length(4),
  })
  .refine(
    (value) => value.choices.filter((choice) => choice.isCorrect).length === 1,
    "MCQ must have exactly 1 correct answer.",
  );

const trueFalseSpecSchema = z.object({
  answer: z.boolean(),
});

const wordMatchSpecSchema = z.object({
  pairs: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(20),
        left: z.string().trim().min(1).max(100),
        right: z.string().trim().min(1).max(100),
      }),
    )
    .min(1)
    .max(4),
});

const fillBlankSpecSchema = z.object({
  sentence: z.string().trim().min(1).max(200),
  answer: z.string().trim().min(1).max(50),
  hint: z.string().trim().max(200).optional().nullable(),
});

const activityCreateSchema = z.object({
  lessonId: z.string().min(1),
  type: activityTypeSchema,
  prompt: z.string().trim().min(1).max(500),
  spec: z.record(z.string(), z.unknown()),
  passCriteria: z.coerce.number().int().min(0).max(100).default(80),
});

const activityUpdateSchema = z.object({
  prompt: z.string().trim().min(1).max(500),
  spec: z.record(z.string(), z.unknown()),
  passCriteria: z.coerce.number().int().min(0).max(100),
});

function toNullableString(value?: string | null) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function parseSpecByType(type: z.infer<typeof activityTypeSchema>, spec: Record<string, unknown>) {
  if (type === "MCQ") {
    return mcqSpecSchema.parse(spec) as Prisma.JsonObject;
  }

  if (type === "TRUE_FALSE") {
    return trueFalseSpecSchema.parse(spec) as Prisma.JsonObject;
  }

  if (type === "WORD_MATCH") {
    return wordMatchSpecSchema.parse(spec) as Prisma.JsonObject;
  }

  const parsed = fillBlankSpecSchema.parse(spec);
  if (!parsed.sentence.includes("___")) {
    throw new DomainError("Fill-in sentences must have a ___ symbol for the blank.", 400, "INVALID_FILL_BLANK_SENTENCE");
  }

  return parsed as Prisma.JsonObject;
}

export async function listTracksWithStats() {
  const tracks = await prisma.track.findMany({
    orderBy: {
      code: "asc",
    },
    select: {
      id: true,
      code: true,
      title: true,
      isTrialEnabled: true,
    },
  });

  const trackIds = tracks.map((track) => track.id);
  const levels =
    trackIds.length > 0
      ? await prisma.level.findMany({
          where: {
            trackId: {
              in: trackIds,
            },
          },
          select: {
            id: true,
            trackId: true,
          },
        })
      : [];

  const levelIds = levels.map((level) => level.id);
  const units =
    levelIds.length > 0
      ? await prisma.unit.findMany({
          where: {
            levelId: {
              in: levelIds,
            },
          },
          select: {
            id: true,
            levelId: true,
          },
        })
      : [];

  const unitIds = units.map((unit) => unit.id);
  const lessons =
    unitIds.length > 0
      ? await prisma.lesson.findMany({
          where: {
            unitId: {
              in: unitIds,
            },
          },
          select: {
            id: true,
            unitId: true,
          },
        })
      : [];

  const levelsByTrackId = new Map<string, number>();
  const unitsByTrackId = new Map<string, number>();
  const lessonsByTrackId = new Map<string, number>();

  const trackIdByLevelId = new Map(levels.map((level) => [level.id, level.trackId]));
  const levelCountRows = levels.reduce<Map<string, number>>((acc, level) => {
    acc.set(level.trackId, (acc.get(level.trackId) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());
  for (const [trackId, count] of levelCountRows.entries()) {
    levelsByTrackId.set(trackId, count);
  }

  const trackIdByUnitId = new Map<string, string>();
  for (const unit of units) {
    const trackId = trackIdByLevelId.get(unit.levelId);
    if (!trackId) {
      continue;
    }

    trackIdByUnitId.set(unit.id, trackId);
    unitsByTrackId.set(trackId, (unitsByTrackId.get(trackId) ?? 0) + 1);
  }

  for (const lesson of lessons) {
    const trackId = trackIdByUnitId.get(lesson.unitId);
    if (!trackId) {
      continue;
    }

    lessonsByTrackId.set(trackId, (lessonsByTrackId.get(trackId) ?? 0) + 1);
  }

  return tracks.map((track) => ({
    ...track,
    _count: {
      levels: levelsByTrackId.get(track.id) ?? 0,
      units: unitsByTrackId.get(track.id) ?? 0,
      lessons: lessonsByTrackId.get(track.id) ?? 0,
    },
  }));
}

export async function listLevelsForTrack(trackId: string) {
  return prisma.level.findMany({
    where: {
      trackId,
    },
    orderBy: {
      orderNo: "asc",
    },
    select: {
      id: true,
      trackId: true,
      orderNo: true,
      title: true,
      _count: {
        select: {
          units: true,
        },
      },
    },
  });
}

export async function listUnitsForLevel(levelId: string) {
  return prisma.unit.findMany({
    where: {
      levelId,
    },
    orderBy: {
      orderNo: "asc",
    },
    select: {
      id: true,
      levelId: true,
      orderNo: true,
      title: true,
      _count: {
        select: {
          lessons: true,
        },
      },
    },
  });
}

export async function listLessonsForUnit(unitId: string) {
  return prisma.lesson.findMany({
    where: {
      unitId,
    },
    orderBy: {
      orderNo: "asc",
    },
    select: {
      id: true,
      unitId: true,
      orderNo: true,
      slug: true,
      title: true,
      objective: true,
      estimatedMinutes: true,
      trialEnabled: true,
      videoSource: true,
      bunnyVideoId: true,
      videoStatus: true,
      offlineCardMarkdown: true,
      parentScriptMarkdown: true,
      _count: {
        select: {
          activities: true,
          completions: true,
        },
      },
    },
  });
}

export async function listActivitiesForLesson(lessonId: string) {
  return prisma.activity.findMany({
    where: {
      lessonId,
    },
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
      lessonId: true,
      type: true,
      prompt: true,
      passCriteria: true,
      spec: true,
    },
  });
}

export async function createLesson(data: {
  unitId: string;
  orderNo: number;
  slug: string;
  title: string;
  objective: string;
  estimatedMinutes: number;
  trialEnabled: boolean;
  videoSource?: string | null;
  offlineCardMarkdown?: string | null;
  parentScriptMarkdown?: string | null;
}) {
  const payload = lessonCreateSchema.parse(data);

  return prisma.lesson.create({
    data: {
      unitId: payload.unitId,
      orderNo: payload.orderNo,
      slug: payload.slug,
      title: payload.title,
      objective: payload.objective,
      estimatedMinutes: payload.estimatedMinutes,
      trialEnabled: payload.trialEnabled,
      videoSource: toNullableString(payload.videoSource),
      offlineCardMarkdown: toNullableString(payload.offlineCardMarkdown),
      parentScriptMarkdown: toNullableString(payload.parentScriptMarkdown),
    },
    select: {
      id: true,
      unitId: true,
      orderNo: true,
      slug: true,
      title: true,
      objective: true,
      estimatedMinutes: true,
      trialEnabled: true,
      videoSource: true,
      bunnyVideoId: true,
      videoStatus: true,
      offlineCardMarkdown: true,
      parentScriptMarkdown: true,
      _count: {
        select: {
          activities: true,
          completions: true,
        },
      },
    },
  });
}

export async function updateLesson(
  lessonId: string,
  data: Partial<{
    title: string;
    objective: string;
    estimatedMinutes: number;
    trialEnabled: boolean;
    videoSource: string | null;
    offlineCardMarkdown: string | null;
    parentScriptMarkdown: string | null;
  }>,
) {
  const payload = lessonUpdateSchema.parse(data);

  return prisma.lesson.update({
    where: {
      id: lessonId,
    },
    data: {
      ...(payload.title !== undefined ? { title: payload.title } : {}),
      ...(payload.objective !== undefined ? { objective: payload.objective } : {}),
      ...(payload.estimatedMinutes !== undefined ? { estimatedMinutes: payload.estimatedMinutes } : {}),
      ...(payload.trialEnabled !== undefined ? { trialEnabled: payload.trialEnabled } : {}),
      ...(payload.videoSource !== undefined ? { videoSource: toNullableString(payload.videoSource) } : {}),
      ...(payload.offlineCardMarkdown !== undefined
        ? { offlineCardMarkdown: toNullableString(payload.offlineCardMarkdown) }
        : {}),
      ...(payload.parentScriptMarkdown !== undefined
        ? { parentScriptMarkdown: toNullableString(payload.parentScriptMarkdown) }
        : {}),
    },
    select: {
      id: true,
      unitId: true,
      orderNo: true,
      slug: true,
      title: true,
      objective: true,
      estimatedMinutes: true,
      trialEnabled: true,
      videoSource: true,
      bunnyVideoId: true,
      videoStatus: true,
      offlineCardMarkdown: true,
      parentScriptMarkdown: true,
      _count: {
        select: {
          activities: true,
          completions: true,
        },
      },
    },
  });
}

export async function deleteLesson(lessonId: string) {
  const completionCount = await prisma.lessonCompletion.count({
    where: {
      lessonId,
    },
  });

  if (completionCount > 0) {
    throw new DomainError("Lessons that have been completed by students cannot be deleted.", 409, "LESSON_HAS_COMPLETIONS");
  }

  await prisma.lesson.delete({
    where: {
      id: lessonId,
    },
  });
}

export async function toggleLessonTrial(lessonId: string) {
  const existing = await prisma.lesson.findUnique({
    where: {
      id: lessonId,
    },
    select: {
      id: true,
      trialEnabled: true,
    },
  });

  if (!existing) {
    throw new DomainError("No lessons found.", 404, "LESSON_NOT_FOUND");
  }

  return prisma.lesson.update({
    where: {
      id: lessonId,
    },
    data: {
      trialEnabled: !existing.trialEnabled,
    },
    select: {
      id: true,
      trialEnabled: true,
    },
  });
}

export async function createActivity(data: {
  lessonId: string;
  type: string;
  prompt: string;
  spec: object;
  passCriteria: number;
}) {
  const payload = activityCreateSchema.parse({
    lessonId: data.lessonId,
    type: data.type,
    prompt: data.prompt,
    spec: data.spec,
    passCriteria: data.passCriteria,
  });
  const parsedSpec = parseSpecByType(payload.type, payload.spec);

  return prisma.activity.create({
    data: {
      lessonId: payload.lessonId,
      type: payload.type,
      prompt: payload.prompt,
      spec: parsedSpec,
      passCriteria: payload.passCriteria,
    },
    select: {
      id: true,
      lessonId: true,
      type: true,
      prompt: true,
      passCriteria: true,
      spec: true,
    },
  });
}

export async function updateActivity(
  activityId: string,
  data: {
    prompt: string;
    spec: object;
    passCriteria: number;
  },
) {
  const existing = await prisma.activity.findUnique({
    where: {
      id: activityId,
    },
    select: {
      id: true,
      type: true,
    },
  });

  if (!existing) {
    throw new DomainError("No question found.", 404, "ACTIVITY_NOT_FOUND");
  }

  const payload = activityUpdateSchema.parse({
    prompt: data.prompt,
    spec: data.spec,
    passCriteria: data.passCriteria,
  });
  const parsedSpec = parseSpecByType(activityTypeSchema.parse(existing.type), payload.spec);

  return prisma.activity.update({
    where: {
      id: activityId,
    },
    data: {
      prompt: payload.prompt,
      spec: parsedSpec,
      passCriteria: payload.passCriteria,
    },
    select: {
      id: true,
      lessonId: true,
      type: true,
      prompt: true,
      passCriteria: true,
      spec: true,
    },
  });
}

export async function deleteActivity(activityId: string) {
  await prisma.activity.delete({
    where: {
      id: activityId,
    },
  });
}

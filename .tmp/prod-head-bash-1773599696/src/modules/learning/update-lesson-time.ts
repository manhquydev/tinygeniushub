"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { getParentFromServerCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { DomainError } from "@/modules/platform/errors";

export const updateLessonTimeInputSchema = z.object({
  childId: z.string().min(1),
  lessonId: z.string().min(1),
  secondsSpent: z.coerce.number().int().min(1).max(1800),
  accessedAt: z.coerce.date().optional(),
});

type LessonProgressRow = {
  childId: string;
  lessonId: string;
  timeSpent: number;
  lastAccessedAt: Date;
};

export type UpdateLessonTimeResult = {
  ok: true;
  data: {
    childId: string;
    lessonId: string;
    timeSpent: number;
    lastAccessedAt: string;
  };
};

export async function updateLessonTime(input: unknown): Promise<UpdateLessonTimeResult> {
  const payload = updateLessonTimeInputSchema.parse(input);
  const parent = await getParentFromServerCookie();

  if (!parent) {
    throw new DomainError("Unauthorized", 401, "UNAUTHORIZED");
  }

  const [child, lesson] = await Promise.all([
    prisma.childProfile.findFirst({
      where: {
        id: payload.childId,
        parentId: parent.id,
      },
      select: { id: true },
    }),
    prisma.lesson.findUnique({
      where: { id: payload.lessonId },
      select: { id: true },
    }),
  ]);

  if (!child) {
    throw new DomainError("Child profile not found", 404, "CHILD_NOT_FOUND");
  }

  if (!lesson) {
    throw new DomainError("Lesson not found", 404, "LESSON_NOT_FOUND");
  }

  const accessAt = payload.accessedAt ?? new Date();

  const result = await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<LessonProgressRow[]>`
      INSERT INTO "public"."LessonProgress"
        ("id", "childId", "lessonId", "timeSpent", "lastAccessedAt", "createdAt", "updatedAt")
      VALUES
        (${`lp_${randomUUID()}`}, ${payload.childId}, ${payload.lessonId}, ${payload.secondsSpent}, ${accessAt}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("childId", "lessonId")
      DO UPDATE SET
        "timeSpent" = GREATEST(0, "LessonProgress"."timeSpent") + EXCLUDED."timeSpent",
        "lastAccessedAt" = GREATEST("LessonProgress"."lastAccessedAt", EXCLUDED."lastAccessedAt"),
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "childId", "lessonId", "timeSpent", "lastAccessedAt";
    `;

    const [snapshot] = rows;
    if (!snapshot) {
      throw new DomainError("Could not persist lesson time", 500, "LESSON_PROGRESS_WRITE_FAILED");
    }

    return snapshot;
  });

  return {
    ok: true,
    data: {
      childId: result.childId,
      lessonId: result.lessonId,
      timeSpent: result.timeSpent,
      lastAccessedAt: result.lastAccessedAt.toISOString(),
    },
  };
}

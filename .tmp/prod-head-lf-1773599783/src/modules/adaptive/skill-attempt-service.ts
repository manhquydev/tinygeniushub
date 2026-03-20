/**
 * Service for recording skill attempts and triggering mastery recalculation.
 */

import { prisma } from "@/lib/db";
import type { SkillAttempt } from "@prisma/client";
import { recalculateMastery } from "./child-skill-state-service";
import type { AttemptInput, MasteryCalculationResult } from "./types";

export interface RecordAttemptResult {
  attempt: SkillAttempt;
  mastery: MasteryCalculationResult;
}

/**
 * Record a skill attempt and update mastery state.
 */
export async function recordSkillAttempt(input: AttemptInput): Promise<RecordAttemptResult> {
  const attempt = await prisma.skillAttempt.create({
    data: {
      childId: input.childId,
      skillId: input.skillId,
      activityId: input.activityId,
      isCorrect: input.isCorrect,
      responseMs: input.responseMs,
      difficulty: input.difficulty ?? "MEDIUM",
      rawResponse: input.rawResponse ? (input.rawResponse as object) : undefined,
    },
  });

  const mastery = await recalculateMastery(input.childId, input.skillId);
  return { attempt, mastery };
}

/**
 * Get recent attempts for a child+skill pair.
 */
export async function getRecentAttempts(
  childId: string,
  skillId: string,
  limit = 20
): Promise<SkillAttempt[]> {
  return prisma.skillAttempt.findMany({
    where: { childId, skillId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Get all attempts for a child within a date range.
 */
export async function getAttemptsInRange(
  childId: string,
  from: Date,
  to: Date
): Promise<SkillAttempt[]> {
  return prisma.skillAttempt.findMany({
    where: { childId, createdAt: { gte: from, lte: to } },
    orderBy: { createdAt: "desc" },
  });
}

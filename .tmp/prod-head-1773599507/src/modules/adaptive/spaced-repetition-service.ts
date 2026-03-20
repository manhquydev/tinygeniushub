/**
 * Spaced repetition service using SM-2 algorithm (simplified).
 * Manages ReviewQueue scheduling for skill review sessions.
 */

import { prisma } from "@/lib/db";
import type { ReviewQueue } from "@prisma/client";
import type { SkillDomain } from "./types";

export interface SM2Input {
  isCorrect: boolean;
  currentInterval: number;
  easeFactor: number;
  repetitions: number;
}

export interface SM2Result {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
}

/**
 * Compute next review schedule using SM-2 algorithm.
 * Returns updated interval, ease factor, and repetition count.
 */
export function computeNextReview(params: SM2Input): SM2Result {
  const { isCorrect, currentInterval, easeFactor, repetitions } = params;

  if (!isCorrect) {
    // Reset on incorrect: shorter interval, lower ease
    return {
      intervalDays: 1,
      easeFactor: Math.max(1.3, easeFactor - 0.2),
      repetitions: 0,
    };
  }

  const newRepetitions = repetitions + 1;
  let newInterval: number;

  if (newRepetitions === 1) {
    newInterval = 1;
  } else if (newRepetitions === 2) {
    newInterval = 3;
  } else {
    newInterval = Math.round(currentInterval * easeFactor);
  }

  return {
    intervalDays: Math.min(newInterval, 60), // cap at 60 days
    easeFactor: Math.min(easeFactor + 0.1, 3.0),
    repetitions: newRepetitions,
  };
}

/**
 * Schedule or reschedule a skill review for a child.
 * Creates a new ReviewQueue entry at the computed next review date.
 */
export async function scheduleReview(params: {
  childId: string;
  skillId: string;
  isCorrect: boolean;
}): Promise<ReviewQueue> {
  const { childId, skillId, isCorrect } = params;

  // Find most recent incomplete review entry
  const existing = await prisma.reviewQueue.findFirst({
    where: { childId, skillId, completedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const currentInterval = existing?.intervalDays ?? 1;
  const currentEase = existing?.easeFactor ?? 2.5;
  const currentReps = existing?.repetitions ?? 0;

  const next = computeNextReview({
    isCorrect,
    currentInterval,
    easeFactor: currentEase,
    repetitions: currentReps,
  });

  const scheduledAt = new Date();
  scheduledAt.setDate(scheduledAt.getDate() + next.intervalDays);

  // Mark existing as completed
  if (existing) {
    await prisma.reviewQueue.update({
      where: { id: existing.id },
      data: { completedAt: new Date() },
    });
  }

  return prisma.reviewQueue.create({
    data: {
      childId,
      skillId,
      scheduledAt,
      intervalDays: next.intervalDays,
      easeFactor: next.easeFactor,
      repetitions: next.repetitions,
    },
  });
}

/**
 * Get skills due for review for a child, optionally filtered by domain.
 * Returns incomplete review items scheduled for now or earlier.
 */
export async function getDueReviews(
  childId: string,
  domain?: SkillDomain,
): Promise<(ReviewQueue & { skill: { id: string; code: string; nameVi: string; domain: string; gradeLevel: number } })[]> {
  return prisma.reviewQueue.findMany({
    where: {
      childId,
      completedAt: null,
      scheduledAt: { lte: new Date() },
      ...(domain ? { skill: { domain } } : {}),
    },
    include: {
      skill: {
        select: { id: true, code: true, nameVi: true, domain: true, gradeLevel: true },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });
}

/**
 * Get all upcoming review queue items for a child.
 */
export async function getReviewQueue(childId: string): Promise<
  (ReviewQueue & { skill: { id: string; code: string; nameVi: string } })[]
> {
  return prisma.reviewQueue.findMany({
    where: { childId, completedAt: null },
    include: {
      skill: { select: { id: true, code: true, nameVi: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });
}

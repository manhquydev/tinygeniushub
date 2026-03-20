/**
 * Service for computing and updating child skill mastery states.
 * Uses a weighted mastery algorithm combining recency, overall accuracy, consistency, and speed.
 */

import { prisma } from "@/lib/db";
import type { ChildSkillState, MasteryLevel, SkillAttempt } from "@prisma/client";
import type { MasteryCalculationResult } from "./types";

// Weights must sum to 1.0
const MASTERY_WEIGHTS = {
  recentAccuracy: 0.5,
  overallAccuracy: 0.2,
  consistency: 0.15,
  speed: 0.15,
} as const;

const RECENT_WINDOW = 5; // number of recent attempts to consider

/**
 * Compute mastery score from a list of attempts (0.0 - 1.0).
 */
export function computeMasteryScore(attempts: Pick<SkillAttempt, "isCorrect" | "responseMs">[]): number {
  if (attempts.length === 0) return 0;

  const recent = attempts.slice(-RECENT_WINDOW);
  const recentAcc = recent.filter((a) => a.isCorrect).length / recent.length;
  const overallAcc = attempts.filter((a) => a.isCorrect).length / attempts.length;
  const consistency = computeConsistency(attempts);
  const speed = computeSpeedScore(recent);

  return (
    recentAcc * MASTERY_WEIGHTS.recentAccuracy +
    overallAcc * MASTERY_WEIGHTS.overallAccuracy +
    consistency * MASTERY_WEIGHTS.consistency +
    speed * MASTERY_WEIGHTS.speed
  );
}

/**
 * Consistency: 1 - normalized standard deviation of sliding window accuracies.
 */
function computeConsistency(attempts: Pick<SkillAttempt, "isCorrect">[]): number {
  if (attempts.length < 3) return 0.5; // Not enough data
  const windowSize = Math.min(RECENT_WINDOW, attempts.length);
  const windows: number[] = [];
  for (let i = windowSize; i <= attempts.length; i++) {
    const window = attempts.slice(i - windowSize, i);
    windows.push(window.filter((a) => a.isCorrect).length / windowSize);
  }
  const mean = windows.reduce((s, v) => s + v, 0) / windows.length;
  const variance = windows.reduce((s, v) => s + (v - mean) ** 2, 0) / windows.length;
  const stdDev = Math.sqrt(variance);
  return Math.max(0, 1 - stdDev * 2); // stdDev of 0.5 → score of 0
}

/**
 * Speed score: faster than median = better (capped 0-1).
 */
function computeSpeedScore(attempts: Pick<SkillAttempt, "responseMs">[]): number {
  const responseTimes = attempts.map((a) => a.responseMs).filter((ms): ms is number => ms !== null && ms !== undefined);
  if (responseTimes.length === 0) return 0.5; // Default when no timing data

  const sorted = [...responseTimes].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const avg = responseTimes.reduce((s, v) => s + v, 0) / responseTimes.length;

  // Faster than median gets 0.5-1.0, slower gets 0-0.5
  if (avg <= median) {
    return 0.5 + 0.5 * Math.min(1, (median - avg) / median);
  }
  return 0.5 * Math.max(0, 1 - (avg - median) / median);
}

/**
 * Convert numeric score to MasteryLevel enum.
 */
export function masteryLevelFromScore(score: number): MasteryLevel {
  if (score >= 0.9) return "MASTERED";
  if (score >= 0.7) return "PROFICIENT";
  if (score >= 0.4) return "DEVELOPING";
  if (score > 0) return "NOVICE";
  return "NOT_STARTED";
}

/**
 * Recalculate and persist mastery state for a child+skill pair.
 * Called after recording a new attempt.
 */
export async function recalculateMastery(childId: string, skillId: string): Promise<MasteryCalculationResult> {
  const attempts = await prisma.skillAttempt.findMany({
    where: { childId, skillId },
    orderBy: { createdAt: "asc" },
    select: { isCorrect: true, responseMs: true },
  });

  const score = computeMasteryScore(attempts);
  const level = masteryLevelFromScore(score);

  const correctCount = attempts.filter((a) => a.isCorrect).length;

  await prisma.childSkillState.upsert({
    where: { childId_skillId: { childId, skillId } },
    update: {
      masteryScore: score,
      masteryLevel: level,
      totalAttempts: attempts.length,
      correctAttempts: correctCount,
      lastAttemptAt: new Date(),
    },
    create: {
      childId,
      skillId,
      masteryScore: score,
      masteryLevel: level,
      totalAttempts: attempts.length,
      correctAttempts: correctCount,
      lastAttemptAt: new Date(),
    },
  });

  return { score, level };
}

/**
 * Get skill state for a child. Returns null if no attempts yet.
 */
export async function getChildSkillState(childId: string, skillId: string): Promise<ChildSkillState | null> {
  return prisma.childSkillState.findUnique({
    where: { childId_skillId: { childId, skillId } },
  });
}

/**
 * Get all skill states for a child, sorted by mastery level.
 */
export async function getAllSkillStatesForChild(childId: string): Promise<ChildSkillState[]> {
  return prisma.childSkillState.findMany({
    where: { childId },
    orderBy: [{ masteryLevel: "desc" }, { lastAttemptAt: "desc" }],
  });
}

/**
 * Get skills due for spaced repetition review.
 */
export async function getSkillsDueForReview(childId: string): Promise<ChildSkillState[]> {
  return prisma.childSkillState.findMany({
    where: {
      childId,
      nextReviewAt: { lte: new Date() },
      masteryLevel: { not: "NOT_STARTED" },
    },
    orderBy: { nextReviewAt: "asc" },
  });
}

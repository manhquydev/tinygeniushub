/**
 * Scorer for placement test attempts.
 * Converts per-skill responses into mastery levels.
 * Applies difficulty weighting: HARD correct = 1.5x, EASY correct = 0.7x.
 */

import type { MasteryLevel } from "@prisma/client";
import { masteryLevelFromScore } from "./child-skill-state-service";

export interface ScoredSkill {
  skillId: string;
  score: number;
  level: MasteryLevel;
  totalItems: number;
  correctItems: number;
}

interface ResponseWithDifficulty {
  itemId: string;
  isCorrect: boolean;
  item: {
    skillId: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
  };
}

const DIFFICULTY_WEIGHTS = {
  EASY: 0.7,
  MEDIUM: 1.0,
  HARD: 1.5,
} as const;

/**
 * Score a placement attempt by computing per-skill mastery.
 */
export function scoreAttempt(responses: ResponseWithDifficulty[]): Map<string, ScoredSkill> {
  // Aggregate weighted scores per skill
  const skillMap = new Map<string, { weightedCorrect: number; weightedTotal: number; correct: number; total: number }>();

  for (const resp of responses) {
    const { skillId, difficulty } = resp.item;
    const weight = DIFFICULTY_WEIGHTS[difficulty];

    const prev = skillMap.get(skillId) ?? { weightedCorrect: 0, weightedTotal: 0, correct: 0, total: 0 };
    prev.total++;
    prev.weightedTotal += weight;

    if (resp.isCorrect) {
      prev.correct++;
      prev.weightedCorrect += weight;
    }

    skillMap.set(skillId, prev);
  }

  const result = new Map<string, ScoredSkill>();

  for (const [skillId, stats] of skillMap) {
    const rawScore = stats.weightedTotal > 0 ? stats.weightedCorrect / stats.weightedTotal : 0;
    result.set(skillId, {
      skillId,
      score: Math.min(1, rawScore),
      level: masteryLevelFromScore(rawScore),
      totalItems: stats.total,
      correctItems: stats.correct,
    });
  }

  return result;
}

/**
 * Build a recommendations summary from scored skills.
 */
export function buildRecommendations(scoredSkills: ScoredSkill[]): string[] {
  const recommendations: string[] = [];

  const notStarted = scoredSkills.filter((s) => s.level === "NOT_STARTED" || s.level === "NOVICE");
  const developing = scoredSkills.filter((s) => s.level === "DEVELOPING");
  const mastered = scoredSkills.filter((s) => s.level === "MASTERED" || s.level === "PROFICIENT");

  if (notStarted.length > 0) {
    recommendations.push(`Need to learn from the beginning${notStarted.length}basic skills`);
  }
  if (developing.length > 0) {
    recommendations.push(`Need more practice${developing.length}developing skills`);
  }
  if (mastered.length > 0) {
    recommendations.push(`Got it${mastered.length}skills, can be learned to improve`);
  }

  return recommendations;
}

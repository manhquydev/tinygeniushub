/**
 * Handles activity completion events in the adaptive learning engine.
 * Orchestrates:
 *  1. Record SkillAttempt
 *  2. Recalculate and persist ChildSkillState (mastery)
 *  3. Schedule ReviewQueue (spaced repetition)
 */

import type { MasteryCalculationResult } from "./types";
import { recordSkillAttempt } from "./skill-attempt-service";
import { scheduleReview } from "./spaced-repetition-service";

export interface ActivityCompletionInput {
  childId: string;
  activityId?: string;
  skillId: string;
  isCorrect: boolean;
  responseMs?: number;
  rawResponse?: Record<string, unknown>;
}

export interface ActivityCompletionResult {
  masteryBefore: number | null;
  masteryAfter: MasteryCalculationResult;
  nextReviewAt: Date;
}

/**
 * Process the completion of a single activity:
 *  - Records attempt + updates mastery
 *  - Schedules next spaced-repetition review
 */
export async function handleActivityCompletion(
  input: ActivityCompletionInput,
): Promise<ActivityCompletionResult> {
  const { childId, activityId, skillId, isCorrect, responseMs, rawResponse } = input;

  // Record attempt and get updated mastery
  const { mastery: masteryAfter } = await recordSkillAttempt({
    childId,
    skillId,
    activityId,
    isCorrect,
    responseMs,
    rawResponse,
  });

  // Schedule next review using SM-2
  const reviewEntry = await scheduleReview({ childId, skillId, isCorrect });

  return {
    masteryBefore: null, // could be fetched before recording if needed
    masteryAfter,
    nextReviewAt: reviewEntry.scheduledAt,
  };
}

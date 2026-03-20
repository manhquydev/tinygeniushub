/**
 * Computer Adaptive Testing (CAT) engine for placement tests.
 * Simple adaptive algorithm: start MEDIUM, increase/decrease difficulty
 * based on consecutive correct/wrong answers.
 */

import type { DifficultyLevel } from "@prisma/client";

export interface PlacementTestItemBase {
  id: string;
  skillId: string;
  difficulty: DifficultyLevel;
  activityType: string;
  activitySpec: unknown;
  audioUrl: string | null;
}

export interface CATState {
  currentDifficulty: DifficultyLevel;
  answeredItemIds: string[];
  skillResults: Map<string, { correct: number; total: number }>;
  consecutiveCorrect: number;
  consecutiveWrong: number;
}

/**
 * Create initial CAT state for a new placement attempt.
 */
export function createInitialCATState(): CATState {
  return {
    currentDifficulty: "MEDIUM",
    answeredItemIds: [],
    skillResults: new Map(),
    consecutiveCorrect: 0,
    consecutiveWrong: 0,
  };
}

/**
 * Reconstruct CAT state from existing responses.
 * Used to resume a partially-completed attempt.
 */
export function reconstructCATState(
  responses: Array<{ itemId: string; isCorrect: boolean; item: PlacementTestItemBase }>,
): CATState {
  const state = createInitialCATState();

  for (const resp of responses) {
    state.answeredItemIds.push(resp.itemId);

    const prev = state.skillResults.get(resp.item.skillId) ?? { correct: 0, total: 0 };
    prev.total++;
    if (resp.isCorrect) prev.correct++;
    state.skillResults.set(resp.item.skillId, prev);

    updateDifficulty(state, resp.isCorrect);
  }

  return state;
}

/**
 * Select the next item for the child based on current CAT state.
 * Prioritizes: current difficulty + untested skills first.
 */
export function selectNextItem(
  state: CATState,
  availableItems: PlacementTestItemBase[],
): PlacementTestItemBase | null {
  const unanswered = availableItems.filter((item) => !state.answeredItemIds.includes(item.id));

  if (unanswered.length === 0) return null;

  // Filter by current difficulty
  const difficultyMatch = unanswered.filter((item) => item.difficulty === state.currentDifficulty);

  const candidates = difficultyMatch.length > 0 ? difficultyMatch : unanswered;

  // Prioritize skills not yet tested
  const untestedFirst = candidates.filter((item) => {
    const results = state.skillResults.get(item.skillId);
    return !results || results.total === 0;
  });

  return untestedFirst[0] ?? candidates[0];
}

/**
 * Update difficulty level based on answer correctness.
 * 2 consecutive correct → increase difficulty (up to HARD)
 * 2 consecutive wrong → decrease difficulty (down to EASY)
 */
export function updateDifficulty(state: CATState, isCorrect: boolean): void {
  if (isCorrect) {
    state.consecutiveCorrect++;
    state.consecutiveWrong = 0;
    if (state.consecutiveCorrect >= 2 && state.currentDifficulty !== "HARD") {
      state.currentDifficulty = state.currentDifficulty === "EASY" ? "MEDIUM" : "HARD";
      state.consecutiveCorrect = 0;
    }
  } else {
    state.consecutiveWrong++;
    state.consecutiveCorrect = 0;
    if (state.consecutiveWrong >= 2 && state.currentDifficulty !== "EASY") {
      state.currentDifficulty = state.currentDifficulty === "HARD" ? "MEDIUM" : "EASY";
      state.consecutiveWrong = 0;
    }
  }
}

/**
 * Record answer in skill results map.
 */
export function recordAnswer(state: CATState, itemId: string, skillId: string, isCorrect: boolean): void {
  state.answeredItemIds.push(itemId);

  const prev = state.skillResults.get(skillId) ?? { correct: 0, total: 0 };
  prev.total++;
  if (isCorrect) prev.correct++;
  state.skillResults.set(skillId, prev);

  updateDifficulty(state, isCorrect);
}

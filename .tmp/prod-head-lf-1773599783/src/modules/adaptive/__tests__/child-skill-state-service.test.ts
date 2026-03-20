/**
 * Unit tests for mastery calculation algorithm.
 */

import { describe, expect, it } from "vitest";
import { computeMasteryScore, masteryLevelFromScore } from "../child-skill-state-service";

describe("masteryLevelFromScore", () => {
  it("returns NOT_STARTED for 0", () => {
    expect(masteryLevelFromScore(0)).toBe("NOT_STARTED");
  });

  it("returns NOVICE for score 0.01-0.39", () => {
    expect(masteryLevelFromScore(0.1)).toBe("NOVICE");
    expect(masteryLevelFromScore(0.39)).toBe("NOVICE");
  });

  it("returns DEVELOPING for score 0.4-0.69", () => {
    expect(masteryLevelFromScore(0.4)).toBe("DEVELOPING");
    expect(masteryLevelFromScore(0.69)).toBe("DEVELOPING");
  });

  it("returns PROFICIENT for score 0.7-0.89", () => {
    expect(masteryLevelFromScore(0.7)).toBe("PROFICIENT");
    expect(masteryLevelFromScore(0.89)).toBe("PROFICIENT");
  });

  it("returns MASTERED for score >= 0.9", () => {
    expect(masteryLevelFromScore(0.9)).toBe("MASTERED");
    expect(masteryLevelFromScore(1.0)).toBe("MASTERED");
  });
});

describe("computeMasteryScore", () => {
  it("returns 0 for empty attempts", () => {
    expect(computeMasteryScore([])).toBe(0);
  });

  it("returns high score for all correct recent attempts", () => {
    const attempts = Array.from({ length: 10 }, () => ({
      isCorrect: true,
      responseMs: 3000,
    }));

    const score = computeMasteryScore(attempts);
    // All correct: recentAcc=1, overallAcc=1, consistency should be 1, speed ~0.5
    expect(score).toBeGreaterThan(0.8);
  });

  it("returns low score for all incorrect attempts", () => {
    const attempts = Array.from({ length: 10 }, () => ({
      isCorrect: false,
      responseMs: 5000,
    }));

    const score = computeMasteryScore(attempts);
    expect(score).toBeLessThan(0.3);
  });

  it("weights recent attempts more heavily", () => {
    // 5 wrong then 5 correct → recent accuracy is 100%
    const improving = [
      ...Array.from({ length: 5 }, () => ({ isCorrect: false, responseMs: 5000 })),
      ...Array.from({ length: 5 }, () => ({ isCorrect: true, responseMs: 3000 })),
    ];

    // 5 correct then 5 wrong → recent accuracy is 0%
    const declining = [
      ...Array.from({ length: 5 }, () => ({ isCorrect: true, responseMs: 3000 })),
      ...Array.from({ length: 5 }, () => ({ isCorrect: false, responseMs: 5000 })),
    ];

    const improvingScore = computeMasteryScore(improving);
    const decliningScore = computeMasteryScore(declining);

    // Improving should score higher due to recent accuracy weighting (0.5)
    expect(improvingScore).toBeGreaterThan(decliningScore);
  });

  it("handles single attempt", () => {
    const score = computeMasteryScore([{ isCorrect: true, responseMs: 2000 }]);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });

  it("handles attempts without responseMs", () => {
    const attempts = [
      { isCorrect: true, responseMs: null },
      { isCorrect: true, responseMs: null },
      { isCorrect: false, responseMs: null },
    ];

    const score = computeMasteryScore(attempts);
    expect(score).toBeGreaterThan(0);
  });
});

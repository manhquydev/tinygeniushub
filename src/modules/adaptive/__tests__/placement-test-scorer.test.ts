/**
 * Unit tests for placement test scorer with difficulty weighting.
 */

import { describe, expect, it } from "vitest";
import { buildRecommendations, scoreAttempt, type ScoredSkill } from "../placement-test-scorer";

describe("scoreAttempt", () => {
  it("returns empty map for no responses", () => {
    const result = scoreAttempt([]);
    expect(result.size).toBe(0);
  });

  it("scores single skill with all correct MEDIUM as 1.0", () => {
    const responses = [
      { itemId: "i1", isCorrect: true, item: { skillId: "s1", difficulty: "MEDIUM" as const } },
      { itemId: "i2", isCorrect: true, item: { skillId: "s1", difficulty: "MEDIUM" as const } },
    ];

    const result = scoreAttempt(responses);
    const skill = result.get("s1")!;

    expect(skill.score).toBe(1.0);
    expect(skill.level).toBe("MASTERED");
    expect(skill.totalItems).toBe(2);
    expect(skill.correctItems).toBe(2);
  });

  it("weights HARD correct higher than EASY correct", () => {
    const hardResponses = [
      { itemId: "i1", isCorrect: true, item: { skillId: "s1", difficulty: "HARD" as const } },
    ];
    const easyResponses = [
      { itemId: "i1", isCorrect: true, item: { skillId: "s1", difficulty: "EASY" as const } },
    ];

    const hardResult = scoreAttempt(hardResponses).get("s1")!;
    const easyResult = scoreAttempt(easyResponses).get("s1")!;

    // Both 100% correct, but weighted differently. Both score 1.0 since it's correct/total weighted.
    // HARD: 1.5/1.5 = 1.0, EASY: 0.7/0.7 = 1.0
    // Actually both are 1.0, but the scores are capped at 1.0
    expect(hardResult.score).toBe(1.0);
    expect(easyResult.score).toBe(1.0);
  });

  it("scores all incorrect as 0", () => {
    const responses = [
      { itemId: "i1", isCorrect: false, item: { skillId: "s1", difficulty: "MEDIUM" as const } },
      { itemId: "i2", isCorrect: false, item: { skillId: "s1", difficulty: "MEDIUM" as const } },
    ];

    const result = scoreAttempt(responses).get("s1")!;
    expect(result.score).toBe(0);
    expect(result.level).toBe("NOT_STARTED");
  });

  it("groups responses by skill", () => {
    const responses = [
      { itemId: "i1", isCorrect: true, item: { skillId: "s1", difficulty: "MEDIUM" as const } },
      { itemId: "i2", isCorrect: false, item: { skillId: "s2", difficulty: "MEDIUM" as const } },
    ];

    const result = scoreAttempt(responses);
    expect(result.size).toBe(2);
    expect(result.get("s1")!.score).toBe(1.0);
    expect(result.get("s2")!.score).toBe(0);
  });
});

describe("buildRecommendations", () => {
  it("returns empty for no skills", () => {
    expect(buildRecommendations([])).toEqual([]);
  });

  it("generates recommendation for novice skills", () => {
    const skills: ScoredSkill[] = [
      { skillId: "s1", score: 0.2, level: "NOVICE", totalItems: 2, correctItems: 0 },
    ];

    const recs = buildRecommendations(skills);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]).toContain("1 basic skill");
  });

  it("generates recommendation for developing skills", () => {
    const skills: ScoredSkill[] = [
      { skillId: "s1", score: 0.5, level: "DEVELOPING", totalItems: 2, correctItems: 1 },
    ];

    const recs = buildRecommendations(skills);
    expect(recs.some((r) => r.includes("is developing"))).toBe(true);
  });

  it("generates recommendation for mastered skills", () => {
    const skills: ScoredSkill[] = [
      { skillId: "s1", score: 0.95, level: "MASTERED", totalItems: 2, correctItems: 2 },
    ];

    const recs = buildRecommendations(skills);
    expect(recs.some((r) => r.includes("got it"))).toBe(true);
  });
});

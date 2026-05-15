/**
 * Unit tests for weekly report enricher and email template builder.
 */

import { MasteryLevel } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    childSkillState: {
      findMany: vi.fn(),
    },
    skillAttempt: {
      findMany: vi.fn(),
    },
    reviewQueue: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock,
}));

import { enrichWeeklyReport } from "../weekly-report-enricher";

const weekStart = new Date("2026-02-16T00:00:00Z");
const weekEnd = new Date("2026-02-22T23:59:59Z");

describe("enrichWeeklyReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty progress for child with no skill states", async () => {
    prismaMock.childSkillState.findMany
      .mockResolvedValueOnce([])   // allStates
      .mockResolvedValueOnce([]);  // previousStates
    prismaMock.skillAttempt.findMany.mockResolvedValueOnce([]);
    prismaMock.reviewQueue.findMany.mockResolvedValueOnce([]);

    const result = await enrichWeeklyReport("child-1", weekStart, weekEnd);

    expect(result.skillsProgress).toHaveLength(0);
    expect(result.reviewStats).toEqual({ scheduled: 0, completed: 0, accuracy: 0 });
  });

  it("groups skills by domain and computes counts", async () => {
    prismaMock.childSkillState.findMany
      .mockResolvedValueOnce([
        { skillId: "s1", masteryLevel: MasteryLevel.MASTERED, masteryScore: 0.95, skill: { domain: "MATH", nameVi: "Dem" } },
        { skillId: "s2", masteryLevel: MasteryLevel.DEVELOPING, masteryScore: 0.5, skill: { domain: "MATH", nameVi: "Cong" } },
        { skillId: "s3", masteryLevel: MasteryLevel.PROFICIENT, masteryScore: 0.8, skill: { domain: "ENGLISH_PHONICS", nameVi: "CVC" } },
      ])
      .mockResolvedValueOnce([]); // previousStates
    prismaMock.skillAttempt.findMany.mockResolvedValueOnce([]);
    prismaMock.reviewQueue.findMany.mockResolvedValueOnce([]);

    const result = await enrichWeeklyReport("child-1", weekStart, weekEnd);

    expect(result.skillsProgress).toHaveLength(2);

    const math = result.skillsProgress.find((p) => p.domain === "MATH")!;
    expect(math.totalSkills).toBe(2);
    expect(math.masteredCount).toBe(1);
    expect(math.developingCount).toBe(1);

    const phonics = result.skillsProgress.find((p) => p.domain === "ENGLISH_PHONICS")!;
    expect(phonics.totalSkills).toBe(1);
    expect(phonics.proficientCount).toBe(1);
  });

  it("computes review stats from week data", async () => {
    prismaMock.childSkillState.findMany
      .mockResolvedValueOnce([
        { skillId: "s1", masteryLevel: MasteryLevel.DEVELOPING, masteryScore: 0.5, skill: { domain: "MATH", nameVi: "Cong" } },
      ])
      .mockResolvedValueOnce([]);
    prismaMock.skillAttempt.findMany.mockResolvedValueOnce([
      { isCorrect: true, skillId: "s1" },
      { isCorrect: true, skillId: "s1" },
      { isCorrect: false, skillId: "s1" },
    ]);
    prismaMock.reviewQueue.findMany.mockResolvedValueOnce([
      { completedAt: new Date() },
      { completedAt: null },
    ]);

    const result = await enrichWeeklyReport("child-1", weekStart, weekEnd);

    expect(result.reviewStats.scheduled).toBe(2);
    expect(result.reviewStats.completed).toBe(1);
    expect(result.reviewStats.accuracy).toBeCloseTo(2 / 3, 2);
  });

  it("identifies top improvements from previous week", async () => {
    prismaMock.childSkillState.findMany
      .mockResolvedValueOnce([
        { skillId: "s1", masteryLevel: MasteryLevel.PROFICIENT, masteryScore: 0.8, skill: { domain: "MATH", nameVi: "Cong" } },
      ])
      .mockResolvedValueOnce([
        { skillId: "s1", masteryScore: 0.3 }, // previous score
      ]);
    prismaMock.skillAttempt.findMany.mockResolvedValueOnce([]);
    prismaMock.reviewQueue.findMany.mockResolvedValueOnce([]);

    const result = await enrichWeeklyReport("child-1", weekStart, weekEnd);

    const math = result.skillsProgress[0];
    expect(math.topImprovements).toHaveLength(1);
    expect(math.topImprovements[0].masteryBefore).toBe(0.3);
    expect(math.topImprovements[0].masteryAfter).toBe(0.8);
  });

  it("identifies skills needing attention", async () => {
    prismaMock.childSkillState.findMany
      .mockResolvedValueOnce([
        { skillId: "s1", masteryLevel: MasteryLevel.NOVICE, masteryScore: 0.2, skill: { domain: "MATH", nameVi: "Tru" } },
      ])
      .mockResolvedValueOnce([]);
    prismaMock.skillAttempt.findMany.mockResolvedValueOnce([]); // no attempts this week
    prismaMock.reviewQueue.findMany.mockResolvedValueOnce([]);

    const result = await enrichWeeklyReport("child-1", weekStart, weekEnd);

    const math = result.skillsProgress[0];
    expect(math.needsAttention).toHaveLength(1);
    expect(math.needsAttention[0].reason).toContain("Haven't practiced yet");
  });
});

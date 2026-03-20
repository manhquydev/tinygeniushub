/**
 * Unit tests for content sequencing engine: ready-skills filter, next lesson selection.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    childSkillState: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    skill: {
      findMany: vi.fn(),
    },
    lessonSkill: {
      findMany: vi.fn(),
    },
    lessonCompletion: {
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

import { getNextLesson, getReadySkills } from "../content-sequencing-engine";

describe("getReadySkills", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns skills with no prerequisites when not mastered", async () => {
    prismaMock.skill.findMany.mockResolvedValueOnce([
      {
        id: "skill-1",
        code: "MATH_COUNT",
        nameVi: "Dem so",
        gradeLevel: 1,
        prerequisites: [],
        childStates: [{ masteryLevel: "DEVELOPING", masteryScore: 0.5 }],
      },
    ]);

    const result = await getReadySkills("child-1", "MATH");

    expect(result).toHaveLength(1);
    expect(result[0].skillId).toBe("skill-1");
    expect(result[0].masteryScore).toBe(0.5);
  });

  it("excludes mastered skills", async () => {
    prismaMock.skill.findMany.mockResolvedValueOnce([
      {
        id: "skill-1",
        code: "MATH_COUNT",
        nameVi: "Dem so",
        gradeLevel: 1,
        prerequisites: [],
        childStates: [{ masteryLevel: "MASTERED", masteryScore: 0.95 }],
      },
    ]);

    const result = await getReadySkills("child-1", "MATH");
    expect(result).toHaveLength(0);
  });

  it("excludes skills with unmet prerequisites", async () => {
    prismaMock.skill.findMany.mockResolvedValueOnce([
      {
        id: "skill-prereq",
        code: "MATH_COUNT",
        nameVi: "Dem so",
        gradeLevel: 1,
        prerequisites: [],
        childStates: [{ masteryLevel: "DEVELOPING", masteryScore: 0.5 }],
      },
      {
        id: "skill-dependent",
        code: "MATH_ADD",
        nameVi: "Cong",
        gradeLevel: 1,
        prerequisites: [{ prerequisiteId: "skill-prereq" }],
        childStates: [{ masteryLevel: "NOT_STARTED", masteryScore: 0 }],
      },
    ]);

    const result = await getReadySkills("child-1", "MATH");

    // Only the prereq skill is ready (DEVELOPING), dependent not ready (prereq not PROFICIENT)
    expect(result).toHaveLength(1);
    expect(result[0].skillId).toBe("skill-prereq");
  });

  it("includes skill when all prerequisites are PROFICIENT or MASTERED", async () => {
    prismaMock.skill.findMany.mockResolvedValueOnce([
      {
        id: "skill-prereq",
        code: "MATH_COUNT",
        nameVi: "Dem so",
        gradeLevel: 1,
        prerequisites: [],
        childStates: [{ masteryLevel: "PROFICIENT", masteryScore: 0.8 }],
      },
      {
        id: "skill-dependent",
        code: "MATH_ADD",
        nameVi: "Cong",
        gradeLevel: 1,
        prerequisites: [{ prerequisiteId: "skill-prereq" }],
        childStates: [{ masteryLevel: "NOVICE", masteryScore: 0.2 }],
      },
    ]);

    const result = await getReadySkills("child-1", "MATH");

    // Both should be ready: prereq is PROFICIENT (not mastered), dependent's prereq is met
    expect(result).toHaveLength(2);
  });

  it("includes skills with no attempts (NOT_STARTED) when no prerequisites", async () => {
    prismaMock.skill.findMany.mockResolvedValueOnce([
      {
        id: "skill-1",
        code: "MATH_COUNT",
        nameVi: "Dem so",
        gradeLevel: 1,
        prerequisites: [],
        childStates: [], // no state yet
      },
    ]);

    const result = await getReadySkills("child-1", "MATH");
    expect(result).toHaveLength(1);
    expect(result[0].masteryScore).toBe(0);
  });
});

describe("getNextLesson", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when child has no skill states (cold start)", async () => {
    prismaMock.childSkillState.count.mockResolvedValueOnce(0);

    const result = await getNextLesson("child-1", "MATH");
    expect(result).toBeNull();
  });

  it("returns REVIEW lesson when review queue has due items", async () => {
    prismaMock.childSkillState.count.mockResolvedValueOnce(5);

    // getDueReviews mock
    prismaMock.reviewQueue.findMany.mockResolvedValueOnce([
      {
        id: "review-1",
        skillId: "skill-1",
        skill: { id: "skill-1", code: "MATH_COUNT", nameVi: "Dem so", domain: "MATH", gradeLevel: 1 },
      },
    ]);

    // findUncompletedLessonForSkill
    prismaMock.lessonSkill.findMany.mockResolvedValueOnce([
      { lessonId: "lesson-1", lesson: { id: "lesson-1", title: "Lesson 1" }, isPrimary: true },
    ]);
    prismaMock.lessonCompletion.findMany.mockResolvedValueOnce([]);

    const result = await getNextLesson("child-1", "MATH");

    expect(result).not.toBeNull();
    expect(result!.mode).toBe("REVIEW");
    expect(result!.reason).toBe("Review scheduled");
  });

  it("returns LEARN for skill with masteryScore < 0.4", async () => {
    prismaMock.childSkillState.count.mockResolvedValueOnce(5);
    // No due reviews
    prismaMock.reviewQueue.findMany.mockResolvedValueOnce([]);

    // getReadySkills
    prismaMock.skill.findMany.mockResolvedValueOnce([
      {
        id: "skill-1",
        code: "MATH_COUNT",
        nameVi: "Dem so",
        gradeLevel: 1,
        prerequisites: [],
        childStates: [{ masteryLevel: "NOVICE", masteryScore: 0.2 }],
      },
    ]);

    // findUncompletedLessonForSkill
    prismaMock.lessonSkill.findMany.mockResolvedValueOnce([
      { lessonId: "lesson-1", lesson: { id: "lesson-1", title: "Lesson 1" }, isPrimary: true },
    ]);
    prismaMock.lessonCompletion.findMany.mockResolvedValueOnce([]);

    const result = await getNextLesson("child-1", "MATH");

    expect(result).not.toBeNull();
    expect(result!.mode).toBe("LEARN");
    expect(result!.reason).toBe("New skill");
  });

  it("returns PRACTICE for skill with masteryScore >= 0.4", async () => {
    prismaMock.childSkillState.count.mockResolvedValueOnce(5);
    prismaMock.reviewQueue.findMany.mockResolvedValueOnce([]);

    prismaMock.skill.findMany.mockResolvedValueOnce([
      {
        id: "skill-1",
        code: "MATH_ADD",
        nameVi: "Cong",
        gradeLevel: 1,
        prerequisites: [],
        childStates: [{ masteryLevel: "DEVELOPING", masteryScore: 0.55 }],
      },
    ]);

    prismaMock.lessonSkill.findMany.mockResolvedValueOnce([
      { lessonId: "lesson-2", lesson: { id: "lesson-2", title: "Lesson 2" }, isPrimary: true },
    ]);
    prismaMock.lessonCompletion.findMany.mockResolvedValueOnce([]);

    const result = await getNextLesson("child-1", "MATH");

    expect(result).not.toBeNull();
    expect(result!.mode).toBe("PRACTICE");
    expect(result!.reason).toBe("Practice weak skill");
  });

  it("returns null when all lessons for ready skills are completed", async () => {
    prismaMock.childSkillState.count.mockResolvedValueOnce(5);
    prismaMock.reviewQueue.findMany.mockResolvedValueOnce([]);

    prismaMock.skill.findMany.mockResolvedValueOnce([
      {
        id: "skill-1",
        code: "MATH_COUNT",
        nameVi: "Dem so",
        gradeLevel: 1,
        prerequisites: [],
        childStates: [{ masteryLevel: "DEVELOPING", masteryScore: 0.5 }],
      },
    ]);

    // All lessons completed
    prismaMock.lessonSkill.findMany.mockResolvedValueOnce([
      { lessonId: "lesson-1", lesson: { id: "lesson-1" }, isPrimary: true },
    ]);
    prismaMock.lessonCompletion.findMany.mockResolvedValueOnce([
      { lessonId: "lesson-1" },
    ]);

    const result = await getNextLesson("child-1", "MATH");
    expect(result).toBeNull();
  });

  it("prioritizes lower gradeLevel skills", async () => {
    prismaMock.childSkillState.count.mockResolvedValueOnce(5);
    prismaMock.reviewQueue.findMany.mockResolvedValueOnce([]);

    prismaMock.skill.findMany.mockResolvedValueOnce([
      {
        id: "skill-g2",
        code: "MATH_ADD_2DIGIT",
        nameVi: "Cong 2 chu so",
        gradeLevel: 2,
        prerequisites: [],
        childStates: [{ masteryLevel: "NOVICE", masteryScore: 0.1 }],
      },
      {
        id: "skill-g1",
        code: "MATH_COUNT",
        nameVi: "Dem so",
        gradeLevel: 1,
        prerequisites: [],
        childStates: [{ masteryLevel: "NOVICE", masteryScore: 0.3 }],
      },
    ]);

    // Will be called for skill-g1 first (gradeLevel 1 sorted first)
    prismaMock.lessonSkill.findMany.mockResolvedValueOnce([
      { lessonId: "lesson-g1", lesson: { id: "lesson-g1", title: "G1 Lesson" }, isPrimary: true },
    ]);
    prismaMock.lessonCompletion.findMany.mockResolvedValueOnce([]);

    const result = await getNextLesson("child-1", "MATH");

    expect(result).not.toBeNull();
    expect(result!.skill.code).toBe("MATH_COUNT");
  });
});

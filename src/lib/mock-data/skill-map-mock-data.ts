/**
 * Mock data for Skill Progress Map UI.
 * Used while backend adaptive learning engine is being built.
 * Remove this file once real API endpoints are ready.
 */

export type MockMasteryLevel = "NOT_STARTED" | "NOVICE" | "DEVELOPING" | "PROFICIENT" | "MASTERED";
export type MockSkillDomain = "MATH" | "ENGLISH_PHONICS";
export type MockTrend = "IMPROVING" | "STABLE" | "DECLINING";

export interface MockSkillEntry {
  id: string;
  nameVi: string;
  iconEmoji: string | null;
  masteryScore: number;
  masteryLevel: MockMasteryLevel;
  isLocked: boolean;
  totalAttempts: number;
}

export interface MockSkillMap {
  domain: MockSkillDomain;
  totalSkills: number;
  masteredCount: number;
  overallProgress: number;
  skills: MockSkillEntry[];
}

export interface MockWeeklySummary {
  newProficient: Array<{ skillId: string; nameVi: string }>;
  biggestImprovement: { skillId: string; nameVi: string; delta: number } | null;
  reviewsCompleted: number;
  upcomingReviews: Array<{ skillId: string; nameVi: string; scheduledAt: string }>;
}

export interface MockDailyAttempt {
  date: string;
  correct: number;
  total: number;
}

export interface MockSkillDetail {
  skill: { nameVi: string; iconEmoji: string | null; domain: MockSkillDomain; gradeLevel: number };
  mastery: { score: number; level: MockMasteryLevel; totalAttempts: number; correctAttempts: number };
  recentAttempts: MockDailyAttempt[];
  nextReview: string | null;
  trend: MockTrend;
  prerequisites: Array<{ id: string; nameVi: string; masteryLevel: MockMasteryLevel }>;
}

export const MOCK_MATH_MAP: MockSkillMap = {
  domain: "MATH",
  totalSkills: 5,
  masteredCount: 1,
  overallProgress: 0.52,
  skills: [
    { id: "s1", nameVi: "Count numbers 1-20", iconEmoji: "🔢", masteryScore: 0.95, masteryLevel: "MASTERED", isLocked: false, totalAttempts: 28 },
    { id: "s2", nameVi: "1-digit addition", iconEmoji: "➕", masteryScore: 0.62, masteryLevel: "DEVELOPING", isLocked: false, totalAttempts: 18 },
    { id: "s3", nameVi: "1-digit subtraction", iconEmoji: "➖", masteryScore: 0.41, masteryLevel: "NOVICE", isLocked: false, totalAttempts: 10 },
    { id: "s4", nameVi: "Basic geometry", iconEmoji: "🔷", masteryScore: 0, masteryLevel: "NOT_STARTED", isLocked: true, totalAttempts: 0 },
    { id: "s5", nameVi: "Measurement", iconEmoji: "📏", masteryScore: 0, masteryLevel: "NOT_STARTED", isLocked: true, totalAttempts: 0 },
  ],
};

export const MOCK_ENGLISH_MAP: MockSkillMap = {
  domain: "ENGLISH_PHONICS",
  totalSkills: 4,
  masteredCount: 1,
  overallProgress: 0.56,
  skills: [
    { id: "e1", nameVi: "Alphabet A-Z", iconEmoji: "🔤", masteryScore: 0.95, masteryLevel: "MASTERED", isLocked: false, totalAttempts: 32 },
    { id: "e2", nameVi: "CVC Words", iconEmoji: "📝", masteryScore: 0.68, masteryLevel: "PROFICIENT", isLocked: false, totalAttempts: 20 },
    { id: "e3", nameVi: "Blends & Digraphs", iconEmoji: "🗣️", masteryScore: 0.22, masteryLevel: "NOVICE", isLocked: false, totalAttempts: 6 },
    { id: "e4", nameVi: "Sight Words", iconEmoji: "👀", masteryScore: 0, masteryLevel: "NOT_STARTED", isLocked: true, totalAttempts: 0 },
  ],
};

export const MOCK_WEEKLY_SUMMARY: MockWeeklySummary = {
  newProficient: [{ skillId: "e2", nameVi: "CVC Words" }],
  biggestImprovement: { skillId: "s2", nameVi: "1-digit addition", delta: 15 },
  reviewsCompleted: 3,
  upcomingReviews: [
    { skillId: "s1", nameVi: "Count numbers 1-20", scheduledAt: new Date(Date.now() + 86400000).toISOString() },
  ],
};

function buildMockDetail(id: string): MockSkillDetail | null {
  const allSkills = [...MOCK_MATH_MAP.skills, ...MOCK_ENGLISH_MAP.skills];
  const skill = allSkills.find((s) => s.id === id);
  if (!skill) return null;

  const domain: MockSkillDomain = id.startsWith("e") ? "ENGLISH_PHONICS" : "MATH";
  const correctRate = skill.masteryScore;

  const today = new Date();
  const attempts: MockDailyAttempt[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const total = 5;
    const baseCorrect = Math.max(1, Math.round(correctRate * total - 1 + i * 0.3));
    const correct = Math.min(total, Math.max(0, baseCorrect));
    attempts.push({ date: d.toISOString().split("T")[0], correct, total });
  }

  return {
    skill: { nameVi: skill.nameVi, iconEmoji: skill.iconEmoji, domain, gradeLevel: 1 },
    mastery: {
      score: skill.masteryScore,
      level: skill.masteryLevel,
      totalAttempts: skill.totalAttempts,
      correctAttempts: Math.round(skill.totalAttempts * skill.masteryScore),
    },
    recentAttempts: attempts,
    nextReview: skill.masteryScore > 0.3 ? new Date(Date.now() + 86400000).toISOString() : null,
    trend: skill.masteryScore >= 0.6 ? "IMPROVING" : skill.masteryScore >= 0.3 ? "STABLE" : "DECLINING",
    prerequisites: id === "s3" ? [{ id: "s2", nameVi: "1-digit addition", masteryLevel: "DEVELOPING" as MockMasteryLevel }] : [],
  };
}

export function getMockSkillDetail(skillId: string): MockSkillDetail | null {
  return buildMockDetail(skillId);
}

/**
 * Aggregate skill data for the Skill Progress Map UI (parent-facing).
 * Provides skill map, skill detail, and weekly summary.
 */

import { prisma } from "@/lib/db";
import type { MasteryLevel, SkillDomain } from "@prisma/client";

export interface SkillMapEntry {
  id: string;
  code: string;
  nameVi: string;
  gradeLevel: number;
  orderNo: number;
  iconEmoji: string | null;
  masteryScore: number;
  masteryLevel: MasteryLevel;
  isLocked: boolean;
  totalAttempts: number;
  lastAttemptAt: Date | null;
}

export interface SkillMapResult {
  domain: SkillDomain;
  totalSkills: number;
  masteredCount: number;
  overallProgress: number;
  skills: SkillMapEntry[];
}

export interface DailyAttemptGroup {
  date: string; // ISO date "YYYY-MM-DD"
  correct: number;
  total: number;
}

export type TrendDirection = "IMPROVING" | "STABLE" | "DECLINING";

export interface SkillDetailResult {
  skill: { id: string; code: string; nameVi: string; domain: SkillDomain; gradeLevel: number; iconEmoji: string | null };
  mastery: { score: number; level: MasteryLevel; totalAttempts: number; correctAttempts: number };
  recentAttempts: DailyAttemptGroup[];
  nextReview: Date | null;
  prerequisites: Array<{ id: string; nameVi: string; masteryLevel: MasteryLevel }>;
  trend: TrendDirection;
}

export interface WeeklySummaryResult {
  newProficient: Array<{ skillId: string; nameVi: string }>;
  biggestImprovement: { skillId: string; nameVi: string; delta: number } | null;
  reviewsCompleted: number;
  upcomingReviews: Array<{ skillId: string; nameVi: string; scheduledAt: Date }>;
}

/**
 * Get skill map for a child in a domain, including locked status.
 */
export async function getSkillMap(childId: string, domain: SkillDomain): Promise<SkillMapResult> {
  const [skills, childStates] = await Promise.all([
    prisma.skill.findMany({
      where: { domain },
      orderBy: [{ gradeLevel: "asc" }, { orderNo: "asc" }],
      select: {
        id: true,
        code: true,
        nameVi: true,
        gradeLevel: true,
        orderNo: true,
        iconEmoji: true,
        prerequisites: {
          select: { prerequisiteId: true },
        },
      },
    }),
    prisma.childSkillState.findMany({
      where: { childId },
      select: {
        skillId: true,
        masteryScore: true,
        masteryLevel: true,
        totalAttempts: true,
        lastAttemptAt: true,
      },
    }),
  ]);

  const stateMap = new Map(childStates.map((s) => [s.skillId, s]));

  // Build set of skills the child has reached PROFICIENT or MASTERED for prereq checks
  const proficientSkillIds = new Set(
    childStates
      .filter((s) => s.masteryLevel === "PROFICIENT" || s.masteryLevel === "MASTERED")
      .map((s) => s.skillId),
  );

  const entries: SkillMapEntry[] = skills.map((skill) => {
    const state = stateMap.get(skill.id);
    const isLocked = skill.prerequisites.length > 0 && !skill.prerequisites.every((p) => proficientSkillIds.has(p.prerequisiteId));

    return {
      id: skill.id,
      code: skill.code,
      nameVi: skill.nameVi,
      gradeLevel: skill.gradeLevel,
      orderNo: skill.orderNo,
      iconEmoji: skill.iconEmoji,
      masteryScore: state?.masteryScore ?? 0,
      masteryLevel: state?.masteryLevel ?? "NOT_STARTED",
      isLocked,
      totalAttempts: state?.totalAttempts ?? 0,
      lastAttemptAt: state?.lastAttemptAt ?? null,
    };
  });

  const masteredCount = entries.filter(
    (e) => e.masteryLevel === "PROFICIENT" || e.masteryLevel === "MASTERED",
  ).length;

  const overallProgress = entries.length > 0 ? masteredCount / entries.length : 0;

  return {
    domain,
    totalSkills: entries.length,
    masteredCount,
    overallProgress,
    skills: entries,
  };
}

/**
 * Get skill detail with recent attempt history and trend.
 */
export async function getSkillDetail(childId: string, skillId: string): Promise<SkillDetailResult | null> {
  const [skill, state, recentAttemptRows, prereqStates] = await Promise.all([
    prisma.skill.findUnique({
      where: { id: skillId },
      select: {
        id: true,
        code: true,
        nameVi: true,
        domain: true,
        gradeLevel: true,
        iconEmoji: true,
        prerequisites: {
          select: {
            prerequisite: { select: { id: true, nameVi: true } },
          },
        },
      },
    }),
    prisma.childSkillState.findUnique({
      where: { childId_skillId: { childId, skillId } },
    }),
    prisma.skillAttempt.findMany({
      where: { childId, skillId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { isCorrect: true, createdAt: true },
    }),
    prisma.childSkillState.findMany({
      where: {
        childId,
        skill: {
          dependents: { some: { skillId } },
        },
      },
      select: {
        skillId: true,
        masteryLevel: true,
        skill: { select: { nameVi: true } },
      },
    }),
  ]);

  if (!skill) return null;

  // Group attempts by day
  const dayMap = new Map<string, { correct: number; total: number }>();
  for (const attempt of recentAttemptRows) {
    const day = attempt.createdAt.toISOString().slice(0, 10);
    const existing = dayMap.get(day) ?? { correct: 0, total: 0 };
    existing.total += 1;
    if (attempt.isCorrect) existing.correct += 1;
    dayMap.set(day, existing);
  }
  const recentAttempts: DailyAttemptGroup[] = Array.from(dayMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([date, v]) => ({ date, correct: v.correct, total: v.total }));

  // Trend: compare last 2 days
  const trend = computeTrend(recentAttempts);

  const prerequisites = prereqStates.map((s) => ({
    id: s.skillId,
    nameVi: s.skill.nameVi,
    masteryLevel: s.masteryLevel,
  }));

  return {
    skill: {
      id: skill.id,
      code: skill.code,
      nameVi: skill.nameVi,
      domain: skill.domain,
      gradeLevel: skill.gradeLevel,
      iconEmoji: skill.iconEmoji,
    },
    mastery: {
      score: state?.masteryScore ?? 0,
      level: state?.masteryLevel ?? "NOT_STARTED",
      totalAttempts: state?.totalAttempts ?? 0,
      correctAttempts: state?.correctAttempts ?? 0,
    },
    recentAttempts,
    nextReview: state?.nextReviewAt ?? null,
    prerequisites,
    trend,
  };
}

function computeTrend(days: DailyAttemptGroup[]): TrendDirection {
  if (days.length < 2) return "STABLE";
  const last = days[days.length - 1];
  const prev = days[days.length - 2];
  const lastRate = last.total > 0 ? last.correct / last.total : 0;
  const prevRate = prev.total > 0 ? prev.correct / prev.total : 0;
  const delta = lastRate - prevRate;
  if (delta > 0.1) return "IMPROVING";
  if (delta < -0.1) return "DECLINING";
  return "STABLE";
}

/**
 * Get weekly summary: new proficient, biggest improvement, reviews.
 */
export async function getWeeklySummary(childId: string): Promise<WeeklySummaryResult> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [recentStates, upcomingReviewRows] = await Promise.all([
    prisma.childSkillState.findMany({
      where: { childId, updatedAt: { gte: weekAgo } },
      select: {
        skillId: true,
        masteryLevel: true,
        masteryScore: true,
        skill: { select: { nameVi: true } },
      },
    }),
    prisma.childSkillState.findMany({
      where: { childId, nextReviewAt: { gte: new Date(), lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
      orderBy: { nextReviewAt: "asc" },
      take: 5,
      select: { skillId: true, nextReviewAt: true, skill: { select: { nameVi: true } } },
    }),
  ]);

  const newProficient = recentStates
    .filter((s) => s.masteryLevel === "PROFICIENT" || s.masteryLevel === "MASTERED")
    .map((s) => ({ skillId: s.skillId, nameVi: s.skill.nameVi }));

  // Biggest improvement: skill with highest masteryScore among recently updated
  let biggestImprovement: { skillId: string; nameVi: string; delta: number } | null = null;
  if (recentStates.length > 0) {
    const best = recentStates.reduce((a, b) => (a.masteryScore > b.masteryScore ? a : b));
    biggestImprovement = { skillId: best.skillId, nameVi: best.skill.nameVi, delta: Math.round(best.masteryScore * 100) };
  }

  // Count reviews completed this week
  const reviewsCompleted = await prisma.skillAttempt.count({
    where: { childId, createdAt: { gte: weekAgo } },
  });

  const upcomingReviews = upcomingReviewRows
    .filter((r): r is typeof r & { nextReviewAt: Date } => r.nextReviewAt !== null)
    .map((r) => ({ skillId: r.skillId, nameVi: r.skill.nameVi, scheduledAt: r.nextReviewAt }));

  return {
    newProficient,
    biggestImprovement,
    reviewsCompleted,
    upcomingReviews,
  };
}

/**
 * Weekly report enricher - adds adaptive skill mastery data to existing weekly reports.
 * Integrates with weekly-report-service.ts to provide EnrichedSkillsSummary.
 */

import { MasteryLevel, type SkillDomain } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface SkillProgressByDomain {
  domain: SkillDomain;
  totalSkills: number;
  masteredCount: number;
  proficientCount: number;
  developingCount: number;
  overallMastery: number; // 0-1

  topImprovements: Array<{
    skillNameVi: string;
    masteryBefore: number;
    masteryAfter: number;
  }>;

  needsAttention: Array<{
    skillNameVi: string;
    mastery: number;
    reason: string;
  }>;
}

export interface ReviewStats {
  scheduled: number;
  completed: number;
  accuracy: number;
}

export interface EnrichedSkillsSummary {
  skillsProgress: SkillProgressByDomain[];
  reviewStats: ReviewStats;
}

const MASTERED_LEVELS: MasteryLevel[] = [MasteryLevel.MASTERED];
const PROFICIENT_LEVELS: MasteryLevel[] = [MasteryLevel.PROFICIENT];

/** Build enriched skills summary for a child over a week window. */
export async function enrichWeeklyReport(
  childId: string,
  weekStart: Date,
  weekEnd: Date,
): Promise<EnrichedSkillsSummary> {
  const [allStates, previousStates, weekAttempts, weekReviews] = await Promise.all([
    prisma.childSkillState.findMany({
      where: { childId },
      include: { skill: { select: { domain: true, nameVi: true } } },
    }),
    // Proxy "previous mastery" via states updated before weekStart
    prisma.childSkillState.findMany({
      where: { childId, updatedAt: { lt: weekStart } },
      select: { skillId: true, masteryScore: true },
    }),
    prisma.skillAttempt.findMany({
      where: { childId, createdAt: { gte: weekStart, lte: weekEnd } },
      select: { isCorrect: true, skillId: true },
    }),
    prisma.reviewQueue.findMany({
      where: { childId, scheduledAt: { gte: weekStart, lte: weekEnd } },
      select: { completedAt: true },
    }),
  ]);

  if (allStates.length === 0) {
    return {
      skillsProgress: [],
      reviewStats: { scheduled: 0, completed: 0, accuracy: 0 },
    };
  }

  const prevScoreMap = new Map(previousStates.map((s) => [s.skillId, s.masteryScore]));

  // Group by domain
  const byDomain = new Map<SkillDomain, typeof allStates>();
  for (const state of allStates) {
    const domain = state.skill.domain;
    if (!byDomain.has(domain)) byDomain.set(domain, []);
    byDomain.get(domain)!.push(state);
  }

  const skillsProgress: SkillProgressByDomain[] = [];

  for (const [domain, states] of byDomain) {
    const masteredCount = states.filter((s) => MASTERED_LEVELS.includes(s.masteryLevel)).length;
    const proficientCount = states.filter((s) => PROFICIENT_LEVELS.includes(s.masteryLevel)).length;
    const developingCount = states.filter(
      (s) => s.masteryLevel === MasteryLevel.DEVELOPING,
    ).length;
    const overallMastery =
      states.reduce((sum, s) => sum + s.masteryScore, 0) / states.length;

    // Skills with most improvement this week
    const improvements = states
      .map((s) => ({
        skillNameVi: s.skill.nameVi,
        masteryBefore: prevScoreMap.get(s.skillId) ?? 0,
        masteryAfter: s.masteryScore,
      }))
      .filter((i) => i.masteryAfter > i.masteryBefore)
      .sort((a, b) => b.masteryAfter - b.masteryBefore - (a.masteryAfter - a.masteryBefore))
      .slice(0, 3);

    // Skills needing attention: no progress or low mastery
    const weekAttemptSkillIds = new Set(weekAttempts.map((a) => a.skillId));
    const needsAttention = states
      .filter((s) => s.masteryScore < 0.4)
      .map((s) => ({
        skillNameVi: s.skill.nameVi,
        mastery: s.masteryScore,
        reason: weekAttemptSkillIds.has(s.skillId) ? "Đang học nhưng chưa tiến bộ" : "Chưa luyện tập tuần này",
      }))
      .slice(0, 3);

    skillsProgress.push({
      domain,
      totalSkills: states.length,
      masteredCount,
      proficientCount,
      developingCount,
      overallMastery,
      topImprovements: improvements,
      needsAttention,
    });
  }

  const reviewScheduled = weekReviews.length;
  const reviewCompleted = weekReviews.filter((r) => r.completedAt !== null).length;
  const correctAttempts = weekAttempts.filter((a) => a.isCorrect).length;
  const reviewAccuracy = weekAttempts.length > 0 ? correctAttempts / weekAttempts.length : 0;

  return {
    skillsProgress,
    reviewStats: {
      scheduled: reviewScheduled,
      completed: reviewCompleted,
      accuracy: reviewAccuracy,
    },
  };
}

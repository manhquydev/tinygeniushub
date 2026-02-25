/**
 * Adaptive learning analytics service.
 * Provides aggregate queries for child learning trajectories,
 * class skill heatmaps, and skill gap reports.
 */

import { MasteryLevel, type SkillDomain } from "@prisma/client";
import { prisma } from "@/lib/db";
import { subWeeks, startOfWeek, endOfWeek } from "date-fns";

export interface WeeklyTrajectoryPoint {
  weekStart: Date;
  overallMastery: number; // 0-1 average masteryScore
  newSkillsMastered: number;
  reviewAccuracy: number; // 0-1
}

export interface LearningTrajectory {
  childId: string;
  weeks: WeeklyTrajectoryPoint[];
}

export interface ClassSkillHeatmapStudent {
  childId: string;
  nickname: string;
  skillMasteries: Array<{ skillId: string; masteryLevel: MasteryLevel; score: number }>;
}

export interface ClassSkillHeatmap {
  skills: Array<{ id: string; code: string; nameVi: string }>;
  students: ClassSkillHeatmapStudent[];
  classAverages: Array<{ skillId: string; avgScore: number }>;
  gapAlerts: Array<{
    skillId: string;
    nameVi: string;
    belowProficientCount: number;
    belowProficientPercent: number;
  }>;
}

export interface SkillGapAlert {
  skillId: string;
  nameVi: string;
  belowProficientPercent: number;
  affectedStudentCount: number;
  suggestedAction: string;
}

const PROFICIENT_LEVELS: MasteryLevel[] = [MasteryLevel.PROFICIENT, MasteryLevel.MASTERED];

/** Get learning trajectory for a child over the last N weeks. */
export async function getChildLearningTrajectory(
  childId: string,
  weeks = 8,
): Promise<LearningTrajectory> {
  const now = new Date();
  const weekPoints: WeeklyTrajectoryPoint[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const ref = subWeeks(now, i);
    const weekStart = startOfWeek(ref, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(ref, { weekStartsOn: 1 });

    const [states, attempts, reviews] = await Promise.all([
      prisma.childSkillState.findMany({
        where: { childId, updatedAt: { lte: weekEnd } },
        select: { masteryScore: true, masteryLevel: true, updatedAt: true },
      }),
      prisma.skillAttempt.findMany({
        where: { childId, createdAt: { gte: weekStart, lte: weekEnd } },
        select: { isCorrect: true, createdAt: true },
      }),
      prisma.reviewQueue.findMany({
        where: { childId, scheduledAt: { gte: weekStart, lte: weekEnd } },
        select: { completedAt: true },
      }),
    ]);

    const overallMastery =
      states.length > 0
        ? states.reduce((sum, s) => sum + s.masteryScore, 0) / states.length
        : 0;

    const newSkillsMastered = states.filter(
      (s) =>
        s.masteryLevel === MasteryLevel.MASTERED &&
        s.updatedAt >= weekStart &&
        s.updatedAt <= weekEnd,
    ).length;

    const completedReviews = reviews.filter((r) => r.completedAt !== null);
    const correctAttempts = attempts.filter((a) => a.isCorrect).length;
    const reviewAccuracy =
      attempts.length > 0 ? correctAttempts / attempts.length : 0;

    weekPoints.push({ weekStart, overallMastery, newSkillsMastered, reviewAccuracy });
  }

  return { childId, weeks: weekPoints };
}

/** Get class skill heatmap for an org. Only includes skills with >=1 attempt in the class. */
export async function getClassSkillHeatmap(
  orgId: string,
  domain: SkillDomain,
): Promise<ClassSkillHeatmap> {
  // Get children in this org via member parentIds
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: orgId },
    select: { parentId: true },
  });
  const parentIds = members.map((m) => m.parentId);

  const childProfiles = await prisma.childProfile.findMany({
    where: { parentId: { in: parentIds } },
    select: { id: true, nickname: true },
  });
  const children = childProfiles.map((c) => ({ childId: c.id, nickname: c.nickname }));

  if (children.length === 0) {
    return { skills: [], students: [], classAverages: [], gapAlerts: [] };
  }

  const childIds = children.map((c) => c.childId);

  // Find skills with at least 1 attempt in this class
  const skillAttempts = await prisma.skillAttempt.findMany({
    where: { childId: { in: childIds }, skill: { domain } },
    select: { skillId: true },
    distinct: ["skillId"],
  });
  const activeSkillIds = skillAttempts.map((a) => a.skillId);

  if (activeSkillIds.length === 0) {
    return { skills: [], students: children.map((c) => ({ ...c, skillMasteries: [] })), classAverages: [], gapAlerts: [] };
  }

  const [skills, allStates] = await Promise.all([
    prisma.skill.findMany({
      where: { id: { in: activeSkillIds }, domain },
      select: { id: true, code: true, nameVi: true },
      orderBy: { orderNo: "asc" },
    }),
    prisma.childSkillState.findMany({
      where: { childId: { in: childIds }, skillId: { in: activeSkillIds } },
      select: { childId: true, skillId: true, masteryLevel: true, masteryScore: true },
    }),
  ]);

  const stateMap = new Map(allStates.map((s) => [`${s.childId}:${s.skillId}`, s]));

  const students: ClassSkillHeatmapStudent[] = children.map((c) => ({
    childId: c.childId,
    nickname: c.nickname,
    skillMasteries: skills.map((sk) => {
      const state = stateMap.get(`${c.childId}:${sk.id}`);
      return {
        skillId: sk.id,
        masteryLevel: state?.masteryLevel ?? MasteryLevel.NOT_STARTED,
        score: state?.masteryScore ?? 0,
      };
    }),
  }));

  const totalStudents = children.length;

  const classAverages = skills.map((sk) => {
    const scores = allStates.filter((s) => s.skillId === sk.id).map((s) => s.masteryScore);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return { skillId: sk.id, avgScore };
  });

  const gapAlerts = skills
    .map((sk) => {
      const classStates = allStates.filter((s) => s.skillId === sk.id);
      const belowCount = classStates.filter(
        (s) => !PROFICIENT_LEVELS.includes(s.masteryLevel),
      ).length;
      // Students with no state are also below proficient
      const withNoState = totalStudents - classStates.length;
      const totalBelow = belowCount + withNoState;
      const percent = totalStudents > 0 ? totalBelow / totalStudents : 0;
      return {
        skillId: sk.id,
        nameVi: sk.nameVi,
        belowProficientCount: totalBelow,
        belowProficientPercent: percent,
      };
    })
    .filter((g) => g.belowProficientPercent > 0.3);

  return { skills, students, classAverages, gapAlerts };
}

/** Get skill gap report for an org/domain with recommendations. */
export async function getSkillGapReport(
  orgId: string,
  domain: SkillDomain,
): Promise<{ gapAlerts: SkillGapAlert[] }> {
  const heatmap = await getClassSkillHeatmap(orgId, domain);

  const gapAlerts: SkillGapAlert[] = heatmap.gapAlerts.map((g) => ({
    skillId: g.skillId,
    nameVi: g.nameVi,
    belowProficientPercent: g.belowProficientPercent,
    affectedStudentCount: g.belowProficientCount,
    suggestedAction:
      g.belowProficientPercent > 0.6
        ? "Cần dạy lại toàn lớp kỹ năng này"
        : "Tổ chức nhóm ôn tập cho học sinh dưới mức thành thạo",
  }));

  return { gapAlerts };
}

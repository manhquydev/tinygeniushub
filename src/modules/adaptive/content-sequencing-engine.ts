/**
 * Adaptive content sequencing engine.
 * Determines the next lesson for a child based on:
 *  1. Spaced-repetition review queue (due reviews first)
 *  2. Ready skills (prerequisites met, not yet mastered)
 *  3. Priority: lowest grade level + lowest mastery score
 *
 * Cold start: if no ChildSkillState exists → returns null (caller falls back to sequential).
 */

import { prisma } from "@/lib/db";
import type { Lesson } from "@prisma/client";
import { getDueReviews } from "./spaced-repetition-service";
import type { SkillDomain } from "./types";

export type LessonMode = "LEARN" | "PRACTICE" | "REVIEW";

export interface NextLessonResult {
  lesson: Lesson;
  mode: LessonMode;
  skill: { id: string; code: string; nameVi: string; gradeLevel: number };
  reason: string;
}

/**
 * Main entry point: get the next recommended lesson for a child in a domain.
 * Returns null when no suitable lesson found (all mastered or no lessons tagged).
 */
export async function getNextLesson(
  childId: string,
  domain: SkillDomain,
): Promise<NextLessonResult | null> {
  // Cold start check: no skill states at all → return null
  const stateCount = await prisma.childSkillState.count({ where: { childId } });
  if (stateCount === 0) return null;

  // Step 1: Check review queue
  const dueReviews = await getDueReviews(childId, domain);
  if (dueReviews.length > 0) {
    const dueItem = dueReviews[0];
    const lesson = await findUncompletedLessonForSkill(dueItem.skillId, childId);
    if (lesson) {
      return {
        lesson,
        mode: "REVIEW",
        skill: {
          id: dueItem.skill.id,
          code: dueItem.skill.code,
          nameVi: dueItem.skill.nameVi,
          gradeLevel: dueItem.skill.gradeLevel,
        },
        reason: "Review scheduled",
      };
    }
  }

  // Step 2: Find ready skills (prereqs met, not mastered)
  const readySkills = await getReadySkills(childId, domain);
  if (readySkills.length === 0) return null;

  // Step 3: Sort by gradeLevel ASC, then masteryScore ASC
  readySkills.sort((a, b) => {
    if (a.skill.gradeLevel !== b.skill.gradeLevel) return a.skill.gradeLevel - b.skill.gradeLevel;
    return a.masteryScore - b.masteryScore;
  });

  for (const skillState of readySkills) {
    const lesson = await findUncompletedLessonForSkill(skillState.skillId, childId);
    if (lesson) {
      const mode: LessonMode = skillState.masteryScore < 0.4 ? "LEARN" : "PRACTICE";
      return {
        lesson,
        mode,
        skill: {
          id: skillState.skillId,
          code: skillState.skill.code,
          nameVi: skillState.skill.nameVi,
          gradeLevel: skillState.skill.gradeLevel,
        },
        reason: mode === "LEARN" ? "New skill" : "Practice weak skill",
      };
    }
  }

  return null;
}

/**
 * Get skills in a domain where:
 *  - child has not MASTERED
 *  - all prerequisites are PROFICIENT or MASTERED (or no prerequisites)
 */
export async function getReadySkills(
  childId: string,
  domain: SkillDomain,
): Promise<
  Array<{
    skillId: string;
    masteryScore: number;
    skill: { code: string; nameVi: string; gradeLevel: number };
  }>
> {
  const allSkills = await prisma.skill.findMany({
    where: { domain },
    include: {
      prerequisites: { select: { prerequisiteId: true } },
      childStates: {
        where: { childId },
        select: { masteryLevel: true, masteryScore: true },
      },
    },
  });

  // Build a map for quick lookup of mastery level by skillId
  const masteryMap = new Map<string, string>();
  for (const skill of allSkills) {
    const state = skill.childStates[0];
    masteryMap.set(skill.id, state?.masteryLevel ?? "NOT_STARTED");
  }

  const ready: Array<{
    skillId: string;
    masteryScore: number;
    skill: { code: string; nameVi: string; gradeLevel: number };
  }> = [];

  for (const skill of allSkills) {
    const state = skill.childStates[0];

    // Skip already mastered skills
    if (state?.masteryLevel === "MASTERED") continue;

    // Check all prerequisites are PROFICIENT or MASTERED
    if (skill.prerequisites.length > 0) {
      const prereqsMet = skill.prerequisites.every((p) => {
        const level = masteryMap.get(p.prerequisiteId);
        return level === "PROFICIENT" || level === "MASTERED";
      });
      if (!prereqsMet) continue;
    }

    ready.push({
      skillId: skill.id,
      masteryScore: state?.masteryScore ?? 0,
      skill: { code: skill.code, nameVi: skill.nameVi, gradeLevel: skill.gradeLevel },
    });
  }

  return ready;
}

/**
 * Find a lesson tagged to a skill that the child has not yet completed.
 * Prefers primary skill lessons, then falls back to any lesson for the skill.
 */
export async function findUncompletedLessonForSkill(
  skillId: string,
  childId: string,
): Promise<Lesson | null> {
  // Get all lessons for this skill, primary first
  const lessonSkills = await prisma.lessonSkill.findMany({
    where: { skillId },
    include: {
      lesson: true,
    },
    orderBy: { isPrimary: "desc" },
  });

  if (lessonSkills.length === 0) return null;

  // Get completed lesson IDs for child
  const completedIds = await prisma.lessonCompletion
    .findMany({
      where: { childId, lessonId: { in: lessonSkills.map((ls) => ls.lessonId) } },
      select: { lessonId: true },
    })
    .then((rows) => new Set(rows.map((r) => r.lessonId)));

  const uncompleted = lessonSkills.find((ls) => !completedIds.has(ls.lessonId));
  return uncompleted?.lesson ?? null;
}

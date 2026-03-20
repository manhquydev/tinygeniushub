/**
 * Shared types for the adaptive learning engine module.
 */

import type { DifficultyLevel, MasteryLevel, SkillDomain } from "@prisma/client";

export type { DifficultyLevel, MasteryLevel, SkillDomain };

export interface SkillNode {
  id: string;
  code: string;
  domain: SkillDomain;
  nameVi: string;
  nameEn: string | null;
  description: string | null;
  gradeLevel: number;
  orderNo: number;
  parentId: string | null;
  iconEmoji: string | null;
  children?: SkillNode[];
}

export interface SkillWithPrerequisites extends SkillNode {
  prerequisites: Array<{ id: string; code: string; nameVi: string }>;
}

export interface CreateSkillInput {
  code: string;
  domain: SkillDomain;
  nameVi: string;
  nameEn?: string;
  description?: string;
  gradeLevel: number;
  orderNo?: number;
  parentId?: string;
  iconEmoji?: string;
}

export interface UpdateSkillInput {
  nameVi?: string;
  nameEn?: string;
  description?: string;
  gradeLevel?: number;
  orderNo?: number;
  parentId?: string | null;
  iconEmoji?: string | null;
}

export interface MasteryWeights {
  recentAccuracy: number;
  overallAccuracy: number;
  consistency: number;
  speed: number;
}

export interface MasteryCalculationResult {
  score: number;
  level: MasteryLevel;
}

export interface AttemptInput {
  childId: string;
  skillId: string;
  activityId?: string;
  isCorrect: boolean;
  responseMs?: number;
  difficulty?: DifficultyLevel;
  rawResponse?: Record<string, unknown>;
}

export interface TagLessonWithSkillsInput {
  lessonId: string;
  skillIds: string[];
  primarySkillId?: string;
}

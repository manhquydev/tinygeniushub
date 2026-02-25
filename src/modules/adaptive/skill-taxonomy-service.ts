/**
 * Service for managing skill taxonomy: CRUD for skills and prerequisites.
 * Supports DAG structure (skills can have multiple prerequisites).
 */

import { prisma } from "@/lib/db";
import type { SkillDomain } from "@prisma/client";
import type { CreateSkillInput, SkillNode, SkillWithPrerequisites, UpdateSkillInput } from "./types";

/**
 * List all skills for a domain, returned as flat list sorted by gradeLevel, orderNo.
 */
export async function listSkillsByDomain(domain: SkillDomain): Promise<SkillNode[]> {
  const skills = await prisma.skill.findMany({
    where: { domain },
    orderBy: [{ gradeLevel: "asc" }, { orderNo: "asc" }],
    select: {
      id: true,
      code: true,
      domain: true,
      nameVi: true,
      nameEn: true,
      description: true,
      gradeLevel: true,
      orderNo: true,
      parentId: true,
      iconEmoji: true,
    },
  });
  return skills;
}

/**
 * Build tree structure from flat skill list.
 */
export function buildSkillTree(skills: SkillNode[]): SkillNode[] {
  const map = new Map<string, SkillNode & { children: SkillNode[] }>();
  for (const s of skills) {
    map.set(s.id, { ...s, children: [] });
  }
  const roots: SkillNode[] = [];
  for (const s of map.values()) {
    if (s.parentId && map.has(s.parentId)) {
      map.get(s.parentId)!.children!.push(s);
    } else {
      roots.push(s);
    }
  }
  return roots;
}

/**
 * List all skills as tree (all domains).
 */
export async function listAllSkillsAsTree(): Promise<SkillNode[]> {
  const skills = await prisma.skill.findMany({
    orderBy: [{ domain: "asc" }, { gradeLevel: "asc" }, { orderNo: "asc" }],
    select: {
      id: true,
      code: true,
      domain: true,
      nameVi: true,
      nameEn: true,
      description: true,
      gradeLevel: true,
      orderNo: true,
      parentId: true,
      iconEmoji: true,
    },
  });
  return buildSkillTree(skills);
}

/**
 * Get a single skill with its prerequisites.
 */
export async function getSkillWithPrerequisites(skillId: string): Promise<SkillWithPrerequisites | null> {
  const skill = await prisma.skill.findUnique({
    where: { id: skillId },
    include: {
      prerequisites: {
        include: {
          prerequisite: { select: { id: true, code: true, nameVi: true } },
        },
      },
    },
  });
  if (!skill) return null;
  return {
    ...skill,
    prerequisites: skill.prerequisites.map((p) => p.prerequisite),
  };
}

/**
 * Create a new skill. Returns the created skill.
 */
export async function createSkill(input: CreateSkillInput): Promise<SkillNode> {
  const skill = await prisma.skill.create({
    data: {
      code: input.code.toUpperCase(),
      domain: input.domain,
      nameVi: input.nameVi,
      nameEn: input.nameEn,
      description: input.description,
      gradeLevel: input.gradeLevel,
      orderNo: input.orderNo ?? 0,
      parentId: input.parentId,
      iconEmoji: input.iconEmoji,
    },
  });
  return skill;
}

/**
 * Update an existing skill.
 */
export async function updateSkill(skillId: string, input: UpdateSkillInput): Promise<SkillNode> {
  const skill = await prisma.skill.update({
    where: { id: skillId },
    data: {
      ...input,
    },
  });
  return skill;
}

/**
 * Add prerequisite relationship. Validates no circular dependency.
 */
export async function addPrerequisite(skillId: string, prerequisiteId: string): Promise<void> {
  if (skillId === prerequisiteId) {
    throw new Error("A skill cannot be its own prerequisite");
  }
  // Check that prerequisiteId doesn't already depend (directly or transitively) on skillId
  const hasCycle = await wouldCreateCycle(skillId, prerequisiteId);
  if (hasCycle) {
    throw new Error("Adding this prerequisite would create a circular dependency");
  }
  await prisma.skillPrerequisite.create({
    data: { skillId, prerequisiteId },
  });
}

/**
 * Remove prerequisite relationship.
 */
export async function removePrerequisite(skillId: string, prerequisiteId: string): Promise<void> {
  await prisma.skillPrerequisite.deleteMany({
    where: { skillId, prerequisiteId },
  });
}

/**
 * BFS check: would adding prerequisiteId -> skillId create a cycle?
 * A cycle happens if skillId is an ancestor of prerequisiteId.
 */
async function wouldCreateCycle(skillId: string, prerequisiteId: string): Promise<boolean> {
  // Check if skillId is reachable from prerequisiteId via existing prerequisites
  const visited = new Set<string>();
  const queue = [prerequisiteId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === skillId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    const prereqs = await prisma.skillPrerequisite.findMany({
      where: { skillId: current },
      select: { prerequisiteId: true },
    });
    queue.push(...prereqs.map((p) => p.prerequisiteId));
  }
  return false;
}

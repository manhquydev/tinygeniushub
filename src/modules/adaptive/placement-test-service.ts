/**
 * Placement test business logic service.
 * Handles start, answer, and complete flows with CAT algorithm.
 */

import { prisma } from "@/lib/db";
import type { SkillDomain } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { masteryLevelFromScore } from "./child-skill-state-service";
import {
  createInitialCATState,
  reconstructCATState,
  recordAnswer,
  selectNextItem,
  type PlacementTestItemBase,
} from "./placement-test-engine";
import { buildRecommendations, scoreAttempt } from "./placement-test-scorer";

const COOLDOWN_DAYS = 30;

export interface StartTestResult {
  attemptId: string;
  firstItem: PlacementTestItemPublic | null;
  totalItemsEstimate: number;
}

export interface AnswerResult {
  isCorrect: boolean;
  nextItem: PlacementTestItemPublic | null;
  isComplete: boolean;
  progress: { answered: number; total: number };
}

export interface PlacementTestItemPublic {
  id: string;
  activityType: string;
  activitySpec: unknown;
  audioUrl: string | null;
  difficulty: string;
}

/**
 * Check if child can start a placement test for a given domain.
 * Returns null if allowed, or error message if blocked.
 */
export async function checkPlacementEligibility(
  childId: string,
  domain: SkillDomain,
): Promise<{ eligible: boolean; reason?: string; lastAttemptDate?: Date }> {
  const test = await prisma.placementTest.findFirst({
    where: { domain, isActive: true },
  });

  if (!test) {
    return { eligible: false, reason: "No active placement test found for this domain" };
  }

  // Check cooldown: one attempt per domain per 30 days
  const cooldownDate = new Date();
  cooldownDate.setDate(cooldownDate.getDate() - COOLDOWN_DAYS);

  const recentAttempt = await prisma.placementTestAttempt.findFirst({
    where: {
      childId,
      testId: test.id,
      completedAt: { not: null },
      startedAt: { gte: cooldownDate },
    },
    orderBy: { startedAt: "desc" },
  });

  if (recentAttempt) {
    return {
      eligible: false,
      reason: `Placement test for this domain can only be retaken after ${COOLDOWN_DAYS} days`,
      lastAttemptDate: recentAttempt.startedAt,
    };
  }

  return { eligible: true };
}

/**
 * Start a new placement test attempt for a child.
 */
export async function startPlacementTest(childId: string, domain: SkillDomain): Promise<StartTestResult> {
  const eligibility = await checkPlacementEligibility(childId, domain);
  if (!eligibility.eligible) {
    throw new Error(eligibility.reason ?? "Not eligible for placement test");
  }

  const test = await prisma.placementTest.findFirstOrThrow({
    where: { domain, isActive: true },
    include: { items: { orderBy: { orderHint: "asc" } } },
  });

  const attempt = await prisma.placementTestAttempt.create({
    data: { childId, testId: test.id },
  });

  const state = createInitialCATState();
  const firstItem = selectNextItem(state, test.items as PlacementTestItemBase[]);

  return {
    attemptId: attempt.id,
    firstItem: firstItem ? toPublicItem(firstItem) : null,
    totalItemsEstimate: test.maxItems,
  };
}

/**
 * Submit an answer for the current item in a placement attempt.
 */
export async function answerPlacementItem(
  attemptId: string,
  itemId: string,
  response: unknown,
  responseMs?: number,
): Promise<AnswerResult> {
  const attempt = await prisma.placementTestAttempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: {
      test: { include: { items: { orderBy: { orderHint: "asc" } } } },
      responses: { include: { item: true }, orderBy: { answeredAt: "asc" } },
    },
  });

  if (attempt.completedAt) {
    throw new Error("Attempt already completed");
  }

  const item = attempt.test.items.find((i) => i.id === itemId);
  if (!item) {
    throw new Error("Item not found in this test");
  }

  // Check if already answered
  if (attempt.responses.some((r) => r.itemId === itemId)) {
    throw new Error("Item already answered");
  }

  // Evaluate correctness
  const isCorrect = evaluateAnswer(item.activitySpec as Record<string, unknown>, response);

  // Save response
  await prisma.placementTestResponse.create({
    data: {
      attemptId,
      itemId,
      isCorrect,
      responseMs,
      rawResponse: response as Prisma.InputJsonValue,
    },
  });

  // Update attempt counters
  await prisma.placementTestAttempt.update({
    where: { id: attemptId },
    data: {
      totalItems: { increment: 1 },
      correctItems: isCorrect ? { increment: 1 } : undefined,
    },
  });

  // Reconstruct CAT state including new response
  const allResponses = [
    ...attempt.responses.map((r) => ({
      itemId: r.itemId,
      isCorrect: r.isCorrect,
      item: r.item as PlacementTestItemBase,
    })),
    { itemId, isCorrect, item: item as PlacementTestItemBase },
  ];

  const state = reconstructCATState(allResponses);
  recordAnswer(state, itemId, item.skillId, isCorrect);

  const totalAnswered = allResponses.length;
  const isComplete = totalAnswered >= attempt.test.maxItems;

  if (isComplete) {
    await completePlacementAttempt(attemptId, attempt.test.items as PlacementTestItemBase[]);
    return {
      isCorrect,
      nextItem: null,
      isComplete: true,
      progress: { answered: totalAnswered, total: attempt.test.maxItems },
    };
  }

  const nextItem = selectNextItem(state, attempt.test.items as PlacementTestItemBase[]);

  return {
    isCorrect,
    nextItem: nextItem ? toPublicItem(nextItem) : null,
    isComplete: !nextItem,
    progress: { answered: totalAnswered, total: attempt.test.maxItems },
  };
}

/**
 * Complete a placement attempt: score it and update ChildSkillState.
 */
async function completePlacementAttempt(attemptId: string, allItems: PlacementTestItemBase[]): Promise<void> {
  const responses = await prisma.placementTestResponse.findMany({
    where: { attemptId },
    include: { item: { select: { skillId: true, difficulty: true } } },
  });

  const scored = scoreAttempt(responses.map((r) => ({
    itemId: r.itemId,
    isCorrect: r.isCorrect,
    item: { skillId: r.item.skillId, difficulty: r.item.difficulty },
  })));

  const attempt = await prisma.placementTestAttempt.findUniqueOrThrow({
    where: { id: attemptId },
    select: { childId: true },
  });

  // Update ChildSkillState for each scored skill
  for (const [skillId, result] of scored) {
    await prisma.childSkillState.upsert({
      where: { childId_skillId: { childId: attempt.childId, skillId } },
      update: {
        masteryScore: result.score,
        masteryLevel: result.level,
        totalAttempts: { increment: result.totalItems },
        correctAttempts: { increment: result.correctItems },
        lastAttemptAt: new Date(),
      },
      create: {
        childId: attempt.childId,
        skillId,
        masteryScore: result.score,
        masteryLevel: result.level,
        totalAttempts: result.totalItems,
        correctAttempts: result.correctItems,
        lastAttemptAt: new Date(),
      },
    });
  }

  const skillLevels = Array.from(scored.values());
  const recommendations = buildRecommendations(skillLevels);

  await prisma.placementTestAttempt.update({
    where: { id: attemptId },
    data: {
      completedAt: new Date(),
      resultSummary: { skillLevels: skillLevels, recommendations } as unknown as Prisma.InputJsonValue,
    },
  });

  // Update child's placementResult field
  const allItems2 = allItems;
  const domain = allItems2.length > 0 ? await getDomainForItem(allItems2[0].id) : null;
  if (domain) {
    await prisma.childProfile.update({
      where: { id: attempt.childId },
      data: {
        placementResult: {
          [domain]: {
            completedAt: new Date().toISOString(),
            attemptId,
            recommendations,
          },
        },
      },
    });
  }
}

async function getDomainForItem(itemId: string): Promise<string | null> {
  const item = await prisma.placementTestItem.findUnique({
    where: { id: itemId },
    include: { test: { select: { domain: true } } },
  });
  return item?.test.domain ?? null;
}

/**
 * Evaluate if a response is correct based on activitySpec.
 */
function evaluateAnswer(spec: Record<string, unknown>, response: unknown): boolean {
  // For MULTIPLE_CHOICE: spec has correctAnswer field
  if (typeof spec.correctAnswer !== "undefined") {
    return spec.correctAnswer === response;
  }
  // Fallback: treat as incorrect
  return false;
}

function toPublicItem(item: PlacementTestItemBase): PlacementTestItemPublic {
  return {
    id: item.id,
    activityType: item.activityType,
    activitySpec: item.activitySpec,
    audioUrl: item.audioUrl,
    difficulty: item.difficulty,
  };
}

type PlacementStatusEntry = {
  completed: boolean;
  attemptId?: string;
  completedAt?: Date;
  canRetake: boolean;
  retakeAvailableAt?: Date;
};

/**
 * Get placement status for a child across all domains.
 */
export async function getPlacementStatus(childId: string): Promise<Record<string, PlacementStatusEntry>> {
  const domains: SkillDomain[] = ["MATH", "ENGLISH_PHONICS"];
  const result: Record<string, PlacementStatusEntry> = {};

  const cooldownDate = new Date();
  cooldownDate.setDate(cooldownDate.getDate() - COOLDOWN_DAYS);

  for (const domain of domains) {
    const test = await prisma.placementTest.findFirst({
      where: { domain, isActive: true },
    });

    if (!test) {
      result[domain] = { completed: false, canRetake: false };
      continue;
    }

    const lastCompleted = await prisma.placementTestAttempt.findFirst({
      where: { childId, testId: test.id, completedAt: { not: null } },
      orderBy: { completedAt: "desc" },
    });

    if (!lastCompleted) {
      result[domain] = { completed: false, canRetake: true };
      continue;
    }

    const completedAt = lastCompleted.completedAt!;
    const retakeAvailableAt = new Date(completedAt);
    retakeAvailableAt.setDate(retakeAvailableAt.getDate() + COOLDOWN_DAYS);
    const canRetake = new Date() >= retakeAvailableAt;

    result[domain] = {
      completed: true,
      attemptId: lastCompleted.id,
      completedAt,
      canRetake,
      retakeAvailableAt: canRetake ? undefined : retakeAvailableAt,
    };
  }

  return result;
}

/**
 * Get result details for a completed attempt.
 */
export async function getAttemptResult(attemptId: string, childId: string) {
  const attempt = await prisma.placementTestAttempt.findFirst({
    where: { id: attemptId, childId },
    include: {
      test: { select: { domain: true, title: true } },
      responses: {
        include: {
          item: { include: { skill: { select: { nameVi: true, code: true } } } },
        },
      },
    },
  });

  if (!attempt) return null;

  const summary = attempt.resultSummary as {
    skillLevels?: Array<{ skillId: string; score: number; level: string }>;
    recommendations?: string[];
  } | null;

  return {
    attemptId: attempt.id,
    domain: attempt.test.domain,
    completedAt: attempt.completedAt,
    totalItems: attempt.totalItems,
    correctItems: attempt.correctItems,
    accuracy: attempt.totalItems > 0 ? attempt.correctItems / attempt.totalItems : 0,
    skillLevels: summary?.skillLevels ?? [],
    recommendations: summary?.recommendations ?? [],
  };
}

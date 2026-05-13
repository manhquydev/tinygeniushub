import type { CourseBundleSlug } from "@/modules/courses/course-bundles";

export type BundleStorefrontContent = {
  shortLabel: string;
  parentProblem: string;
  promise: string;
  bestFor: string;
  outcomes: string[];
  parentVisibleValue: string[];
  courseUnitLabel: string;
};

type CourseScopeResolution = {
  scopeLabel: string;
  scopeIndex: number | null;
  rawScopeCode: string | null;
};

export type CourseClaritySnapshot = {
  scopeLabel: string;
  unitLabel: "post" | "vol";
  pacePerWeek: number;
  week4Target: number;
  week5Target?: number;
  week6Target?: number;
  phaseCounts: {
    foundation: number;
    core: number;
    mastery: number;
  };
  cardOutcomeLine: string;
  detailOutcomeLines: string[];
};

function resolveAbekaScope(courseSlug: string, courseTitle: string): CourseScopeResolution {
  const slugMatch = courseSlug.match(/(?:^|-)(k[45]|g\d{1,2})(?:-|$)/i);
  const titleMatch = courseTitle.match(/\b(K[45]|G\d{1,2})\b/i);
  const scopeCode = (slugMatch?.[1] ?? titleMatch?.[1] ?? "G1").toUpperCase();
  const scopeIndex = Number.parseInt(scopeCode.slice(1), 10);

  return {
    scopeLabel: `Grade ${scopeCode}`,
    scopeIndex: Number.isNaN(scopeIndex) ? null : scopeIndex,
    rawScopeCode: scopeCode,
  };
}

function resolveLittleFoxScope(courseSlug: string, courseTitle: string): CourseScopeResolution {
  const levelFromSlug =
    courseSlug.match(/(?:^|-)level-(\d{1,2})(?:-|$)/i)?.[1] ??
    courseSlug.match(/(?:^|-)l(\d{1,2})(?:-|$)/i)?.[1];
  const levelFromTitle = courseTitle.match(/\bLevel\s*(\d{1,2})\b/i)?.[1];
  const level = Number.parseInt(levelFromSlug ?? levelFromTitle ?? "1", 10);
  const normalizedLevel = Number.isNaN(level) ? 1 : level;

  return {
    scopeLabel: `Level ${normalizedLevel}`,
    scopeIndex: normalizedLevel,
    rawScopeCode: String(normalizedLevel),
  };
}

function resolveScope(bundleSlug: CourseBundleSlug, courseSlug: string, courseTitle: string): CourseScopeResolution {
  if (bundleSlug === "abeka") {
    return resolveAbekaScope(courseSlug, courseTitle);
  }
  return resolveLittleFoxScope(courseSlug, courseTitle);
}

function resolvePacePerWeek(bundleSlug: CourseBundleSlug, scope: CourseScopeResolution) {
  if (bundleSlug === "abeka") {
    return scope.rawScopeCode === "K4" || scope.rawScopeCode === "K5" ? 4 : 5;
  }

  if (bundleSlug === "little-fox-en") {
    if (scope.scopeIndex !== null && scope.scopeIndex <= 2) return 5;
    if (scope.scopeIndex !== null && scope.scopeIndex <= 5) return 4;
    return 3;
  }

  if (scope.scopeIndex !== null && scope.scopeIndex <= 2) return 5;
  return 4;
}

function resolveUnitLabel(bundleSlug: CourseBundleSlug): "post" | "vol" {
  return bundleSlug === "abeka" ? "post" : "vol";
}

function resolvePhaseCounts(lessonCount: number) {
  const total = Math.max(1, lessonCount);
  if (total === 1) {
    return { foundation: 1, core: 0, mastery: 0 };
  }
  if (total === 2) {
    return { foundation: 1, core: 1, mastery: 0 };
  }

  let foundation = Math.max(1, Math.round(total * 0.3));
  let core = Math.max(1, Math.round(total * 0.5));
  let mastery = total - foundation - core;

  if (mastery < 1) {
    const required = 1 - mastery;
    const reducibleCore = Math.max(0, core - 1);
    const reduceCoreBy = Math.min(required, reducibleCore);
    core -= reduceCoreBy;

    const remaining = required - reduceCoreBy;
    if (remaining > 0) {
      const reducibleFoundation = Math.max(0, foundation - 1);
      const reduceFoundationBy = Math.min(remaining, reducibleFoundation);
      foundation -= reduceFoundationBy;
    }

    mastery = total - foundation - core;
  }

  return { foundation, core, mastery: Math.max(1, mastery) };
}

export function buildCourseClaritySnapshot(input: {
  bundleSlug: CourseBundleSlug;
  courseSlug: string;
  courseTitle: string;
  lessonCount: number;
}): CourseClaritySnapshot {
  const scope = resolveScope(input.bundleSlug, input.courseSlug, input.courseTitle);
  const unitLabel = resolveUnitLabel(input.bundleSlug);
  const pacePerWeek = resolvePacePerWeek(input.bundleSlug, scope);
  const week4Target = pacePerWeek * 4;
  const week5Target = input.bundleSlug === "little-fox-cn" ? pacePerWeek * 5 : undefined;
  const week6Target = input.bundleSlug === "little-fox-en" ? pacePerWeek * 6 : undefined;
  const phaseCounts = resolvePhaseCounts(input.lessonCount);

  const cadenceLine =
    week5Target !== undefined
      ? `The 5 week mark is approx${week5Target} ${unitLabel}.`
      : week6Target !== undefined
        ? `6 week mark approx${week6Target} ${unitLabel}.`
        : `4 week mark approx${week4Target} ${unitLabel}.`;

  const cardOutcomeLine = `${scope.scopeLabel}: ${pacePerWeek} ${unitLabel}/week, 4 week mark approx${week4Target} ${unitLabel}.`;
  const detailOutcomeLines = [
    `Keep the rhythm${pacePerWeek} ${unitLabel}/week so your child doesn't get overloaded.`,
    `After 4 weeks can reach approx${week4Target} ${unitLabel}. ${cadenceLine}`,
    `Checkpoint theo pha: Foundation ${phaseCounts.foundation} ${unitLabel}, Core ${phaseCounts.core} ${unitLabel}, Mastery ${phaseCounts.mastery} ${unitLabel}.`,
  ];

  return {
    scopeLabel: scope.scopeLabel,
    unitLabel,
    pacePerWeek,
    week4Target,
    week5Target,
    week6Target,
    phaseCounts,
    cardOutcomeLine,
    detailOutcomeLines,
  };
}

const STORE_CONTENT: Record<CourseBundleSlug, BundleStorefrontContent> = {
  abeka: {
    shortLabel: "The academic foundation has a roadmap",
    parentProblem:
      "Children need to study systematically in class, but parents do not have much time to prepare their own schedules each week.",
    promise:
      "Clearly separated by grade level so parents can choose the right starting point, track progress and gradually expand.",
    bestFor: "Parents want to build reading comprehension - vocabulary - academic thinking according to grade level.",
    outcomes: [
      "Children learn at each grade level (K4 to G12), without being overwhelmed because the route is too long.",
      "There are checkpoints based on clusters of lessons to review and remember longer.",
      "Easy to upgrade from current grade level to the next grade level once completed.",
    ],
    parentVisibleValue: [
      "See clearly what grade level your child is in and how many lessons are left.",
      "Each stage has a completion milestone to evaluate progress.",
      "You can start from the appropriate grade level instead of buying a course that is too broad from the beginning.",
    ],
    courseUnitLabel: "grade level",
  },
  "little-fox-en": {
    shortLabel: "Practice listening - reading English through stories",
    parentProblem:
      "Children learn English through discrete videos, lacking a roadmap of increasing difficulty, so they get bored easily and find it difficult to follow.",
    promise:
      "Divided into levels 1-9 so parents can clearly see where their children are, how many lessons they have learned and how they are progressing.",
    bestFor: "Parents want their children to increase listening comprehension, vocabulary and English reflexes through story-based learning.",
    outcomes: [
      "Content ranges from easy to difficult levels, suitable for children's natural progress.",
      "Short lessons + cluster retrieval help increase long-term memory.",
      "You can study regularly every day in small amounts, reducing pressure for both children and parents.",
    ],
    parentVisibleValue: [
      "Clearly see the current level and total number of completed episodes.",
      "Easy to set weekly goals based on a specific number of articles.",
      "Easy to change levels once you complete the current stage.",
    ],
    courseUnitLabel: "level",
  },
  "little-fox-cn": {
    shortLabel: "Chinese language roadmap for beginners",
    parentProblem:
      "Chinese for children often lacks a clear roadmap by level, making it difficult for parents to choose a starting point.",
    promise:
      "Separated into levels 1-5 so parents can start at the right level, follow easily and expand step by step.",
    bestFor: "Parents want their children to get acquainted with Chinese at a steady pace that can be monitored weekly.",
    outcomes: [
      "Clear level roadmap, avoid scattered learning.",
      "Study regularly with short lesson clusters to keep the habit of studying continuously.",
      "Easily assess readiness before moving to the next level.",
    ],
    parentVisibleValue: [
      "Clear progress table for each level.",
      "Immediately see the total number of articles, access time and completion status.",
      "Easy to coordinate with your child at home thanks to short weekly goals.",
    ],
    courseUnitLabel: "level",
  },
};

export function getBundleStorefrontContent(bundleSlug: CourseBundleSlug): BundleStorefrontContent {
  return STORE_CONTENT[bundleSlug];
}

import type { CourseBundleSlug } from "@/modules/courses/course-bundles";
import type { CourseClaritySnapshot } from "@/modules/courses/course-storefront-content";

export type FitChecklistContent = {
  fitIf: string[];
  notFitIf: string[];
  buyWhen: string[];
};

export type TimelineStage = {
  label: string;
  points: string[];
};

export type TrackCourseLite = {
  id: string;
  slug: string;
  title: string;
  durationDays: number;
  lessonCount: number;
};

// ─── Fit Checklist ───────────────────────────────────────────────────────────

const DEFAULT_FIT_CHECKLIST: FitChecklistContent = {
  fitIf: [
    "Parents want to have a clear weekly learning schedule.",
    "Families need to track progress by the number of completed lessons.",
    "If you want to buy a course, you can learn it right away, no need for additional setup.",
  ],
  notFitIf: [
    "Your child is not ready to self-study at least 3 sessions per week.",
    "The family does not have a fixed time frame to maintain the study rhythm.",
    "In need of an intensive exam preparation program in a very short time.",
  ],
  buyWhen: [
    "You have determined a learning goal of 8-12 weeks for your child.",
    "You can commit to completing the assignment regularly every week.",
    "Parents want clear data to make informed decisions.",
  ],
};

const FIT_CHECKLIST_BY_BUNDLE: Record<CourseBundleSlug, FitChecklistContent> = {
  abeka: {
    fitIf: [
      "Your child needs an academic roadmap by grade level from basic to advanced.",
      "Parents want to clearly see what grade level their child is in and how many lessons are left.",
      "The family wants to maintain a stable learning rhythm of 4-5 lessons per week.",
    ],
    notFitIf: [
      "I need a super short program to prepare for exams urgently.",
      "Your child does not have time to maintain a weekly learning rhythm.",
      "The family only wants a short-term trial lesson but has not yet determined a goal longer than 1 month.",
    ],
    buyWhen: [
      "You have determined the appropriate starting grade level for your child.",
      "I am ready to complete the groups of lessons in order.",
      "Parents want progress data to upgrade pathways in a timely manner.",
    ],
  },
  "little-fox-en": {
    fitIf: [
      "Children need to increase listening comprehension and English vocabulary through stories.",
      "Parents want a clear leveling roadmap to avoid scattered learning.",
      "Families want their children to practice briefly every day instead of having too long lessons.",
    ],
    notFitIf: [
      "My child cannot yet sit and study continuously for 10-15 minutes per session.",
      "Families want an in-depth grammar route instead of learning through story context.",
      "The child needs to prepare for the certification exam in a very urgent time.",
    ],
    buyWhen: [
      "I have a basic foundation and need to increase my listening comprehension along the way.",
      "Parents want to monitor the current level and next level goals.",
      "Families accept a regular study rhythm of 4-5 sessions per week to create reflexes.",
    ],
  },
  "little-fox-cn": {
    fitIf: [
      "Children begin or strengthen their Chinese foundation by level.",
      "Families want a short, steady learning model with weekly progress measurements.",
      "Parents need clear criteria to know when to level up.",
    ],
    notFitIf: [
      "Your child is not ready to listen and repeat new words periodically.",
      "The family does not have a stable weekly study time.",
      "You need a short-term, intensive HSK exam preparation roadmap.",
    ],
    buyWhen: [
      "Children begin to recognize basic sounds and words and need to practice regularly.",
      "Parents want to track clear level milestones instead of learning sporadically.",
      "The family wants to have a checklist to make the decision to upgrade at the right time.",
    ],
  },
};

export function getFitChecklist(bundleSlug: CourseBundleSlug | null): FitChecklistContent {
  if (!bundleSlug) return DEFAULT_FIT_CHECKLIST;
  return FIT_CHECKLIST_BY_BUNDLE[bundleSlug];
}

// ─── Outcome Timeline ─────────────────────────────────────────────────────────

const DEFAULT_TIMELINE: TimelineStage[] = [
  { label: "Week 1-2", points: ["Get familiar with the learning schedule and rhythm.", "Complete the foundation lessons first."] },
  { label: "Week 3-4", points: ["Gradually increase your proactiveness when studying.", "Start having clear checkpoints for parents to monitor."] },
  {
    label: "After completion",
    points: ["Determine your child's current level.", "There is a clear basis to decide to buy the next phase."],
  },
];

const TIMELINE_BY_BUNDLE: Record<CourseBundleSlug, TimelineStage[]> = {
  abeka: [
    {
      label: "Week 1-2",
      points: ["Choose the right starting grade level and settle into a rhythm of 4-5 lessons/week.", "I get acquainted with the core lesson first."],
    },
    {
      label: "Week 3-4",
      points: [
        "Children move steadily according to grade level, reducing skipping classes.",
        "Parents can clearly see the completion milestones for each group of lessons.",
      ],
    },
    {
      label: "After completion",
      points: [
        "I'm ready to move to the next grade level.",
        "Families have progress data to make accurate upgrade decisions.",
      ],
    },
  ],
  "little-fox-en": [
    {
      label: "Week 1-2",
      points: ["I get used to the listening-reading rhythm with short stories.", "Establish a short but regular study routine."],
    },
    {
      label: "Week 3-4",
      points: [
        "Vocabulary and listening comprehension improve through continuous series of lessons.",
        "Parents can clearly see the current level and progress rate.",
      ],
    },
    {
      label: "After completion",
      points: ["I am confident enough to move to a higher level.", "The family has a clear basis to decide to buy the next level."],
    },
  ],
  "little-fox-cn": [
    {
      label: "Week 1-2",
      points: ["Children become familiar with sounds and words according to the level they are learning.", "Set a short, steady study rhythm, without overload."],
    },
    {
      label: "Week 3-4",
      points: [
        "The ability to recognize and remember words is clearly improved.",
        "Parents can see their readiness level before upgrading.",
      ],
    },
    {
      label: "After completion",
      points: [
        "I'm ready for the next level with a more sustainable foundation.",
        "The family has clear criteria for buying the next stage.",
      ],
    },
  ],
};

export function getOutcomeTimeline(
  bundleSlug: CourseBundleSlug | null,
  claritySnapshot?: CourseClaritySnapshot | null,
): TimelineStage[] {
  if (!bundleSlug) {
    return DEFAULT_TIMELINE;
  }

  if (!claritySnapshot) {
    return TIMELINE_BY_BUNDLE[bundleSlug];
  }

  const scopeLabel = claritySnapshot.scopeLabel.toLowerCase();
  const unitLabel = claritySnapshot.unitLabel;
  const twoWeekTarget = claritySnapshot.pacePerWeek * 2;
  const cadenceLine =
    claritySnapshot.week5Target !== undefined
      ? `5 week mark: approx${claritySnapshot.week5Target} ${unitLabel}.`
      : claritySnapshot.week6Target !== undefined
        ? `6 week mark: approx${claritySnapshot.week6Target} ${unitLabel}.`
        : `Maintain a stable pace to complete Foundation on schedule.`;

  return [
    {
      label: "Week 1-2",
      points: [
        `Stable rhythm${claritySnapshot.pacePerWeek} ${unitLabel}/week to avoid overload.`,
        `Short-term goal: complete approx${twoWeekTarget} ${unitLabel}.`,
      ],
    },
    {
      label: "Week 3-4",
      points: [
        `4 week mark: approx${claritySnapshot.week4Target} ${unitLabel}.`,
        cadenceLine,
      ],
    },
    {
      label: "Checkpoint upgrade",
      points: [
        `Foundation ${claritySnapshot.phaseCounts.foundation}, Core ${claritySnapshot.phaseCounts.core}, Mastery ${claritySnapshot.phaseCounts.mastery} ${unitLabel}.`,
        bundleSlug === "abeka"
          ? `Complete Mastery to advance to the next level in the track${scopeLabel}.`
          : `Complete Mastery to advance to the next level in the track${scopeLabel}.`,
      ],
    },
  ];
}

// ─── Track / Difference Helpers ───────────────────────────────────────────────

export function extractLastNumber(value: string): number | null {
  const match = value.match(/(\d+)(?!.*\d)/);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function compareTrackCourses(a: TrackCourseLite, b: TrackCourseLite, entryCourseSlug: string) {
  const aIsEntry = a.slug === entryCourseSlug ? 0 : 1;
  const bIsEntry = b.slug === entryCourseSlug ? 0 : 1;
  if (aIsEntry !== bIsEntry) return aIsEntry - bIsEntry;

  const aLevel = extractLastNumber(a.slug);
  const bLevel = extractLastNumber(b.slug);
  if (aLevel !== null && bLevel !== null && aLevel !== bLevel) return aLevel - bLevel;
  if (aLevel !== null && bLevel === null) return 1;
  if (aLevel === null && bLevel !== null) return -1;

  return a.slug.localeCompare(b.slug, "vi");
}

function formatDelta(currentValue: number, adjacentValue: number, unit: string) {
  const delta = currentValue - adjacentValue;
  if (delta === 0) return `Volume${unit}equivalent.`;
  if (delta > 0) return `More${delta} ${unit}.`;
  return `Less${Math.abs(delta)} ${unit}.`;
}

export function buildDifferencePoints(
  current: TrackCourseLite,
  adjacent: TrackCourseLite,
  direction: "previous" | "next",
  courseUnitLabel: string,
) {
  const points: string[] = [];
  const currentLevel = extractLastNumber(current.slug);
  const adjacentLevel = extractLastNumber(adjacent.slug);

  if (currentLevel !== null && adjacentLevel !== null && currentLevel !== adjacentLevel) {
    const levelGap = Math.abs(currentLevel - adjacentLevel);
    if (direction === "previous") {
      points.push(`The degree of continuation after the previous course is approx${levelGap} ${courseUnitLabel}.`);
    } else {
      points.push(`Is a stepping stone before the next course approx${levelGap} ${courseUnitLabel}.`);
    }
  }

  points.push(`Number of cards compared to adjacent keys:${formatDelta(current.lessonCount, adjacent.lessonCount, "post")}`);
  points.push(`Access period:${formatDelta(current.durationDays, adjacent.durationDays, "day")}`);

  if (direction === "previous") {
    points.push(`You should choose when your child is ready to move on${adjacent.title}.`);
  } else {
    points.push(`If you complete this course well, you can upgrade${adjacent.title}.`);
  }

  return points;
}

export function formatCurrency(amount: number) {
  return `${amount.toLocaleString("vi-VN")}D`;
}

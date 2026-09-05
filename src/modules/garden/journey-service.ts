import { Prisma } from "@prisma/client";
import type {
  ChildCourseJourneyEventType,
  ChildCourseJourneyStatus,
} from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { DomainError } from "@/modules/platform/errors";
import { assertParentHasCourseTicket } from "@/modules/garden/assert-course-ticket";

type DbClient = Prisma.TransactionClient | typeof prisma;

type CourseLessonWithLevel = {
  orderNo: number;
  lessonId: string;
  levelId: string;
  levelOrderNo: number;
  levelTitle: string;
};

export interface JourneyTierPlan {
  tierNo: number;
  tierKey: string;
  title: string;
  lessonTotal: number;
  lessonCompleted: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  lessonIds: string[];
}

export interface JourneyProgressSummary {
  status: ChildCourseJourneyStatus;
  currentTierNo: number;
  currentTierProgress: number;
  totalLessons: number;
  completedLessons: number;
}

export interface ChildCourseJourneySnapshot {
  journey: {
    id: string;
    childId: string;
    courseId: string;
    sourceEnrollmentId: string | null;
    status: ChildCourseJourneyStatus;
    seedName: string;
    currentTierNo: number;
    currentTierProgress: number;
    plantedAt: Date;
    activatedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
  course: {
    id: string;
    slug: string;
    title: string;
  };
  tiers: Array<{
    id: string;
    tierNo: number;
    tierKey: string;
    title: string;
    lessonTotal: number;
    lessonCompleted: number;
    isUnlocked: boolean;
    unlockedAt: Date | null;
    isCompleted: boolean;
    completedAt: Date | null;
  }>;
}

export interface SyncJourneyProgressResult {
  snapshot: ChildCourseJourneySnapshot;
  metrics: {
    completedLessonDelta: number;
    unlockedTierNos: number[];
    becameCompleted: boolean;
  };
}

export interface ChildCourseJourneyListItem {
  id: string;
  childId: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  sourceEnrollmentId: string | null;
  status: ChildCourseJourneyStatus;
  seedName: string;
  currentTierNo: number;
  currentTierProgress: number;
  totalTiers: number;
  completedTiers: number;
  totalLessons: number;
  completedLessons: number;
  plantedAt: Date;
  activatedAt: Date | null;
  completedAt: Date | null;
  updatedAt: Date;
}

const courseSelectorSchema = z
  .object({
    courseId: z.string().min(1).optional(),
    courseSlug: z.string().min(1).optional(),
  })
  .refine((value) => Boolean(value.courseId || value.courseSlug), {
    message: "courseId or courseSlug is required",
  });

const buildJourneyTiersInputSchema = courseSelectorSchema.extend({
  parentId: z.string().min(1),
  childId: z.string().min(1),
});

const createJourneyInputSchema = courseSelectorSchema.extend({
  parentId: z.string().min(1),
  childId: z.string().min(1),
  sourceEnrollmentId: z.string().min(1).optional(),
  seedName: z.string().trim().min(1).max(160).optional(),
});

const syncJourneyInputSchema = z
  .object({
    parentId: z.string().min(1),
    childId: z.string().min(1),
    journeyId: z.string().min(1).optional(),
    courseId: z.string().min(1).optional(),
    courseSlug: z.string().min(1).optional(),
  })
  .refine((value) => Boolean(value.journeyId || value.courseId || value.courseSlug), {
    message: "journeyId or course selector is required",
  });

const listJourneysInputSchema = z.object({
  parentId: z.string().min(1),
  childId: z.string().min(1),
});

const getJourneySnapshotInputSchema = z.object({
  parentId: z.string().min(1),
  childId: z.string().min(1),
  journeyId: z.string().min(1),
});

const JOURNEY_STATUS = {
  SEEDED: "SEEDED",
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  COMPLETED: "COMPLETED",
} as const satisfies Record<string, ChildCourseJourneyStatus>;

const JOURNEY_EVENT = {
  PLANTED: "PLANTED",
  WATERED: "WATERED",
  LESSON_COMPLETED: "LESSON_COMPLETED",
  TIER_UNLOCKED: "TIER_UNLOCKED",
  JOURNEY_COMPLETED: "JOURNEY_COMPLETED",
} as const satisfies Record<string, ChildCourseJourneyEventType>;
function normalizeSlugPart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toJsonPayload(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as unknown as Prisma.InputJsonValue;
}

function roundTierProgress(value: number) {
  const bounded = Math.max(0, Math.min(1, value));
  return Math.round(bounded * 10000) / 10000;
}

function deriveJourneyStatusFromProgress(params: {
  tiers: JourneyTierPlan[];
  totalLessons: number;
  completedLessons: number;
}): JourneyProgressSummary {
  const { tiers, totalLessons, completedLessons } = params;
  if (tiers.length === 0 || totalLessons === 0) {
    return {
      status: JOURNEY_STATUS.SEEDED,
      currentTierNo: 1,
      currentTierProgress: 0,
      totalLessons,
      completedLessons,
    };
  }

  const currentTier = tiers.find((tier) => tier.isUnlocked && !tier.isCompleted);
  const allCompleted = tiers.every((tier) => tier.isCompleted);

  if (allCompleted) {
    return {
      status: JOURNEY_STATUS.COMPLETED,
      currentTierNo: tiers[tiers.length - 1]!.tierNo,
      currentTierProgress: 1,
      totalLessons,
      completedLessons,
    };
  }

  if (!currentTier) {
    return {
      status: completedLessons > 0 ? JOURNEY_STATUS.ACTIVE : JOURNEY_STATUS.SEEDED,
      currentTierNo: tiers[0]!.tierNo,
      currentTierProgress: 0,
      totalLessons,
      completedLessons,
    };
  }

  const tierProgress = currentTier.lessonTotal > 0
    ? currentTier.lessonCompleted / currentTier.lessonTotal
    : 0;

  return {
    status: completedLessons > 0 ? JOURNEY_STATUS.ACTIVE : JOURNEY_STATUS.SEEDED,
    currentTierNo: currentTier.tierNo,
    currentTierProgress: roundTierProgress(tierProgress),
    totalLessons,
    completedLessons,
  };
}

export function computeJourneyTiers(params: {
  courseSlug: string;
  lessons: CourseLessonWithLevel[];
  completedLessonIds: ReadonlySet<string>;
}): JourneyTierPlan[] {
  const groupedByLevel = new Map<
    string,
    {
      levelOrderNo: number;
      title: string;
      firstCourseOrderNo: number;
      lessonIds: string[];
      lessonCompleted: number;
    }
  >();

  for (const lesson of [...params.lessons].sort((a, b) => a.orderNo - b.orderNo)) {
    const existing = groupedByLevel.get(lesson.levelId);
    const completed = params.completedLessonIds.has(lesson.lessonId) ? 1 : 0;
    if (!existing) {
      groupedByLevel.set(lesson.levelId, {
        levelOrderNo: lesson.levelOrderNo,
        title: lesson.levelTitle,
        firstCourseOrderNo: lesson.orderNo,
        lessonIds: [lesson.lessonId],
        lessonCompleted: completed,
      });
      continue;
    }

    existing.lessonIds.push(lesson.lessonId);
    existing.lessonCompleted += completed;
    existing.firstCourseOrderNo = Math.min(existing.firstCourseOrderNo, lesson.orderNo);
  }

  const orderedGroups = [...groupedByLevel.entries()]
    .map(([levelId, group]) => ({ levelId, ...group }))
    .sort((a, b) => {
      if (a.levelOrderNo !== b.levelOrderNo) return a.levelOrderNo - b.levelOrderNo;
      return a.firstCourseOrderNo - b.firstCourseOrderNo;
    });

  const tiers: JourneyTierPlan[] = [];
  for (let index = 0; index < orderedGroups.length; index += 1) {
    const group = orderedGroups[index]!;
    const tierNo = index + 1;
    const lessonTotal = group.lessonIds.length;
    const lessonCompleted = Math.min(group.lessonCompleted, lessonTotal);
    const isCompleted = lessonTotal > 0 && lessonCompleted >= lessonTotal;
    const isUnlocked = index === 0 ? true : tiers[index - 1]!.isCompleted;
    const slugPart = normalizeSlugPart(group.title) || `tier-${tierNo}`;

    tiers.push({
      tierNo,
      tierKey: `${params.courseSlug}:${slugPart}`,
      title: group.title,
      lessonTotal,
      lessonCompleted,
      isUnlocked,
      isCompleted,
      lessonIds: group.lessonIds,
    });
  }

  return tiers;
}

export function computeJourneyProgressFromTiers(tiers: JourneyTierPlan[]): JourneyProgressSummary {
  const totalLessons = tiers.reduce((sum, tier) => sum + tier.lessonTotal, 0);
  const completedLessons = tiers.reduce((sum, tier) => sum + tier.lessonCompleted, 0);
  return deriveJourneyStatusFromProgress({ tiers, totalLessons, completedLessons });
}

async function assertChildOwnedByParent(db: DbClient, params: { parentId: string; childId: string }) {
  const child = await db.childProfile.findFirst({
    where: {
      id: params.childId,
      parentId: params.parentId,
    },
    select: { id: true },
  });

  if (!child) {
    throw new DomainError("Child profile not found", 404, "CHILD_NOT_FOUND");
  }
}

async function resolveCourse(db: DbClient, selector: z.infer<typeof courseSelectorSchema>) {
  const course = await db.course.findFirst({
    where: selector.courseId
      ? { id: selector.courseId }
      : { slug: selector.courseSlug },
    select: {
      id: true,
      slug: true,
      title: true,
    },
  });

  if (!course) {
    throw new DomainError("Course not found", 404, "COURSE_NOT_FOUND");
  }

  return course;
}

async function loadCourseLessonsWithLevel(db: DbClient, courseId: string): Promise<CourseLessonWithLevel[]> {
  const rows = await db.courseLesson.findMany({
    where: { courseId },
    orderBy: { orderNo: "asc" },
    select: {
      orderNo: true,
      lessonId: true,
      lesson: {
        select: {
          unit: {
            select: {
              level: {
                select: {
                  id: true,
                  orderNo: true,
                  title: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return rows.map((row) => ({
    orderNo: row.orderNo,
    lessonId: row.lessonId,
    levelId: row.lesson.unit.level.id,
    levelOrderNo: row.lesson.unit.level.orderNo,
    levelTitle: row.lesson.unit.level.title,
  }));
}

async function loadCompletedLessonIds(db: DbClient, childId: string, lessonIds: string[]) {
  if (lessonIds.length === 0) {
    return new Set<string>();
  }

  const completions = await db.lessonCompletion.findMany({
    where: {
      childId,
      lessonId: {
        in: lessonIds,
      },
    },
    select: {
      lessonId: true,
    },
  });

  return new Set(completions.map((completion) => completion.lessonId));
}

async function resolveCourseEnrollment(db: DbClient, params: {
  parentId: string;
  courseId: string;
  sourceEnrollmentId?: string;
}) {
  if (params.sourceEnrollmentId) {
    const sourceEnrollment = await db.courseEnrollment.findFirst({
      where: {
        id: params.sourceEnrollmentId,
        parentId: params.parentId,
        courseId: params.courseId,
      },
      select: { id: true },
    });
    if (sourceEnrollment) {
      return sourceEnrollment.id;
    }
  }

  const enrollment = await db.courseEnrollment.findUnique({
    where: {
      courseId_parentId: {
        courseId: params.courseId,
        parentId: params.parentId,
      },
    },
    select: { id: true },
  });

  return enrollment?.id ?? null;
}

async function loadJourneySnapshot(db: DbClient, journeyId: string): Promise<ChildCourseJourneySnapshot> {
  const journey = await db.childCourseJourney.findUnique({
    where: { id: journeyId },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
        },
      },
      tiers: {
        orderBy: { tierNo: "asc" },
        select: {
          id: true,
          tierNo: true,
          tierKey: true,
          title: true,
          lessonTotal: true,
          lessonCompleted: true,
          isUnlocked: true,
          unlockedAt: true,
          isCompleted: true,
          completedAt: true,
        },
      },
    },
  });

  if (!journey) {
    throw new DomainError("Journey not found", 404, "JOURNEY_NOT_FOUND");
  }

  return {
    journey: {
      id: journey.id,
      childId: journey.childId,
      courseId: journey.courseId,
      sourceEnrollmentId: journey.sourceEnrollmentId,
      status: journey.status,
      seedName: journey.seedName,
      currentTierNo: journey.currentTierNo,
      currentTierProgress: journey.currentTierProgress,
      plantedAt: journey.plantedAt,
      activatedAt: journey.activatedAt,
      completedAt: journey.completedAt,
      createdAt: journey.createdAt,
      updatedAt: journey.updatedAt,
    },
    course: journey.course,
    tiers: journey.tiers,
  };
}

async function computeTierPlanForCourse(db: DbClient, params: {
  childId: string;
  courseId: string;
  courseSlug: string;
}) {
  const lessons = await loadCourseLessonsWithLevel(db, params.courseId);
  if (lessons.length === 0) {
    throw new DomainError("Course has no lessons for journey setup", 409, "COURSE_LESSONS_EMPTY");
  }

  const completedLessonIds = await loadCompletedLessonIds(
    db,
    params.childId,
    lessons.map((lesson) => lesson.lessonId),
  );

  const tiers = computeJourneyTiers({
    courseSlug: params.courseSlug,
    lessons,
    completedLessonIds,
  });

  return {
    tiers,
    progress: computeJourneyProgressFromTiers(tiers),
  };
}

export async function buildJourneyTiersFromCourse(input: z.infer<typeof buildJourneyTiersInputSchema>) {
  const params = buildJourneyTiersInputSchema.parse(input);

  await assertChildOwnedByParent(prisma, {
    parentId: params.parentId,
    childId: params.childId,
  });

  const course = await resolveCourse(prisma, {
    courseId: params.courseId,
    courseSlug: params.courseSlug,
  });

  const { tiers } = await computeTierPlanForCourse(prisma, {
    childId: params.childId,
    courseId: course.id,
    courseSlug: course.slug,
  });

  return tiers;
}

async function syncJourneyProgressInTransaction(tx: Prisma.TransactionClient, params: {
  journeyId: string;
  childId: string;
  recordEvents: boolean;
}) {
  const journey = await tx.childCourseJourney.findUnique({
    where: { id: params.journeyId },
    select: {
      id: true,
      childId: true,
      courseId: true,
      sourceEnrollmentId: true,
      status: true,
      seedName: true,
      activatedAt: true,
      completedAt: true,
    },
  });

  if (!journey || journey.childId !== params.childId) {
    throw new DomainError("Journey not found", 404, "JOURNEY_NOT_FOUND");
  }

  const course = await tx.course.findUnique({
    where: { id: journey.courseId },
    select: {
      id: true,
      slug: true,
      title: true,
    },
  });

  if (!course) {
    throw new DomainError("Course not found", 404, "COURSE_NOT_FOUND");
  }

  const { tiers, progress } = await computeTierPlanForCourse(tx, {
    childId: journey.childId,
    courseId: course.id,
    courseSlug: course.slug,
  });

  const existingTiers = await tx.childCourseJourneyTier.findMany({
    where: { journeyId: journey.id },
    select: {
      id: true,
      tierNo: true,
      lessonCompleted: true,
      isUnlocked: true,
      unlockedAt: true,
      isCompleted: true,
      completedAt: true,
    },
  });

  const existingByTierNo = new Map(existingTiers.map((tier) => [tier.tierNo, tier]));
  const previousCompletedLessons = existingTiers.reduce((sum, tier) => sum + tier.lessonCompleted, 0);
  const now = new Date();
  const unlockedTierNos: number[] = [];

  for (const tier of tiers) {
    const previousTier = existingByTierNo.get(tier.tierNo);
    const becameUnlocked = Boolean(!previousTier?.isUnlocked && tier.isUnlocked);
    if (becameUnlocked) {
      unlockedTierNos.push(tier.tierNo);
    }

    await tx.childCourseJourneyTier.upsert({
      where: {
        journeyId_tierNo: {
          journeyId: journey.id,
          tierNo: tier.tierNo,
        },
      },
      update: {
        tierKey: tier.tierKey,
        title: tier.title,
        lessonTotal: tier.lessonTotal,
        lessonCompleted: tier.lessonCompleted,
        isUnlocked: tier.isUnlocked,
        unlockedAt: tier.isUnlocked ? previousTier?.unlockedAt ?? now : null,
        isCompleted: tier.isCompleted,
        completedAt: tier.isCompleted ? previousTier?.completedAt ?? now : null,
      },
      create: {
        journeyId: journey.id,
        tierNo: tier.tierNo,
        tierKey: tier.tierKey,
        title: tier.title,
        lessonTotal: tier.lessonTotal,
        lessonCompleted: tier.lessonCompleted,
        isUnlocked: tier.isUnlocked,
        unlockedAt: tier.isUnlocked ? now : null,
        isCompleted: tier.isCompleted,
        completedAt: tier.isCompleted ? now : null,
      },
    });
  }

  const expectedTierNos = new Set(tiers.map((tier) => tier.tierNo));
  const staleTierIds = existingTiers
    .filter((tier) => !expectedTierNos.has(tier.tierNo))
    .map((tier) => tier.id);
  if (staleTierIds.length > 0) {
    await tx.childCourseJourneyTier.deleteMany({
      where: {
        id: {
          in: staleTierIds,
        },
      },
    });
  }

  const totalCompletedLessons = progress.completedLessons;
  const completedLessonDelta = Math.max(0, totalCompletedLessons - previousCompletedLessons);
  const becameCompleted = journey.status !== JOURNEY_STATUS.COMPLETED
    && progress.status === JOURNEY_STATUS.COMPLETED;

  await tx.childCourseJourney.update({
    where: { id: journey.id },
    data: {
      status: progress.status,
      currentTierNo: progress.currentTierNo,
      currentTierProgress: progress.currentTierProgress,
      activatedAt:
        progress.status === JOURNEY_STATUS.ACTIVE
          || progress.status === JOURNEY_STATUS.COMPLETED
          ? journey.activatedAt ?? now
          : null,
      completedAt:
        progress.status === JOURNEY_STATUS.COMPLETED
          ? journey.completedAt ?? now
          : null,
    },
  });

  if (params.recordEvents) {
    const events: Prisma.ChildCourseJourneyEventCreateManyInput[] = [];

    if (completedLessonDelta > 0) {
      events.push({
        journeyId: journey.id,
        eventType: JOURNEY_EVENT.LESSON_COMPLETED,
        payload: toJsonPayload({
          delta: completedLessonDelta,
          totalCompletedLessons,
          totalLessons: progress.totalLessons,
          at: now.toISOString(),
        }),
      });
    }

    for (const tierNo of unlockedTierNos.filter((value) => value > 1)) {
      events.push({
        journeyId: journey.id,
        eventType: JOURNEY_EVENT.TIER_UNLOCKED,
        payload: toJsonPayload({
          tierNo,
          at: now.toISOString(),
        }),
      });
    }

    if (becameCompleted) {
      events.push({
        journeyId: journey.id,
        eventType: JOURNEY_EVENT.JOURNEY_COMPLETED,
        payload: toJsonPayload({
          at: now.toISOString(),
          totalTiers: tiers.length,
          totalLessons: progress.totalLessons,
        }),
      });
    }

    if (events.length > 0) {
      await tx.childCourseJourneyEvent.createMany({ data: events });
    }
  }

  return {
    snapshot: await loadJourneySnapshot(tx, journey.id),
    metrics: {
      completedLessonDelta,
      unlockedTierNos,
      becameCompleted,
    },
  };
}

export async function createJourneyFromCourse(input: z.infer<typeof createJourneyInputSchema>) {
  const params = createJourneyInputSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    await assertChildOwnedByParent(tx, {
      parentId: params.parentId,
      childId: params.childId,
    });

    const course = await resolveCourse(tx, {
      courseId: params.courseId,
      courseSlug: params.courseSlug,
    });

    await assertParentHasCourseTicket({
      parentId: params.parentId,
      courseId: course.id,
    });

    const sourceEnrollmentId = await resolveCourseEnrollment(tx, {
      parentId: params.parentId,
      courseId: course.id,
      sourceEnrollmentId: params.sourceEnrollmentId,
    });

    const existingJourney = await tx.childCourseJourney.findUnique({
      where: {
        childId_courseId: {
          childId: params.childId,
          courseId: course.id,
        },
      },
      select: { id: true },
    });

    if (existingJourney) {
      return syncJourneyProgressInTransaction(tx, {
        journeyId: existingJourney.id,
        childId: params.childId,
        recordEvents: true,
      });
    }

    const { tiers, progress } = await computeTierPlanForCourse(tx, {
      childId: params.childId,
      courseId: course.id,
      courseSlug: course.slug,
    });

    const now = new Date();
    const journey = await tx.childCourseJourney.create({
      data: {
        childId: params.childId,
        courseId: course.id,
        sourceEnrollmentId,
        status: progress.status,
        seedName: params.seedName ?? `Seed${course.title}`,
        currentTierNo: progress.currentTierNo,
        currentTierProgress: progress.currentTierProgress,
        plantedAt: now,
        activatedAt:
          progress.status === JOURNEY_STATUS.ACTIVE
            || progress.status === JOURNEY_STATUS.COMPLETED
            ? now
            : null,
        completedAt: progress.status === JOURNEY_STATUS.COMPLETED ? now : null,
      },
      select: { id: true },
    });

    await tx.childCourseJourneyTier.createMany({
      data: tiers.map((tier) => ({
        journeyId: journey.id,
        tierNo: tier.tierNo,
        tierKey: tier.tierKey,
        title: tier.title,
        lessonTotal: tier.lessonTotal,
        lessonCompleted: tier.lessonCompleted,
        isUnlocked: tier.isUnlocked,
        unlockedAt: tier.isUnlocked ? now : null,
        isCompleted: tier.isCompleted,
        completedAt: tier.isCompleted ? now : null,
      })),
    });

    await tx.childCourseJourneyEvent.create({
      data: {
        journeyId: journey.id,
        eventType: JOURNEY_EVENT.PLANTED,
        payload: toJsonPayload({
          childId: params.childId,
          courseId: course.id,
          courseSlug: course.slug,
          sourceEnrollmentId,
          at: now.toISOString(),
        }),
      },
    });

    return {
      snapshot: await loadJourneySnapshot(tx, journey.id),
      metrics: {
        completedLessonDelta: progress.completedLessons,
        unlockedTierNos: tiers.filter((tier) => tier.isUnlocked).map((tier) => tier.tierNo),
        becameCompleted: progress.status === JOURNEY_STATUS.COMPLETED,
      },
    } satisfies SyncJourneyProgressResult;
  });
}

export async function syncJourneyProgress(input: z.infer<typeof syncJourneyInputSchema>) {
  const params = syncJourneyInputSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    await assertChildOwnedByParent(tx, {
      parentId: params.parentId,
      childId: params.childId,
    });

    if (params.journeyId) {
      return syncJourneyProgressInTransaction(tx, {
        journeyId: params.journeyId,
        childId: params.childId,
        recordEvents: true,
      });
    }

    const course = await resolveCourse(tx, {
      courseId: params.courseId,
      courseSlug: params.courseSlug,
    });

    const journey = await tx.childCourseJourney.findUnique({
      where: {
        childId_courseId: {
          childId: params.childId,
          courseId: course.id,
        },
      },
      select: { id: true },
    });

    if (!journey) {
      throw new DomainError("Journey not found", 404, "JOURNEY_NOT_FOUND");
    }

    return syncJourneyProgressInTransaction(tx, {
      journeyId: journey.id,
      childId: params.childId,
      recordEvents: true,
    });
  });
}

export async function listJourneysForChild(input: z.infer<typeof listJourneysInputSchema>) {
  const params = listJourneysInputSchema.parse(input);

  await assertChildOwnedByParent(prisma, {
    parentId: params.parentId,
    childId: params.childId,
  });

  const journeys = await prisma.childCourseJourney.findMany({
    where: {
      childId: params.childId,
    },
    orderBy: [
      { updatedAt: "desc" },
      { createdAt: "desc" },
    ],
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
        },
      },
      tiers: {
        select: {
          lessonTotal: true,
          lessonCompleted: true,
          isCompleted: true,
        },
      },
    },
  });

  return journeys.map((journey) => {
    const totalTiers = journey.tiers.length;
    const completedTiers = journey.tiers.filter((tier) => tier.isCompleted).length;
    const totalLessons = journey.tiers.reduce((sum, tier) => sum + tier.lessonTotal, 0);
    const completedLessons = journey.tiers.reduce((sum, tier) => sum + tier.lessonCompleted, 0);

    return {
      id: journey.id,
      childId: journey.childId,
      courseId: journey.courseId,
      courseSlug: journey.course.slug,
      courseTitle: journey.course.title,
      sourceEnrollmentId: journey.sourceEnrollmentId,
      status: journey.status,
      seedName: journey.seedName,
      currentTierNo: journey.currentTierNo,
      currentTierProgress: journey.currentTierProgress,
      totalTiers,
      completedTiers,
      totalLessons,
      completedLessons,
      plantedAt: journey.plantedAt,
      activatedAt: journey.activatedAt,
      completedAt: journey.completedAt,
      updatedAt: journey.updatedAt,
    } satisfies ChildCourseJourneyListItem;
  });
}

export async function getJourneySnapshot(input: z.infer<typeof getJourneySnapshotInputSchema>) {
  const params = getJourneySnapshotInputSchema.parse(input);

  await assertChildOwnedByParent(prisma, {
    parentId: params.parentId,
    childId: params.childId,
  });

  const matchedJourney = await prisma.childCourseJourney.findFirst({
    where: {
      id: params.journeyId,
      childId: params.childId,
    },
    select: {
      id: true,
    },
  });

  if (!matchedJourney) {
    throw new DomainError("Journey not found", 404, "JOURNEY_NOT_FOUND");
  }

  return loadJourneySnapshot(prisma, matchedJourney.id);
}


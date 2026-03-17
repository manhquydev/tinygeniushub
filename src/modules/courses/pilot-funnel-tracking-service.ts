import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { PilotAttributionSnapshot } from "@/modules/courses/pilot-attribution";
import { createAuditLog } from "@/modules/platform/audit-service";
import { getPilotSkuBySlug, listPilotSkuSlugs } from "@/modules/courses/pilot-sku-catalog";

type DbClient = Prisma.TransactionClient | typeof prisma;

type TrackCheckoutStartedInput = {
  dbClient?: DbClient;
  parentId: string;
  courseId: string;
  courseSlug: string;
  sourceSlug: string;
  provider: string;
  sessionId: string;
  amountVnd: number;
  attribution: PilotAttributionSnapshot | null;
};

type TrackPurchaseSucceededInput = {
  dbClient?: DbClient;
  parentId: string;
  paymentRecordId: string;
  courseId: string;
  courseSlug: string;
  provider: string;
  amountVnd: number;
  source: "payos_webhook" | "mock_checkout";
  attribution: PilotAttributionSnapshot | null;
};

function buildCheckoutResourceId(input: {
  parentId: string;
  courseId: string;
  sessionId: string;
}) {
  return `${input.parentId}:${input.courseId}:${input.sessionId}`;
}

function buildPurchaseResourceId(input: {
  parentId: string;
  courseId: string;
  paymentRecordId: string;
}) {
  return `${input.parentId}:${input.courseId}:${input.paymentRecordId}`;
}

function buildLessonResourceId(input: {
  parentId: string;
  courseId: string;
  childId: string;
  completionId: string;
}) {
  return `${input.parentId}:${input.courseId}:${input.childId}:${input.completionId}`;
}

async function createAuditLogIfMissing(input: {
  dbClient?: DbClient;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Prisma.InputJsonValue;
}) {
  const db = input.dbClient ?? prisma;
  const existing = await db.auditLog.findFirst({
    where: {
      actorType: "parent",
      actorId: input.actorId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
    },
    select: {
      id: true,
    },
  });

  if (existing) {
    return;
  }

  await createAuditLog({
    dbClient: db,
    actorType: "parent",
    actorId: input.actorId,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    metadata: input.metadata,
  });
}

function buildAttributionMetadata(attribution: PilotAttributionSnapshot | null) {
  return {
    attributionChannel: attribution?.channel ?? "unknown",
    attributionUtmSource: attribution?.utmSource ?? null,
    attributionUtmMedium: attribution?.utmMedium ?? null,
    attributionUtmCampaign: attribution?.utmCampaign ?? null,
    attributionSourceParam: attribution?.sourceParam ?? null,
    attributionRefParam: attribution?.refParam ?? null,
    attributionReferrerHost: attribution?.referrerHost ?? null,
    attributionLandingPath: attribution?.landingPath ?? null,
    attributionExperimentPricingVariant: attribution?.experimentPricingVariant ?? null,
    attributionExperimentCoursesVariant: attribution?.experimentCoursesVariant ?? null,
    attributionCapturedAt: attribution?.capturedAt ?? null,
  };
}

export async function trackPilotCheckoutStarted(input: TrackCheckoutStartedInput) {
  const pilot = getPilotSkuBySlug(input.courseSlug);
  if (!pilot) {
    return false;
  }

  await createAuditLogIfMissing({
    dbClient: input.dbClient,
    actorId: input.parentId,
    action: "pilot_checkout_started",
    resourceType: "pilot_course",
    resourceId: buildCheckoutResourceId({
      parentId: input.parentId,
      courseId: input.courseId,
      sessionId: input.sessionId,
    }),
    metadata: {
      sku: pilot.sku,
      courseId: input.courseId,
      courseSlug: input.courseSlug,
      sourceSlug: input.sourceSlug,
      courseCode: pilot.courseCode,
      unitType: pilot.unitType,
      unitValue: String(pilot.unitValue),
      provider: input.provider,
      amountVnd: input.amountVnd,
      sessionId: input.sessionId,
      ...buildAttributionMetadata(input.attribution),
    } satisfies Prisma.JsonObject,
  });

  return true;
}

export async function trackPilotPurchaseSucceeded(input: TrackPurchaseSucceededInput) {
  const pilot = getPilotSkuBySlug(input.courseSlug);
  if (!pilot) {
    return false;
  }

  await createAuditLogIfMissing({
    dbClient: input.dbClient,
    actorId: input.parentId,
    action: "pilot_purchase_succeeded",
    resourceType: "pilot_course",
    resourceId: buildPurchaseResourceId({
      parentId: input.parentId,
      courseId: input.courseId,
      paymentRecordId: input.paymentRecordId,
    }),
    metadata: {
      sku: pilot.sku,
      courseId: input.courseId,
      courseSlug: input.courseSlug,
      courseCode: pilot.courseCode,
      unitType: pilot.unitType,
      unitValue: String(pilot.unitValue),
      provider: input.provider,
      amountVnd: input.amountVnd,
      paymentRecordId: input.paymentRecordId,
      source: input.source,
      ...buildAttributionMetadata(input.attribution),
    } satisfies Prisma.JsonObject,
  });

  return true;
}

export async function trackPilotLessonCompletedForParent(input: {
  parentId: string;
  childId: string;
  lessonId: string;
  completionId: string;
}) {
  const courses = await prisma.course.findMany({
    where: {
      slug: {
        in: listPilotSkuSlugs(),
      },
      lessons: {
        some: {
          lessonId: input.lessonId,
        },
      },
      enrollments: {
        some: {
          parentId: input.parentId,
        },
      },
    },
    select: {
      id: true,
      slug: true,
    },
  });

  if (courses.length === 0) {
    return 0;
  }

  for (const course of courses) {
    const pilot = getPilotSkuBySlug(course.slug);
    if (!pilot) {
      continue;
    }

    await createAuditLogIfMissing({
      actorId: input.parentId,
      action: "pilot_lesson_completed",
      resourceType: "pilot_course",
      resourceId: buildLessonResourceId({
        parentId: input.parentId,
        courseId: course.id,
        childId: input.childId,
        completionId: input.completionId,
      }),
      metadata: {
        sku: pilot.sku,
        courseId: course.id,
        courseSlug: course.slug,
        lessonId: input.lessonId,
        childId: input.childId,
        completionId: input.completionId,
        courseCode: pilot.courseCode,
        unitType: pilot.unitType,
        unitValue: String(pilot.unitValue),
      } satisfies Prisma.JsonObject,
    });
  }

  return courses.length;
}

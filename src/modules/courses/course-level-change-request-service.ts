import { randomUUID } from "node:crypto";
import { DomainError } from "@/modules/platform/errors";
import { createAuditLog } from "@/modules/platform/audit-service";
import { prisma } from "@/lib/db";
import { type CourseLevelChangeReasonCode } from "@/modules/courses/course-level-change-request-constants";

export type CourseLevelChangeRequestChannel = "ui" | "support" | "api";
export type CourseLevelChangeDecision = "approved" | "rejected" | "cancelled";

function toReasonFamily(reasonCode: CourseLevelChangeReasonCode) {
  return reasonCode === "other" ? "other" : "wrong_level";
}

function readMetadataObject(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

export async function createCourseLevelChangeRequest(input: {
  parentId: string;
  courseSlug: string;
  fromLevelId?: string | null;
  toLevelId?: string | null;
  reasonCode: CourseLevelChangeReasonCode;
  note?: string | null;
  requestChannel: CourseLevelChangeRequestChannel;
}) {
  const now = Date.now();
  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      parentId: input.parentId,
      course: {
        slug: input.courseSlug,
      },
    },
    select: {
      id: true,
      paymentId: true,
      courseId: true,
      course: {
        select: {
          title: true,
          slug: true,
        },
      },
    },
  });

  if (!enrollment) {
    throw new DomainError("Enrollment not found for this course", 403, "COURSE_LEVEL_CHANGE_NOT_ELIGIBLE");
  }

  const createdCandidates = await prisma.auditLog.findMany({
    where: {
      actorType: "parent",
      actorId: input.parentId,
      action: "level_change_request_created",
      resourceType: "course_level_change_request",
      createdAt: {
        gte: new Date(now - 14 * 24 * 60 * 60 * 1000),
      },
    },
    select: {
      resourceId: true,
      metadata: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });

  const candidateIds = createdCandidates
    .map((candidate) => candidate.resourceId)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  const decidedIds = candidateIds.length
    ? await prisma.auditLog.findMany({
        where: {
          action: "level_change_request_decided",
          resourceType: "course_level_change_request",
          resourceId: {
            in: candidateIds,
          },
        },
        select: {
          resourceId: true,
        },
      })
    : [];
  const decidedIdSet = new Set(
    decidedIds
      .map((item) => item.resourceId)
      .filter((id): id is string => typeof id === "string" && id.length > 0),
  );

  for (const candidate of createdCandidates) {
    if (!candidate.resourceId || decidedIdSet.has(candidate.resourceId)) {
      continue;
    }

    const metadata = readMetadataObject(candidate.metadata);
    const purchaseId = typeof metadata?.purchaseId === "string" ? metadata.purchaseId : null;
    const courseId = typeof metadata?.courseId === "string" ? metadata.courseId : null;
    if (purchaseId === enrollment.paymentId && courseId === enrollment.courseId) {
      return {
        requestId: candidate.resourceId,
        purchaseId: enrollment.paymentId,
        orderId: enrollment.paymentId,
        courseId: enrollment.courseId,
        courseSlug: enrollment.course.slug,
        reused: true,
      };
    }
  }

  const requestId = randomUUID();

  await createAuditLog({
    actorType: "parent",
    actorId: input.parentId,
    action: "level_change_request_created",
    resourceType: "course_level_change_request",
    resourceId: requestId,
    metadata: {
      requestId,
      parentId: input.parentId,
      enrollmentId: enrollment.id,
      paymentId: enrollment.paymentId,
      purchaseId: enrollment.paymentId,
      orderId: enrollment.paymentId,
      courseId: enrollment.courseId,
      courseSlug: enrollment.course.slug,
      courseTitle: enrollment.course.title,
      fromLevelId: input.fromLevelId ?? null,
      toLevelId: input.toLevelId ?? null,
      reasonCode: input.reasonCode,
      reasonFamily: toReasonFamily(input.reasonCode),
      requestChannel: input.requestChannel,
      requestActorRole: "user",
      eventVersion: 1,
      note: input.note?.trim() ?? null,
      status: "created",
      createdAt: new Date().toISOString(),
    },
  });

  return {
    requestId,
    purchaseId: enrollment.paymentId,
    orderId: enrollment.paymentId,
    courseId: enrollment.courseId,
    courseSlug: enrollment.course.slug,
    reused: false,
  };
}

export async function decideCourseLevelChangeRequest(input: {
  requestId: string;
  adminEmail: string;
  decision: CourseLevelChangeDecision;
  decisionReasonCode: string;
}) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.requestId}))`;

    const createdEvent = await tx.auditLog.findFirst({
      where: {
        action: "level_change_request_created",
        resourceType: "course_level_change_request",
        resourceId: input.requestId,
      },
      select: {
        id: true,
        createdAt: true,
        actorId: true,
        metadata: true,
      },
    });

    if (!createdEvent) {
      throw new DomainError("Level change request not found", 404, "COURSE_LEVEL_CHANGE_REQUEST_NOT_FOUND");
    }

    const existingDecision = await tx.auditLog.findFirst({
      where: {
        action: "level_change_request_decided",
        resourceType: "course_level_change_request",
        resourceId: input.requestId,
      },
      select: {
        id: true,
      },
    });

    if (existingDecision) {
      throw new DomainError("Level change request already decided", 409, "COURSE_LEVEL_CHANGE_REQUEST_ALREADY_DECIDED");
    }

    const now = new Date();
    const timeToDecisionSec = Math.max(0, Math.round((now.getTime() - createdEvent.createdAt.getTime()) / 1000));
    const createdMetadata = readMetadataObject(createdEvent.metadata);

    const decisionEntry = await createAuditLog({
      dbClient: tx,
      actorType: "admin",
      actorId: input.adminEmail,
      action: "level_change_request_decided",
      resourceType: "course_level_change_request",
      resourceId: input.requestId,
      metadata: {
        requestId: input.requestId,
        purchaseId: createdMetadata?.purchaseId ?? null,
        orderId: createdMetadata?.orderId ?? null,
        fromLevelId: createdMetadata?.fromLevelId ?? null,
        toLevelId: createdMetadata?.toLevelId ?? null,
        decision: input.decision,
        decisionReasonCode: input.decisionReasonCode,
        reviewerRole: "admin",
        requestActorRole: "user",
        parentId: createdEvent.actorId ?? null,
        timeToDecisionSec,
        eventVersion: 1,
        fromStatus: "created",
        toStatus: input.decision,
        decidedAt: now.toISOString(),
      },
    });

    return {
      decisionLogId: decisionEntry.id,
      requestId: input.requestId,
      timeToDecisionSec,
    };
  });
}

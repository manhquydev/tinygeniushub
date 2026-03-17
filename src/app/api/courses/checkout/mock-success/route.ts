import { type NextRequest, NextResponse } from "next/server";
import { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { parsePilotAttributionSnapshot } from "@/modules/courses/pilot-attribution";
import { getPublishedCoursesByBundleSlug } from "@/modules/courses/course-bundle-service";
import { trackPilotPurchaseSucceeded } from "@/modules/courses/pilot-funnel-tracking-service";
import { enrollParent } from "@/modules/courses/course-service";
import { createAuditLog } from "@/modules/platform/audit-service";

function redirectTo(pathnameWithQuery: string) {
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: pathnameWithQuery,
    },
  });
}

async function markMockPaymentSucceeded(input: {
  sessionId: string;
  amountVnd: string | null;
  metadata: Record<string, unknown>;
}) {
  await prisma.paymentRecord.updateMany({
    where: {
      provider: "mock_gateway",
      providerTransactionId: input.sessionId,
    },
    data: {
      status: PaymentStatus.SUCCEEDED,
      ...(Number.isFinite(Number.parseInt(input.amountVnd ?? "", 10))
        ? { amountVnd: Number.parseInt(input.amountVnd ?? "", 10) }
        : {}),
      processedAt: new Date(),
      rawPayload: {
        ...(input.metadata ?? {}),
      } as Prisma.InputJsonValue,
    },
  });
}

async function createMockPurchaseAuditIfMissing(input: {
  parentId: string;
  paymentRecordId: string;
  sessionId: string;
  amountVnd: number;
  targetKind: "bundle" | "course";
  targetSlug: string | null;
  attributionChannel: string;
  attributionExperimentCoursesVariant: string | null;
  attributionExperimentPricingVariant: string | null;
}) {
  const resourceId = `${input.parentId}:${input.paymentRecordId}`;
  const existing = await prisma.auditLog.findFirst({
    where: {
      actorType: "parent",
      actorId: input.parentId,
      action: "course_purchase_succeeded",
      resourceType: "course_checkout",
      resourceId,
    },
    select: { id: true },
  });
  if (existing) return;

  await createAuditLog({
    actorType: "parent",
    actorId: input.parentId,
    action: "course_purchase_succeeded",
    resourceType: "course_checkout",
    resourceId,
    metadata: {
      provider: "mock_gateway",
      amountVnd: input.amountVnd,
      paymentRecordId: input.paymentRecordId,
      sessionId: input.sessionId,
      targetKind: input.targetKind,
      targetSlug: input.targetSlug,
      attributionChannel: input.attributionChannel,
      attributionExperimentCoursesVariant: input.attributionExperimentCoursesVariant,
      attributionExperimentPricingVariant: input.attributionExperimentPricingVariant,
    } satisfies Prisma.JsonObject,
  });
}

/**
 * GET /api/courses/checkout/mock-success?courseId=...&parentId=...&amountVnd=...&sessionId=...
 *
 * Mock payment gateway callback. Creates enrollment then redirects to parent courses page.
 * Only active in development / when real payment gateway is not configured.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const courseId = searchParams.get("courseId");
  const bundleSlug = searchParams.get("bundleSlug");
  const parentId = searchParams.get("parentId");
  const amountVnd = searchParams.get("amountVnd");
  const sessionId = searchParams.get("sessionId");
  const parsedAmountVnd = Number.parseInt(amountVnd ?? "", 10);
  const safeAmountVnd = Number.isFinite(parsedAmountVnd) ? parsedAmountVnd : 0;

  if ((!courseId && !bundleSlug) || !parentId || !sessionId) {
    logWarn("courses.mock_checkout.missing_params", { courseId, bundleSlug, parentId, sessionId });
    return redirectTo("/courses?error=invalid_checkout");
  }

  try {
    const paymentRecord = await prisma.paymentRecord.findFirst({
      where: {
        provider: "mock_gateway",
        providerTransactionId: sessionId,
        parentId,
      },
      select: { id: true, rawPayload: true },
    });
    const paymentRecordId = paymentRecord?.id ?? `mock:${sessionId}`;
    const existingRawPayload =
      paymentRecord?.rawPayload && typeof paymentRecord.rawPayload === "object"
        ? (paymentRecord.rawPayload as Record<string, unknown>)
        : null;
    const attribution = parsePilotAttributionSnapshot(existingRawPayload?.attribution);

    if (bundleSlug) {
      const bundleResult = await getPublishedCoursesByBundleSlug(bundleSlug);
      const checkoutCourses =
        bundleResult.courses.length > 0 ? bundleResult.courses : bundleResult.legacyCourses;
      if (!bundleResult.bundle || checkoutCourses.length === 0) {
        logWarn("courses.mock_checkout.bundle_not_found", { bundleSlug, parentId });
        return redirectTo("/courses?error=bundle_not_found");
      }

      await prisma.$transaction(async (tx) => {
        for (const course of checkoutCourses) {
          await tx.courseEnrollment.upsert({
            where: {
              courseId_parentId: {
                courseId: course.id,
                parentId,
              },
            },
            update: {
              paymentId: sessionId,
            },
            create: {
              courseId: course.id,
              parentId,
              paymentId: sessionId,
            },
          });
        }
      });

      logInfo("courses.mock_checkout.bundle_enrolled", {
        bundleSlug,
        parentId,
        amountVnd,
        sessionId,
        courseCount: checkoutCourses.length,
      });
      await markMockPaymentSucceeded({
        sessionId,
        amountVnd,
        metadata: {
          kind: "course_checkout",
          target: {
            kind: "bundle",
            bundleSlug,
          },
          attribution,
        },
      });
      await createMockPurchaseAuditIfMissing({
        parentId,
        paymentRecordId,
        sessionId,
        amountVnd: safeAmountVnd,
        targetKind: "bundle",
        targetSlug: bundleSlug,
        attributionChannel: attribution?.channel ?? "unknown",
        attributionExperimentCoursesVariant: attribution?.experimentCoursesVariant ?? null,
        attributionExperimentPricingVariant: attribution?.experimentPricingVariant ?? null,
      });

      for (const course of checkoutCourses) {
        await trackPilotPurchaseSucceeded({
          parentId,
          paymentRecordId,
          courseId: course.id,
          courseSlug: course.slug,
          provider: "mock_gateway",
          amountVnd: safeAmountVnd,
          source: "mock_checkout",
          attribution,
        });
      }

      const firstChild = await prisma.childProfile.findFirst({
        where: { parentId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      const destinationWithChild = firstChild
        ? `/kid/courses/${encodeURIComponent(bundleResult.bundle.entryCourseSlug)}?childId=${encodeURIComponent(firstChild.id)}`
        : `/kid/courses/${encodeURIComponent(bundleResult.bundle.entryCourseSlug)}`;

      return redirectTo(destinationWithChild);
    }

    if (!courseId) {
      logWarn("courses.mock_checkout.missing_course_id", { parentId, sessionId });
      return redirectTo("/courses?error=invalid_checkout");
    }

    // Idempotency: if already enrolled, just redirect to success
    const existing = await prisma.courseEnrollment.findUnique({
      where: { courseId_parentId: { courseId, parentId } },
    });

    if (!existing) {
      await enrollParent(courseId, parentId, sessionId);
      logInfo("courses.mock_checkout.enrolled", { courseId, parentId, amountVnd, sessionId });
    } else {
      logInfo("courses.mock_checkout.already_enrolled", { courseId, parentId });
    }

    await markMockPaymentSucceeded({
      sessionId,
      amountVnd,
        metadata: {
          kind: "course_checkout",
          target: {
            kind: "course",
            courseId,
          },
          attribution,
        },
      });
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { slug: true },
    });
    await createMockPurchaseAuditIfMissing({
      parentId,
      paymentRecordId,
      sessionId,
      amountVnd: safeAmountVnd,
      targetKind: "course",
      targetSlug: course?.slug ?? null,
      attributionChannel: attribution?.channel ?? "unknown",
      attributionExperimentCoursesVariant: attribution?.experimentCoursesVariant ?? null,
      attributionExperimentPricingVariant: attribution?.experimentPricingVariant ?? null,
    });

    if (course) {
      await trackPilotPurchaseSucceeded({
        parentId,
        paymentRecordId,
        courseId,
        courseSlug: course.slug,
        provider: "mock_gateway",
        amountVnd: safeAmountVnd,
        source: "mock_checkout",
        attribution,
      });
    }

    if (course) {
      const firstChild = await prisma.childProfile.findFirst({
        where: { parentId },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      });

      if (firstChild) {
        const kidCourseUrl = `/kid/courses/${encodeURIComponent(course.slug)}?childId=${encodeURIComponent(firstChild.id)}`;
        return redirectTo(kidCourseUrl);
      }
    }

    const destination = course ? `/kid/courses/${encodeURIComponent(course.slug)}` : "/kid/courses";
    return redirectTo(destination);
  } catch (err) {
    logWarn("courses.mock_checkout.error", { courseId, bundleSlug, parentId, err: String(err) });
    return redirectTo("/courses?error=checkout_failed");
  }
}

import { type NextRequest, NextResponse } from "next/server";
import { PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
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

function asRecord(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

async function markMockPaymentSucceeded(input: {
  paymentRecordId: string;
  amountVnd: number;
  existingRawPayload: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
}) {
  await prisma.paymentRecord.update({
    where: {
      id: input.paymentRecordId,
    },
    data: {
      status: PaymentStatus.SUCCEEDED,
      amountVnd: input.amountVnd,
      processedAt: new Date(),
      rawPayload: {
        ...(input.existingRawPayload ?? {}),
        ...input.metadata,
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
 * GET /api/courses/checkout/mock-success?courseId=...&bundleSlug=...&amountVnd=...&sessionId=...
 *
 * Mock payment gateway callback.
 * Hard-disabled in production and when COURSE_PAYMENT_PROVIDER != mock_gateway.
 */
export async function GET(request: NextRequest) {
  if (
    env.COURSE_PAYMENT_PROVIDER !== "mock_gateway" ||
    (env.NODE_ENV === "production" && !env.ALLOW_PROD_MOCK_CHECKOUT_CALLBACK)
  ) {
    logWarn("courses.mock_checkout.disabled", {
      env: env.NODE_ENV,
      provider: env.COURSE_PAYMENT_PROVIDER,
      allowProdMockCallback: env.ALLOW_PROD_MOCK_CHECKOUT_CALLBACK,
    });
    return redirectTo("/courses?error=invalid_checkout");
  }

  const { searchParams } = request.nextUrl;
  const requestedCourseId = searchParams.get("courseId");
  const requestedBundleSlug = searchParams.get("bundleSlug");
  const sessionId = searchParams.get("sessionId");

  if ((!requestedCourseId && !requestedBundleSlug) || !sessionId) {
    logWarn("courses.mock_checkout.missing_params", {
      requestedCourseId,
      requestedBundleSlug,
      sessionId,
    });
    return redirectTo("/courses?error=invalid_checkout");
  }

  try {
    const paymentRecord = await prisma.paymentRecord.findUnique({
      where: {
        provider_providerTransactionId: {
          provider: "mock_gateway",
          providerTransactionId: sessionId,
        },
      },
      select: {
        id: true,
        parentId: true,
        amountVnd: true,
        status: true,
        rawPayload: true,
      },
    });

    if (!paymentRecord) {
      logWarn("courses.mock_checkout.payment_not_found", {
        sessionId,
      });
      return redirectTo("/courses?error=invalid_checkout");
    }

    if (
      paymentRecord.status !== PaymentStatus.PENDING &&
      paymentRecord.status !== PaymentStatus.SUCCEEDED
    ) {
      logWarn("courses.mock_checkout.payment_status_invalid", {
        sessionId,
        paymentRecordId: paymentRecord.id,
        status: paymentRecord.status,
      });
      return redirectTo("/courses?error=checkout_failed");
    }

    const existingRawPayload = asRecord(paymentRecord.rawPayload);
    const rawTarget = asRecord(existingRawPayload?.target);
    const attribution = parsePilotAttributionSnapshot(existingRawPayload?.attribution);
    const parentId = paymentRecord.parentId;
    const safeAmountVnd = paymentRecord.amountVnd;

    const effectiveBundleSlug =
      typeof rawTarget?.bundleSlug === "string" ? rawTarget.bundleSlug : requestedBundleSlug;
    const effectiveCourseId =
      typeof rawTarget?.courseId === "string" ? rawTarget.courseId : requestedCourseId;

    if (!effectiveBundleSlug && !effectiveCourseId) {
      logWarn("courses.mock_checkout.target_missing", {
        sessionId,
        paymentRecordId: paymentRecord.id,
      });
      return redirectTo("/courses?error=invalid_checkout");
    }

    if (
      (requestedBundleSlug && rawTarget?.kind === "course") ||
      (requestedCourseId && rawTarget?.kind === "bundle")
    ) {
      logWarn("courses.mock_checkout.target_kind_mismatch", {
        sessionId,
        paymentRecordId: paymentRecord.id,
        requestedBundleSlug,
        requestedCourseId,
        rawTarget,
      });
      return redirectTo("/courses?error=invalid_checkout");
    }

    if (
      requestedBundleSlug &&
      rawTarget?.kind === "bundle" &&
      rawTarget.bundleSlug !== requestedBundleSlug
    ) {
      logWarn("courses.mock_checkout.bundle_mismatch", {
        sessionId,
        paymentRecordId: paymentRecord.id,
        requestedBundleSlug,
        rawTargetBundleSlug: rawTarget.bundleSlug,
      });
      return redirectTo("/courses?error=invalid_checkout");
    }

    if (
      requestedCourseId &&
      rawTarget?.kind === "course" &&
      rawTarget.courseId !== requestedCourseId
    ) {
      logWarn("courses.mock_checkout.course_mismatch", {
        sessionId,
        paymentRecordId: paymentRecord.id,
        requestedCourseId,
        rawTargetCourseId: rawTarget.courseId,
      });
      return redirectTo("/courses?error=invalid_checkout");
    }

    if (effectiveBundleSlug) {
      const bundleResult = await getPublishedCoursesByBundleSlug(effectiveBundleSlug);
      const checkoutCourses =
        bundleResult.courses.length > 0 ? bundleResult.courses : bundleResult.legacyCourses;
      if (!bundleResult.bundle || checkoutCourses.length === 0) {
        logWarn("courses.mock_checkout.bundle_not_found", { effectiveBundleSlug, parentId });
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
              paymentId: paymentRecord.id,
            },
            create: {
              courseId: course.id,
              parentId,
              paymentId: paymentRecord.id,
            },
          });
        }
      });

      logInfo("courses.mock_checkout.bundle_enrolled", {
        effectiveBundleSlug,
        parentId,
        sessionId,
        courseCount: checkoutCourses.length,
      });

      await markMockPaymentSucceeded({
        paymentRecordId: paymentRecord.id,
        amountVnd: safeAmountVnd,
        existingRawPayload,
        metadata: {
          kind: "course_checkout",
          target: {
            kind: "bundle",
            bundleSlug: effectiveBundleSlug,
          },
          attribution,
        },
      });

      await createMockPurchaseAuditIfMissing({
        parentId,
        paymentRecordId: paymentRecord.id,
        sessionId,
        amountVnd: safeAmountVnd,
        targetKind: "bundle",
        targetSlug: effectiveBundleSlug,
        attributionChannel: attribution?.channel ?? "unknown",
        attributionExperimentCoursesVariant: attribution?.experimentCoursesVariant ?? null,
        attributionExperimentPricingVariant: attribution?.experimentPricingVariant ?? null,
      });

      for (const course of checkoutCourses) {
        await trackPilotPurchaseSucceeded({
          parentId,
          paymentRecordId: paymentRecord.id,
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

    const courseId = effectiveCourseId;
    if (!courseId) {
      logWarn("courses.mock_checkout.missing_course_id", { parentId, sessionId });
      return redirectTo("/courses?error=invalid_checkout");
    }

    const existing = await prisma.courseEnrollment.findUnique({
      where: { courseId_parentId: { courseId, parentId } },
    });

    if (!existing) {
      await enrollParent(courseId, parentId, paymentRecord.id);
      logInfo("courses.mock_checkout.enrolled", { courseId, parentId, sessionId });
    } else {
      logInfo("courses.mock_checkout.already_enrolled", { courseId, parentId });
    }

    await markMockPaymentSucceeded({
      paymentRecordId: paymentRecord.id,
      amountVnd: safeAmountVnd,
      existingRawPayload,
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
      paymentRecordId: paymentRecord.id,
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
        paymentRecordId: paymentRecord.id,
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
    logWarn("courses.mock_checkout.error", {
      requestedCourseId,
      requestedBundleSlug,
      sessionId,
      err: String(err),
    });
    return redirectTo("/courses?error=checkout_failed");
  }
}

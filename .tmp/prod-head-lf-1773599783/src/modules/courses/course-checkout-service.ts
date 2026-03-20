import { randomUUID } from "node:crypto";
import { addMinutes } from "date-fns";
import { prisma } from "@/lib/db";
import { getPublishedCoursesByBundleSlug } from "@/modules/courses/course-bundle-service";
import { DomainError } from "@/modules/platform/errors";
import { getEnrollment } from "@/modules/courses/course-service";

/** Create a course checkout session (mock provider).
 *  Returns checkoutUrl, discountApplied, finalPriceVnd */
export async function createCourseCheckoutSession(params: {
  parentId: string;
  slug: string;
}) {
  const { parentId, slug } = params;
  const bundleResult = await getPublishedCoursesByBundleSlug(slug);

  if (bundleResult.bundle) {
    if (bundleResult.courses.length === 0) {
      throw new DomainError("Course bundle is not available", 404, "COURSE_BUNDLE_NOT_PUBLISHED");
    }

    const existingEnrollments = await prisma.courseEnrollment.findMany({
      where: {
        parentId,
        courseId: {
          in: bundleResult.courses.map((course) => course.id),
        },
      },
      select: {
        courseId: true,
      },
    });

    if (existingEnrollments.length === bundleResult.courses.length) {
      throw new DomainError("Already enrolled in this course bundle", 409, "ALREADY_ENROLLED");
    }

    // Check if parent has active subscription -> 20% discount
    const subscription = await prisma.subscription.findUnique({
      where: { parentId },
      select: { status: true },
    });

    const hasActiveSub =
      subscription?.status === "ACTIVE_STANDARD" || subscription?.status === "ACTIVE_FAMILYPLUS";

    const discountApplied = hasActiveSub;
    const finalPriceVnd = hasActiveSub
      ? Math.round(bundleResult.bundle.priceVnd * 0.8)
      : bundleResult.bundle.priceVnd;

    const sessionId = `mock_course_bundle_${randomUUID()}`;
    const mockSuccessParams = new URLSearchParams({
      bundleSlug: bundleResult.bundle.slug,
      parentId,
      amountVnd: String(finalPriceVnd),
      sessionId,
    });
    const checkoutUrl = `/api/courses/checkout/mock-success?${mockSuccessParams.toString()}`;

    return {
      checkoutUrl,
      discountApplied,
      finalPriceVnd,
      expiresAt: addMinutes(new Date(), 30),
      sessionId,
    };
  }

  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) {
    throw new DomainError("Course not found", 404, "COURSE_NOT_FOUND");
  }
  if (!course.isPublished) {
    throw new DomainError("Course is not available", 404, "COURSE_NOT_PUBLISHED");
  }

  const existing = await getEnrollment(course.id, parentId);
  if (existing) {
    throw new DomainError("Already enrolled in this course", 409, "ALREADY_ENROLLED");
  }

  // Check if parent has active subscription → 20% discount
  const subscription = await prisma.subscription.findUnique({
    where: { parentId },
    select: { status: true },
  });

  const hasActiveSub =
    subscription?.status === "ACTIVE_STANDARD" || subscription?.status === "ACTIVE_FAMILYPLUS";

  const discountApplied = hasActiveSub;
  const finalPriceVnd = hasActiveSub ? Math.round(course.priceVnd * 0.8) : course.priceVnd;

  const sessionId = `mock_course_${randomUUID()}`;
  // Keep checkout redirect same-origin to avoid environment-specific host mismatches.
  const mockSuccessParams = new URLSearchParams({
    courseId: course.id,
    parentId,
    amountVnd: String(finalPriceVnd),
    sessionId,
  });
  const checkoutUrl = `/api/courses/checkout/mock-success?${mockSuccessParams.toString()}`;

  return {
    checkoutUrl,
    discountApplied,
    finalPriceVnd,
    expiresAt: addMinutes(new Date(), 30),
    sessionId,
  };
}

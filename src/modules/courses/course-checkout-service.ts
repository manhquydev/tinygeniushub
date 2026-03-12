import { randomUUID } from "node:crypto";
import { addMinutes } from "date-fns";
import { prisma } from "@/lib/db";
import { DomainError } from "@/modules/platform/errors";
import { getEnrollment } from "@/modules/courses/course-service";

/** Create a course checkout session (mock provider).
 *  Returns checkoutUrl, discountApplied, finalPriceVnd */
export async function createCourseCheckoutSession(params: {
  parentId: string;
  slug: string;
}) {
  const { parentId, slug } = params;

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

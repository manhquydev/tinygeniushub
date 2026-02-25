import { randomUUID } from "node:crypto";
import { addMinutes } from "date-fns";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
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
  // Redirect to mock-success handler which creates the enrollment, then goes to lessons
  const mockSuccessUrl = new URL("/api/courses/checkout/mock-success", env.BETTER_AUTH_URL);
  mockSuccessUrl.searchParams.set("courseId", course.id);
  mockSuccessUrl.searchParams.set("parentId", parentId);
  mockSuccessUrl.searchParams.set("amountVnd", String(finalPriceVnd));
  mockSuccessUrl.searchParams.set("sessionId", sessionId);

  return {
    checkoutUrl: mockSuccessUrl.toString(),
    discountApplied,
    finalPriceVnd,
    expiresAt: addMinutes(new Date(), 30),
    sessionId,
  };
}

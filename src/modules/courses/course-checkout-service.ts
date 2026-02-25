import { randomUUID } from "node:crypto";
import { addMinutes } from "date-fns";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { DomainError } from "@/modules/platform/errors";
import { getEnrollment } from "@/modules/courses/course-service";

function ensureSafePath(path: string) {
  if (!path.startsWith("/")) {
    throw new DomainError("Redirect path must start with '/'", 400, "INVALID_REDIRECT_PATH");
  }
  if (path.startsWith("//")) {
    throw new DomainError("Redirect path cannot start with '//'", 400, "INVALID_REDIRECT_PATH");
  }
  return path;
}

function resolveAbsoluteUrl(path: string) {
  const safePath = ensureSafePath(path);
  return new URL(safePath, env.BETTER_AUTH_URL).toString();
}

/** Create a course checkout session (mock provider).
 *  Returns checkoutUrl, discountApplied, finalPriceVnd */
export async function createCourseCheckoutSession(params: {
  parentId: string;
  slug: string;
  successPath?: string;
  cancelPath?: string;
}) {
  const { parentId, slug } = params;
  const successPath = params.successPath ?? "/parent/dashboard";
  const cancelPath = params.cancelPath ?? "/courses";

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
  const successUrl = resolveAbsoluteUrl(successPath);
  const target = new URL(successUrl);
  target.searchParams.set("mockCheckout", "1");
  target.searchParams.set("courseId", course.id);
  target.searchParams.set("parentId", parentId);
  target.searchParams.set("amountVnd", String(finalPriceVnd));
  target.searchParams.set("sessionId", sessionId);

  return {
    checkoutUrl: target.toString(),
    discountApplied,
    finalPriceVnd,
    expiresAt: addMinutes(new Date(), 30),
    sessionId,
  };
}

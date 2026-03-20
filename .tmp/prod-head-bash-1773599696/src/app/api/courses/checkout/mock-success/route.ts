import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { getPublishedCoursesByBundleSlug } from "@/modules/courses/course-bundle-service";
import { enrollParent } from "@/modules/courses/course-service";

function redirectTo(pathnameWithQuery: string) {
  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: pathnameWithQuery,
    },
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

  if ((!courseId && !bundleSlug) || !parentId || !sessionId) {
    logWarn("courses.mock_checkout.missing_params", { courseId, bundleSlug, parentId, sessionId });
    return redirectTo("/courses?error=invalid_checkout");
  }

  try {
    if (bundleSlug) {
      const bundleResult = await getPublishedCoursesByBundleSlug(bundleSlug);
      if (!bundleResult.bundle || bundleResult.courses.length === 0) {
        logWarn("courses.mock_checkout.bundle_not_found", { bundleSlug, parentId });
        return redirectTo("/courses?error=bundle_not_found");
      }

      await prisma.$transaction(async (tx) => {
        for (const course of bundleResult.courses) {
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
        courseCount: bundleResult.courses.length,
      });

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

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { slug: true },
    });

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

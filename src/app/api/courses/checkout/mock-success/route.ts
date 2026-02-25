import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logInfo, logWarn } from "@/lib/observability/logger";
import { enrollParent } from "@/modules/courses/course-service";

/**
 * GET /api/courses/checkout/mock-success?courseId=...&parentId=...&amountVnd=...&sessionId=...
 *
 * Mock payment gateway callback. Creates enrollment then redirects to parent courses page.
 * Only active in development / when real payment gateway is not configured.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const courseId = searchParams.get("courseId");
  const parentId = searchParams.get("parentId");
  const amountVnd = searchParams.get("amountVnd");
  const sessionId = searchParams.get("sessionId");

  if (!courseId || !parentId || !sessionId) {
    logWarn("courses.mock_checkout.missing_params", { courseId, parentId, sessionId });
    return NextResponse.redirect(new URL("/courses?error=invalid_checkout", request.nextUrl.origin));
  }

  try {
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

    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { slug: true } });
    const destination = course ? `/courses/${course.slug}/lessons` : "/parent/courses";
    return NextResponse.redirect(new URL(destination, request.nextUrl.origin));
  } catch (err) {
    logWarn("courses.mock_checkout.error", { courseId, parentId, err: String(err) });
    return NextResponse.redirect(new URL("/courses?error=checkout_failed", request.nextUrl.origin));
  }
}

import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { resolveCourseDisplayPricing } from "@/modules/courses/course-pricing";
import { z } from "zod";

const publishCourseSchema = z.object({
  isPublished: z.boolean().optional(),
});
const MIN_COURSE_DESCRIPTION_LENGTH = 80;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    await requireAdminFromRequest(request);
    const { id } = await params;
    const body = publishCourseSchema.parse(await request.json().catch(() => ({})));

    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        id: true,
        isPublished: true,
        priceVnd: true,
        listPriceVnd: true,
        salePriceVnd: true,
        saleStartsAt: true,
        saleEndsAt: true,
        description: true,
      },
    });
    if (!course) {
      return fail("Course not found", 404);
    }

    const nextPublished = body.isPublished ?? !course.isPublished;
    if (nextPublished) {
      const normalizedDescription = course.description.trim();
      if (normalizedDescription.length < MIN_COURSE_DESCRIPTION_LENGTH) {
        return fail("Course description is not ready for publish", 422, {
          code: "COURSE_PUBLISH_DESCRIPTION_TOO_SHORT",
          minDescriptionLength: MIN_COURSE_DESCRIPTION_LENGTH,
        });
      }
      const pricing = resolveCourseDisplayPricing(course);
      if (pricing.saleStatus === "invalid") {
        return fail("Course pricing is not ready for publish", 422, {
          code: "COURSE_PUBLISH_PRICING_INVALID",
        });
      }
    }

    const updated = await prisma.course.update({
      where: { id },
      data: { isPublished: nextPublished },
    });

    return ok({ course: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}

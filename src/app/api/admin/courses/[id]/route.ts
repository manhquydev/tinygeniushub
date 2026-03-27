import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { normalizeCourseAdminPricing } from "@/modules/courses/course-admin-pricing";
import { resolveCourseDisplayPricing } from "@/modules/courses/course-pricing";
import { DomainError } from "@/modules/platform/errors";
import { z } from "zod";

const courseCoverImageSchema = z.union([
  z.string().url(),
  z.string().regex(/^\/[^\s]*$/),
]);

const nullableDateSchema = z.union([z.coerce.date(), z.null()]);

const updateCourseSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  priceVnd: z.number().int().min(0).optional(),
  listPriceVnd: z.number().int().min(0).nullable().optional(),
  salePriceVnd: z.number().int().min(0).nullable().optional(),
  saleStartsAt: nullableDateSchema.optional(),
  saleEndsAt: nullableDateSchema.optional(),
  durationDays: z.number().int().min(1).optional(),
  coverImageUrl: courseCoverImageSchema.nullish(),
  isPublished: z.boolean().optional(),
});

type NormalizedCoursePricingPayload = {
  priceVnd: number;
  listPriceVnd: number;
  salePriceVnd: number | null;
  saleStartsAt: Date | null;
  saleEndsAt: Date | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminFromRequest(request);
    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { orderNo: "asc" },
          include: {
            lesson: {
              select: {
                id: true,
                slug: true,
                title: true,
                estimatedMinutes: true,
                trialEnabled: true,
                videoStatus: true,
                _count: { select: { activities: true } },
              },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) {
      return fail("Course not found", 404);
    }

    return ok({ course });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    await requireAdminFromRequest(request);
    const { id } = await params;
    const body = updateCourseSchema.parse(await request.json());

    const existing = await prisma.course.findUnique({ where: { id } });
    if (!existing) {
      return fail("Course not found", 404);
    }

    const hasPricingPatch =
      body.priceVnd !== undefined ||
      body.listPriceVnd !== undefined ||
      body.salePriceVnd !== undefined ||
      body.saleStartsAt !== undefined ||
      body.saleEndsAt !== undefined;

    const normalizedPricing = hasPricingPatch
      ? (normalizeCourseAdminPricing({
          priceVnd: body.priceVnd ?? existing.priceVnd,
          listPriceVnd:
            body.listPriceVnd === undefined ? existing.listPriceVnd : body.listPriceVnd,
          salePriceVnd:
            body.salePriceVnd === undefined ? existing.salePriceVnd : body.salePriceVnd,
          saleStartsAt:
            body.saleStartsAt === undefined ? existing.saleStartsAt : body.saleStartsAt,
          saleEndsAt: body.saleEndsAt === undefined ? existing.saleEndsAt : body.saleEndsAt,
        }) satisfies NormalizedCoursePricingPayload)
      : null;

    if (body.isPublished === true) {
      const pricing = resolveCourseDisplayPricing(
        normalizedPricing ?? {
          priceVnd: existing.priceVnd,
          listPriceVnd: existing.listPriceVnd,
          salePriceVnd: existing.salePriceVnd,
          saleStartsAt: existing.saleStartsAt,
          saleEndsAt: existing.saleEndsAt,
        },
      );
      if (!pricing.isPurchasable || pricing.saleStatus === "invalid") {
        throw new DomainError(
          "Course pricing is not ready for publish",
          422,
          "COURSE_PUBLISH_PRICING_INVALID",
        );
      }
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.durationDays !== undefined && { durationDays: body.durationDays }),
        ...(body.coverImageUrl !== undefined && { coverImageUrl: body.coverImageUrl }),
        ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
        ...(normalizedPricing !== null && {
          priceVnd: normalizedPricing.priceVnd,
          listPriceVnd: normalizedPricing.listPriceVnd,
          salePriceVnd: normalizedPricing.salePriceVnd,
          saleStartsAt: normalizedPricing.saleStartsAt,
          saleEndsAt: normalizedPricing.saleEndsAt,
        }),
      },
    });

    return ok({ course });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    await requireAdminFromRequest(request, ["SUPER_ADMIN"]);
    const { id } = await params;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return fail("Course not found", 404);
    }

    const enrolledCount = await prisma.courseEnrollment.count({
      where: { courseId: id },
    });
    if (enrolledCount > 0) {
      throw new DomainError(
        "Khong the xoa khoa hoc da co hoc vien dang ky",
        409,
        "COURSE_HAS_ENROLLMENTS",
      );
    }

    await prisma.course.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

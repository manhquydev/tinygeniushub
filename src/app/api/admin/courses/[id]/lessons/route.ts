import type { NextRequest } from "next/server";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { z } from "zod";

const addCourseLessonSchema = z.object({
  lessonId: z.string().min(1),
  orderNo: z.coerce.number().int().min(1).default(1),
});

const reorderCourseLessonsSchema = z.object({
  orders: z
    .array(
      z.object({
        lessonId: z.string().min(1),
        orderNo: z.coerce.number().int().min(1),
      }),
    )
    .min(1),
});

const removeCourseLessonSchema = z.object({
  lessonId: z.string().min(1),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminFromRequest(request);
    const { id } = await params;

    const courseLessons = await prisma.courseLesson.findMany({
      where: { courseId: id },
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
    });

    return ok({ courseLessons });
  } catch (error) {
    return handleRouteError(error);
  }
}

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
    const body = addCourseLessonSchema.parse(await request.json());

    const courseLesson = await prisma.courseLesson.create({
      data: {
        courseId: id,
        lessonId: body.lessonId,
        orderNo: body.orderNo,
      },
    });

    return ok({ courseLesson });
  } catch (error) {
    return handleRouteError(error);
  }
}

// PATCH /api/admin/courses/[id]/lessons â€” bulk reorder { orders: [{lessonId, orderNo}] }
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
    const body = reorderCourseLessonsSchema.parse(await request.json());

    await prisma.$transaction(
      body.orders.map(({ lessonId, orderNo }) =>
        prisma.courseLesson.updateMany({
          where: { courseId: id, lessonId },
          data: { orderNo },
        }),
      ),
    );

    return ok({ reordered: true });
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
    await requireAdminFromRequest(request);
    const { id } = await params;
    const body = removeCourseLessonSchema.parse(await request.json());

    await prisma.courseLesson.deleteMany({
      where: { courseId: id, lessonId: body.lessonId },
    });

    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}



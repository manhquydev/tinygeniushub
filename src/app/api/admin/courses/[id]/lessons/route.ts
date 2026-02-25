import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";

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
    await requireAdminFromRequest(request);
    const { id } = await params;
    const body = (await request.json()) as { lessonId?: string; orderNo?: number };

    if (!body.lessonId) {
      return fail("lessonId is required", 400);
    }

    const courseLesson = await prisma.courseLesson.create({
      data: {
        courseId: id,
        lessonId: body.lessonId,
        orderNo: body.orderNo ?? 1,
      },
    });

    return ok({ courseLesson });
  } catch (error) {
    return handleRouteError(error);
  }
}

// PATCH /api/admin/courses/[id]/lessons — bulk reorder { orders: [{lessonId, orderNo}] }
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminFromRequest(request);
    const { id } = await params;
    const body = (await request.json()) as { orders?: Array<{ lessonId: string; orderNo: number }> };

    if (!Array.isArray(body.orders) || body.orders.length === 0) {
      return fail("orders array is required", 400);
    }

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
    await requireAdminFromRequest(request);
    const { id } = await params;
    const body = (await request.json()) as { lessonId?: string };

    if (!body.lessonId) {
      return fail("lessonId is required", 400);
    }

    await prisma.courseLesson.deleteMany({
      where: { courseId: id, lessonId: body.lessonId },
    });

    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

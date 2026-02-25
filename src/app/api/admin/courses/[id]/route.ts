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
    await requireAdminFromRequest(request);
    const { id } = await params;
    const body = (await request.json()) as {
      slug?: string;
      title?: string;
      description?: string;
      priceVnd?: number;
      durationDays?: number;
      coverImageUrl?: string | null;
      isPublished?: boolean;
    };

    const course = await prisma.course.update({
      where: { id },
      data: {
        ...(body.slug !== undefined && { slug: body.slug }),
        ...(body.title !== undefined && { title: body.title }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.priceVnd !== undefined && { priceVnd: body.priceVnd }),
        ...(body.durationDays !== undefined && { durationDays: body.durationDays }),
        ...(body.coverImageUrl !== undefined && { coverImageUrl: body.coverImageUrl }),
        ...(body.isPublished !== undefined && { isPublished: body.isPublished }),
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
    await requireAdminFromRequest(request);
    const { id } = await params;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return fail("Course not found", 404);
    }

    await prisma.course.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

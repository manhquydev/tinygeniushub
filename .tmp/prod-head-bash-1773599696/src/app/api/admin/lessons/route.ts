import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { prisma } from "@/lib/db";

// GET /api/admin/lessons?search=&limit=30&excludeCourseId=
// Returns lessons for picker (add to course)
export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim() ?? "";
    const limit = Math.min(Number(searchParams.get("limit") ?? "30"), 100);
    const excludeCourseId = searchParams.get("excludeCourseId")?.trim() ?? "";

    const lessons = await prisma.lesson.findMany({
      where: {
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { slug: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(excludeCourseId
          ? {
              courseItems: { none: { courseId: excludeCourseId } },
            }
          : {}),
      },
      select: {
        id: true,
        slug: true,
        title: true,
        estimatedMinutes: true,
        trialEnabled: true,
        videoStatus: true,
        unit: {
          select: {
            title: true,
            level: { select: { title: true, track: { select: { code: true } } } },
          },
        },
        _count: { select: { activities: true } },
      },
      orderBy: { title: "asc" },
      take: limit,
    });

    return ok({ lessons });
  } catch (error) {
    return handleRouteError(error);
  }
}

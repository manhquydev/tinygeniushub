import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { isParentAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { completeCourse } from "@/modules/courses/course-service";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const { slug } = await params;
    const body = (await request.json()) as { parentId?: string };

    // Admin can complete on behalf of any parent; otherwise must be enrolled parent
    const targetParentId = isParentAdmin(parent) ? (body.parentId ?? parent.id) : parent.id;

    const course = await prisma.course.findUnique({ where: { slug } });
    if (!course) {
      return fail("Course not found", 404);
    }

    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { courseId_parentId: { courseId: course.id, parentId: targetParentId } },
    });
    if (!enrollment) {
      return fail("Not enrolled in this course", 403);
    }

    const updated = await completeCourse(enrollment.id);
    return ok({ enrollment: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}

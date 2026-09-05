import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { isParentAdmin } from "@/lib/auth/admin";
import { prisma } from "@/lib/db";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { completeCourse } from "@/modules/courses/course-service";
import { listLiveCourseIds } from "@/modules/entitlement/course-tickets";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const { slug } = await params;
    const body = (await request.json()) as { parentId?: string };
    const targetParentId = isParentAdmin(parent) ? (body.parentId ?? parent.id) : parent.id;

    const course = await prisma.course.findUnique({ where: { slug } });
    if (!course) {
      return fail("Course not found", 404);
    }

    const ticketedIds = await listLiveCourseIds(targetParentId);
    if (!ticketedIds.includes(course.id)) {
      return fail("Household ticket required to complete this course", 403, {
        code: "LEARN_ACCESS_DENIED",
      });
    }

    let enrollment = await prisma.courseEnrollment.findUnique({
      where: { courseId_parentId: { courseId: course.id, parentId: targetParentId } },
    });
    if (!enrollment) {
      enrollment = await prisma.courseEnrollment.create({
        data: { courseId: course.id, parentId: targetParentId },
      });
    }

    const updated = await completeCourse(enrollment.id);
    return ok({ enrollment: updated });
  } catch (error) {
    return handleRouteError(error);
  }
}

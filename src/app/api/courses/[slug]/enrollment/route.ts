import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { getEnrollment } from "@/modules/courses/course-service";
import { resolveKidCourseAccess } from "@/modules/courses/kid-course-access";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const { slug } = await params;
    const access = await resolveKidCourseAccess({
      parentId: parent.id,
      requestedSlug: slug,
    });

    if (!access.course) {
      return fail("Course not found", 404);
    }

    const enrollment = await getEnrollment(access.course.id, parent.id);
    return ok({
      enrolled: access.hasAccess,
      enrollment,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

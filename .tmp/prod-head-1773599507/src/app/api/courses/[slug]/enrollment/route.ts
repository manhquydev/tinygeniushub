import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { getCourse, getEnrollment } from "@/modules/courses/course-service";

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
    const course = await getCourse(slug);
    if (!course) {
      return fail("Course not found", 404);
    }

    const enrollment = await getEnrollment(course.id, parent.id);
    return ok({ enrolled: Boolean(enrollment), enrollment });
  } catch (error) {
    return handleRouteError(error);
  }
}

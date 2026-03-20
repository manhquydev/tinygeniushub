import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { getEnrolledCoursesForKidDashboard } from "@/modules/courses/course-service";

/**
 * GET /api/courses/enrolled?childId=xxx
 * Returns courses the parent has purchased, augmented with the child's journey status.
 */
export async function GET(request: NextRequest) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    if (!childId) {
      return fail("childId is required", 400);
    }

    const courses = await getEnrolledCoursesForKidDashboard({
      parentId: parent.id,
      childId,
    });

    return ok({ courses });
  } catch (error) {
    return handleRouteError(error);
  }
}

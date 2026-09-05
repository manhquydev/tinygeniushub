import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { listEntitledCoursesForChild } from "@/modules/courses/entitled-course-lists";

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
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId: parent.id },
      select: { id: true },
    });
    if (!child) {
      return fail("Child profile not found", 404);
    }

    const courses = await listEntitledCoursesForChild({
      parentId: parent.id,
      childId,
    });

    return ok({ courses });
  } catch (error) {
    return handleRouteError(error);
  }
}

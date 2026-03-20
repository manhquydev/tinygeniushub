/**
 * GET /api/children/[childId]/learning-trajectory
 * Returns 8-week learning trajectory for a parent's own child.
 */

import type { NextRequest } from "next/server";
import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { prisma } from "@/lib/db";
import { getChildLearningTrajectory } from "@/modules/adaptive/analytics-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) return fail("Unauthorized", 401);

    const { childId } = await params;

    // Enforce: only the parent of this child can view trajectory
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId: parent.id },
      select: { id: true, nickname: true },
    });
    if (!child) return fail("Child not found or access denied", 403);

    const trajectory = await getChildLearningTrajectory(childId, 8);
    return ok({ child, trajectory });
  } catch (error) {
    return handleRouteError(error);
  }
}

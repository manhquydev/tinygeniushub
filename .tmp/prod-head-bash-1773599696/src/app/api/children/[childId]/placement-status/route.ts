/**
 * GET /api/children/[childId]/placement-status
 * Get placement test status for a child across all domains.
 */

import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getPlacementStatus } from "@/modules/adaptive/placement-test-service";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const { childId } = await params;

    // Verify child belongs to parent
    const { prisma } = await import("@/lib/db");
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId: parent.id },
    });
    if (!child) {
      return fail("Child not found", 404);
    }

    const status = await getPlacementStatus(childId);
    return ok({ status, placementRequired: !status["MATH"]?.completed || !status["ENGLISH_PHONICS"]?.completed });
  } catch (error) {
    return handleRouteError(error);
  }
}

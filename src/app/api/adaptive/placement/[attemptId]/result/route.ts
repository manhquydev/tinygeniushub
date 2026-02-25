/**
 * GET /api/adaptive/placement/[attemptId]/result
 * Get results for a completed placement test attempt.
 */

import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getAttemptResult } from "@/modules/adaptive/placement-test-service";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const { attemptId } = await params;

    // Find child ID associated with this attempt and verify parent ownership
    const { prisma } = await import("@/lib/db");
    const attempt = await prisma.placementTestAttempt.findFirst({
      where: { id: attemptId, child: { parentId: parent.id } },
      select: { childId: true, completedAt: true },
    });

    if (!attempt) {
      return fail("Attempt not found", 404);
    }

    if (!attempt.completedAt) {
      return fail("Attempt not yet completed", 400);
    }

    const result = await getAttemptResult(attemptId, attempt.childId);
    if (!result) {
      return fail("Result not found", 404);
    }

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

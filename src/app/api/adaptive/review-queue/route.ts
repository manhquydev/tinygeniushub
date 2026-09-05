/**
 * GET /api/adaptive/review-queue?childId=...
 * Returns the child's pending review queue with due count.
 */

import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { requireParentAndOwnedChild } from "@/lib/auth/require-parent-child";
import { getReviewQueue } from "@/modules/adaptive/spaced-repetition-service";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const childId = request.nextUrl.searchParams.get("childId");
    if (!childId) return fail("Missing childId", 400);

    const auth = await requireParentAndOwnedChild(request, childId);
    if (!auth.ok) return auth.response;

    const items = await getReviewQueue(auth.child.id);
    const now = new Date();
    const dueCount = items.filter((item) => item.scheduledAt <= now).length;

    return ok({
      dueCount,
      items: items.map((item) => ({
        id: item.id,
        skill: item.skill,
        scheduledAt: item.scheduledAt,
        intervalDays: item.intervalDays,
        repetitions: item.repetitions,
      })),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

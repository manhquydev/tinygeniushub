/**
 * GET /api/adaptive/review-queue?childId=...
 * Returns the child's pending review queue with due count.
 */

import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { getReviewQueue } from "@/modules/adaptive/spaced-repetition-service";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) return fail("Unauthorized", 401);

    const childId = request.nextUrl.searchParams.get("childId");
    if (!childId) return fail("Missing childId", 400);

    const items = await getReviewQueue(childId);
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

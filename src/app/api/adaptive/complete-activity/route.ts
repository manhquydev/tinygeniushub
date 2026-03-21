/**
 * POST /api/adaptive/complete-activity
 * Records activity completion, updates mastery state, and schedules review.
 *
 * Body: { childId, skillId, isCorrect, activityId?, responseMs?, rawResponse? }
 */

import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { handleActivityCompletion } from "@/modules/adaptive/activity-completion-handler";
import { prisma } from "@/lib/db";
import { z } from "zod";
import type { NextRequest } from "next/server";

const schema = z.object({
  childId: z.string().min(1),
  skillId: z.string().min(1),
  isCorrect: z.boolean(),
  activityId: z.string().optional(),
  responseMs: z.number().int().positive().optional(),
  rawResponse: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);

    const parent = await getParentFromRequest(request);
    if (!parent) return fail("Unauthorized", 401);

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return fail("Invalid request body", 400);
    }

    // Verify childId belongs to the authenticated parent
    const child = await prisma.childProfile.findFirst({
      where: { id: parsed.data.childId, parentId: parent.id },
      select: { id: true },
    });
    if (!child) {
      return fail("Child not found", 404);
    }

    const result = await handleActivityCompletion({
      ...parsed.data,
      rawResponse: parsed.data.rawResponse as Record<string, unknown> | undefined,
    });

    return ok({
      masteryUpdate: {
        after: result.masteryAfter,
      },
      nextReviewAt: result.nextReviewAt,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

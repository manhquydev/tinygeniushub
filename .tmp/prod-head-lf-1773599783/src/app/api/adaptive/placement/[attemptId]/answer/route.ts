/**
 * POST /api/adaptive/placement/[attemptId]/answer
 * Submit an answer for the current placement test item.
 * Body: { itemId: string, response: unknown, responseMs?: number }
 */

import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { answerPlacementItem } from "@/modules/adaptive/placement-test-service";
import type { NextRequest } from "next/server";

const MIN_RESPONSE_MS = 500; // Prevent random rapid clicking

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    assertTrustedOrigin(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const { attemptId } = await params;
    const body = (await request.json()) as { itemId?: string; response?: unknown; responseMs?: number };

    const { itemId, response, responseMs } = body;

    if (!itemId || typeof itemId !== "string") {
      return fail("itemId is required", 400);
    }

    if (response === undefined) {
      return fail("response is required", 400);
    }

    // Validate attempt belongs to parent's child
    const { prisma } = await import("@/lib/db");
    const attempt = await prisma.placementTestAttempt.findFirst({
      where: { id: attemptId, child: { parentId: parent.id } },
    });
    if (!attempt) {
      return fail("Attempt not found", 404);
    }

    // Enforce minimum response time
    const effectiveMs = responseMs && responseMs >= MIN_RESPONSE_MS ? responseMs : undefined;

    const result = await answerPlacementItem(attemptId, itemId, response, effectiveMs);
    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Attempt already completed") return fail(error.message, 409);
      if (error.message === "Item already answered") return fail(error.message, 409);
      if (error.message === "Item not found in this test") return fail(error.message, 404);
    }
    return handleRouteError(error);
  }
}

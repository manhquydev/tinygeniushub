/**
 * POST /api/adaptive/placement/start
 * Start a new placement test attempt for a child.
 * Body: { childId: string, domain: "MATH" | "ENGLISH_PHONICS" }
 */

import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { startPlacementTest } from "@/modules/adaptive/placement-test-service";
import type { SkillDomain } from "@prisma/client";
import type { NextRequest } from "next/server";

const VALID_DOMAINS: SkillDomain[] = ["MATH", "ENGLISH_PHONICS"];

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const body = (await request.json()) as { childId?: string; domain?: string };
    const { childId, domain } = body;

    if (!childId || typeof childId !== "string") {
      return fail("childId is required", 400);
    }

    if (!domain || !VALID_DOMAINS.includes(domain as SkillDomain)) {
      return fail(`domain must be one of: ${VALID_DOMAINS.join(", ")}`, 400);
    }

    // Verify child belongs to parent
    const { prisma } = await import("@/lib/db");
    const child = await prisma.childProfile.findFirst({
      where: { id: childId, parentId: parent.id },
    });
    if (!child) {
      return fail("Child not found", 404);
    }

    const result = await startPlacementTest(childId, domain as SkillDomain);
    return ok(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Not eligible")) {
      return fail(error.message, 409);
    }
    return handleRouteError(error);
  }
}

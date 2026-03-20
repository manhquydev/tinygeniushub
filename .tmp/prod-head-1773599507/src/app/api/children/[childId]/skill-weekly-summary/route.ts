/**
 * GET /api/children/[childId]/skill-weekly-summary
 * Returns weekly learning summary for a child.
 */

import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getWeeklySummary } from "@/modules/adaptive/skill-map-service";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) return fail("Unauthorized", 401);

    const { childId } = await params;

    const { prisma } = await import("@/lib/db");
    const child = await prisma.childProfile.findFirst({ where: { id: childId, parentId: parent.id } });
    if (!child) return fail("Child not found", 404);

    const summary = await getWeeklySummary(childId);
    return ok(summary);
  } catch (error) {
    return handleRouteError(error);
  }
}

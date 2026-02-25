/**
 * GET /api/children/[childId]/skill-detail/[skillId]
 * Returns skill detail with mastery, recent attempts, and trend.
 */

import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getSkillDetail } from "@/modules/adaptive/skill-map-service";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string; skillId: string }> },
) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) return fail("Unauthorized", 401);

    const { childId, skillId } = await params;

    const { prisma } = await import("@/lib/db");
    const child = await prisma.childProfile.findFirst({ where: { id: childId, parentId: parent.id } });
    if (!child) return fail("Child not found", 404);

    const detail = await getSkillDetail(childId, skillId);
    if (!detail) return fail("Skill not found", 404);

    return ok(detail);
  } catch (error) {
    return handleRouteError(error);
  }
}

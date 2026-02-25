/**
 * GET /api/organizations/[orgId]/class-skill-heatmap?domain=MATH
 * Returns class skill heatmap for teacher-admin only.
 */

import type { NextRequest } from "next/server";
import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getClassHeatmapForTeacher } from "@/modules/organizations/class-skill-heatmap-service";
import type { SkillDomain } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) return fail("Unauthorized", 401);

    const { orgId } = await params;
    const domain = new URL(request.url).searchParams.get("domain") as SkillDomain | null;
    if (!domain) return fail("domain query param is required (e.g. MATH)", 400);

    const data = await getClassHeatmapForTeacher(orgId, parent.id, domain);
    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

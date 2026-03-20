/**
 * GET /api/children/[childId]/skill-map?domain=MATH
 * Returns skill map with mastery + locked status for a child in a domain.
 */

import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getSkillMap } from "@/modules/adaptive/skill-map-service";
import type { SkillDomain } from "@prisma/client";
import type { NextRequest } from "next/server";

const VALID_DOMAINS: SkillDomain[] = ["MATH", "ENGLISH_PHONICS"];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) return fail("Unauthorized", 401);

    const { childId } = await params;
    const domain = (request.nextUrl.searchParams.get("domain") ?? "MATH") as SkillDomain;

    if (!VALID_DOMAINS.includes(domain)) {
      return fail("Invalid domain. Use MATH or ENGLISH_PHONICS", 400);
    }

    const { prisma } = await import("@/lib/db");
    const child = await prisma.childProfile.findFirst({ where: { id: childId, parentId: parent.id } });
    if (!child) return fail("Child not found", 404);

    const data = await getSkillMap(childId, domain);
    return ok(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

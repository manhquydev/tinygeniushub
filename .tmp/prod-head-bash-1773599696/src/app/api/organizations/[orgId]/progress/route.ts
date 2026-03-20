import type { NextRequest } from "next/server";
import { getParentFromRequest } from "@/lib/auth/session";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getOrgStudentProgress } from "@/modules/organizations/organization-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) return fail("Unauthorized", 401);

    const { orgId } = await params;
    const progress = await getOrgStudentProgress(orgId, parent.id);
    return ok({ progress });
  } catch (error) {
    return handleRouteError(error);
  }
}

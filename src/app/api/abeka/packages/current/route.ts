/**
 * GET /api/abeka/packages/current?childId=xxx
 * Get user's active package for a child or account
 */

import { NextRequest } from "next/server";
import { getCurrentPackage, getCurrentPackageSchema } from "@/modules/billing/package-service";
import { getParentFromRequest } from "@/lib/auth/session";
import { handleRouteError } from "@/lib/route-error";
import { fail, ok } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const query = getCurrentPackageSchema.parse({
      childId: searchParams.get("childId") || undefined,
    });

    const result = await getCurrentPackage(parent.id, query.childId);

    if (!result) {
      return ok({
        package: null,
        subscription: null,
        accessibleGrades: [],
        accessibleVideoCount: 0,
      });
    }

    return ok({
      package: result.package,
      subscription: result.subscription,
      accessibleGrades: result.accessibleGrades,
      accessibleVideoCount: result.accessibleVideoCount,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

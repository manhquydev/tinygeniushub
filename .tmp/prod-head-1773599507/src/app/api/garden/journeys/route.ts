import type { NextRequest } from "next/server";
import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { listJourneysForChild } from "@/modules/garden/journey-service";

export async function GET(request: NextRequest) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const childId = request.nextUrl.searchParams.get("childId");
    if (!childId) {
      return fail("childId is required", 400);
    }

    const journeys = await listJourneysForChild({
      parentId: parent.id,
      childId,
    });

    return ok({ journeys });
  } catch (error) {
    return handleRouteError(error);
  }
}

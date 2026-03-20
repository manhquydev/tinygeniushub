import type { NextRequest } from "next/server";
import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getJourneySnapshot } from "@/modules/garden/journey-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ journeyId: string }> },
) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const childId = request.nextUrl.searchParams.get("childId");
    if (!childId) {
      return fail("childId is required", 400);
    }

    const { journeyId } = await params;
    const snapshot = await getJourneySnapshot({
      parentId: parent.id,
      childId,
      journeyId,
    });

    return ok({ snapshot });
  } catch (error) {
    return handleRouteError(error);
  }
}

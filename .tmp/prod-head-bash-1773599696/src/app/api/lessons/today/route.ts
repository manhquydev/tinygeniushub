import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { isAdaptiveEnabledForChild } from "@/lib/feature-flags";
import { getRealKidGardenMission } from "@/modules/content/service";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const childId = request.nextUrl.searchParams.get("childId");
    if (!childId) {
      return fail("Missing childId", 400);
    }

    const lessonCards = await getRealKidGardenMission({
      parentId: parent.id,
      childId,
    });

    return ok({ lessons: lessonCards, source: "courses" });
  } catch (error) {
    return handleRouteError(error);
  }
}

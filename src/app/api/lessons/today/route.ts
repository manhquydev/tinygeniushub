import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { isAdaptiveEnabledForChild } from "@/lib/feature-flags";
import { getTodayMission } from "@/modules/content/service";
import { getNextLesson } from "@/modules/adaptive/content-sequencing-engine";
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

    // Check adaptive engine feature flag for this child
    const adaptiveEnabled = await isAdaptiveEnabledForChild(childId);

    if (adaptiveEnabled) {
      // Fetch next lessons from adaptive engine for both domains in parallel
      const [mathNext, phonicsNext] = await Promise.all([
        getNextLesson(childId, "MATH"),
        getNextLesson(childId, "ENGLISH_PHONICS"),
      ]);

      const adaptiveLessons = [mathNext, phonicsNext].filter(Boolean);

      // Cold start: adaptive returned nothing → fallback to sequential
      if (adaptiveLessons.length > 0) {
        return ok({ lessons: adaptiveLessons, source: "adaptive" });
      }
    }

    // Sequential fallback (default behavior)
    const lessonCards = await getTodayMission({
      parentId: parent.id,
      childId,
      subscriptionStatus: parent.subscription?.status,
    });

    return ok({ lessons: lessonCards, source: "sequential" });
  } catch (error) {
    return handleRouteError(error);
  }
}

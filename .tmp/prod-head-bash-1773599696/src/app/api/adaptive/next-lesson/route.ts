/**
 * GET /api/adaptive/next-lesson?childId=...&domain=MATH
 * Returns the next recommended lesson for a child in a given domain.
 * Falls back gracefully when adaptive not enabled or cold start.
 */

import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { isAdaptiveEnabledForChild } from "@/lib/feature-flags";
import { getNextLesson } from "@/modules/adaptive/content-sequencing-engine";
import type { SkillDomain } from "@/modules/adaptive/types";
import type { NextRequest } from "next/server";

const VALID_DOMAINS: SkillDomain[] = ["MATH", "ENGLISH_PHONICS"];

export async function GET(request: NextRequest) {
  try {
    const parent = await getParentFromRequest(request);
    if (!parent) return fail("Unauthorized", 401);

    const { searchParams } = request.nextUrl;
    const childId = searchParams.get("childId");
    const domainParam = searchParams.get("domain");

    if (!childId) return fail("Missing childId", 400);
    if (!domainParam || !VALID_DOMAINS.includes(domainParam as SkillDomain)) {
      return fail(`Invalid domain. Must be one of: ${VALID_DOMAINS.join(", ")}`, 400);
    }

    const adaptiveEnabled = await isAdaptiveEnabledForChild(childId);
    if (!adaptiveEnabled) {
      return ok({ lesson: null, source: "sequential", reason: "Adaptive not enabled" });
    }

    const result = await getNextLesson(childId, domainParam as SkillDomain);
    if (!result) {
      return ok({ lesson: null, source: "adaptive", reason: "No lesson available or cold start" });
    }

    return ok({ ...result, source: "adaptive" });
  } catch (error) {
    return handleRouteError(error);
  }
}

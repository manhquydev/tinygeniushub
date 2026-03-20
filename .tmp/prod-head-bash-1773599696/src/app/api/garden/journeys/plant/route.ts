import type { NextRequest } from "next/server";
import { z } from "zod";
import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { createJourneyFromCourse } from "@/modules/garden/journey-service";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";

const plantJourneySchema = z
  .object({
    childId: z.string().min(1),
    courseId: z.string().min(1).optional(),
    courseSlug: z.string().min(1).optional(),
    sourceEnrollmentId: z.string().min(1).optional(),
    seedName: z.string().trim().min(1).max(160).optional(),
  })
  .refine((value) => Boolean(value.courseId || value.courseSlug), {
    message: "courseId or courseSlug is required",
  });

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const payload = plantJourneySchema.parse(await request.json());
    const result = await createJourneyFromCourse({
      parentId: parent.id,
      childId: payload.childId,
      courseId: payload.courseId,
      courseSlug: payload.courseSlug,
      sourceEnrollmentId: payload.sourceEnrollmentId,
      seedName: payload.seedName,
    });

    const animation = {
      event: "PLANTED" as const,
      seedName: result.snapshot.journey.seedName,
      currentTierNo: result.snapshot.journey.currentTierNo,
      unlockedTierNos: result.snapshot.tiers
        .filter((tier) => tier.isUnlocked)
        .map((tier) => tier.tierNo),
    };

    return ok({
      ...result,
      animation,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

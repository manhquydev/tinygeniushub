import type { NextRequest } from "next/server";
import { z } from "zod";
import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { COURSE_LEVEL_CHANGE_REASON_CODES } from "@/modules/courses/course-level-change-request-constants";
import {
  createCourseLevelChangeRequest,
} from "@/modules/courses/course-level-change-request-service";

const createLevelChangeRequestSchema = z.object({
  courseSlug: z.string().trim().min(1),
  fromLevelId: z.string().trim().max(80).optional(),
  toLevelId: z.string().trim().max(80).optional(),
  reasonCode: z.enum(COURSE_LEVEL_CHANGE_REASON_CODES),
  note: z.string().trim().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const payload = createLevelChangeRequestSchema.parse(await request.json());
    const result = await createCourseLevelChangeRequest({
      parentId: parent.id,
      courseSlug: payload.courseSlug,
      fromLevelId: payload.fromLevelId ?? null,
      toLevelId: payload.toLevelId ?? null,
      reasonCode: payload.reasonCode,
      note: payload.note ?? null,
      requestChannel: "ui",
    });

    return ok({
      requestId: result.requestId,
      courseSlug: result.courseSlug,
      purchaseId: result.purchaseId,
      orderId: result.orderId,
      reused: result.reused,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

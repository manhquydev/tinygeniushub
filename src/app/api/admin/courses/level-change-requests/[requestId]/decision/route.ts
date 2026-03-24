import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { decideCourseLevelChangeRequest } from "@/modules/courses/course-level-change-request-service";

const decisionSchema = z.object({
  decision: z.enum(["approved", "rejected", "cancelled"]),
  decisionReasonCode: z.string().trim().min(1).max(100),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ requestId: string }> },
) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;

    const admin = await requireAdminFromRequest(request);
    const payload = decisionSchema.parse(await request.json());
    const { requestId } = await context.params;

    const result = await decideCourseLevelChangeRequest({
      requestId,
      adminEmail: admin.email,
      decision: payload.decision,
      decisionReasonCode: payload.decisionReasonCode,
    });

    return ok(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

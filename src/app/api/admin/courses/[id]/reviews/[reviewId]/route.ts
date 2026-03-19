import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { moderateReview } from "@/modules/courses/course-review-service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> },
) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    await requireAdminFromRequest(request);

    const { reviewId } = await params;
    const body = await request.json();
    const { approved } = body as { approved: unknown };

    if (typeof approved !== "boolean") {
      return fail("'approved' must be a boolean", 400);
    }

    await moderateReview(reviewId, approved);
    return ok({});
  } catch (error) {
    return handleRouteError(error);
  }
}

import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { adminEmailActionSchema, sendAdminEmailToParent } from "@/modules/admin/service";

type RouteParams = {
  params: Promise<{ parentId: string }>;
};

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;

    const admin = await requireAdminFromRequest(request, [
      "SUPER_ADMIN",
      "SUPPORT_AGENT",
    ]);
    const { parentId } = await context.params;
    const body = adminEmailActionSchema.parse(await request.json());

    const result = await sendAdminEmailToParent({
      parentId,
      subject: body.subject,
      body: body.body,
      adminEmail: admin.email,
    });

    return ok({ sent: result.sent, provider: result.provider });
  } catch (error) {
    return handleRouteError(error);
  }
}

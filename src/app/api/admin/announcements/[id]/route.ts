import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { updateAnnouncementActive } from "@/modules/admin/service";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    assertTrustedOrigin(request);
    await requireAdminFromRequest(request);
    const { id } = await context.params;
    const body = (await request.json()) as { active?: boolean };
    const announcement = await updateAnnouncementActive({
      id,
      active: body.active,
    });
    return ok({ announcement });
  } catch (error) {
    return handleRouteError(error);
  }
}

import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { updateFeatureFlag } from "@/modules/admin/service";

type RouteParams = {
  params: Promise<{ key: string }>;
};

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const admin = await requireAdminFromRequest(request);
    const { key } = await context.params;
    const body = (await request.json()) as {
      enabled?: boolean;
    };

    const featureFlag = await updateFeatureFlag({
      key,
      enabled: body.enabled ?? false,
      adminEmail: admin.email,
    });

    return ok({ featureFlag });
  } catch (error) {
    return handleRouteError(error);
  }
}

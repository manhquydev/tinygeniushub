import type { NextRequest } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getAllFeatureFlags } from "@/modules/admin/service";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdmin(request);
    const featureFlags = await getAllFeatureFlags();
    return ok({ featureFlags });
  } catch (error) {
    return handleRouteError(error);
  }
}

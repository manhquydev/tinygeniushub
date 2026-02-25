import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { buildSecurityEdgePolicyExport } from "@/modules/platform/security-edge-export";
import { getAdminSecuritySettings } from "@/modules/platform/security-policy-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request, ["SUPER_ADMIN"]);
    const settings = await getAdminSecuritySettings();
    const exportPayload = buildSecurityEdgePolicyExport({
      controls: settings.controls,
      policies: settings.policies,
    });
    return ok({ edgePolicy: exportPayload });
  } catch (error) {
    return handleRouteError(error);
  }
}

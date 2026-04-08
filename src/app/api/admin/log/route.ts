import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { createAdminActionLog, getAdminUnifiedLogs } from "@/modules/admin/service";
import { z } from "zod";

const ADMIN_LOG_VIEW_ROLES = ["SUPER_ADMIN"];
const ADMIN_LOG_WRITE_ROLES = ["SUPER_ADMIN"];

const createLogSchema = z.object({
  action: z.string().trim().min(1),
  target: z.string().trim().min(1).optional(),
  detail: z.unknown().optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request, ADMIN_LOG_VIEW_ROLES);

    const limitRaw = request.nextUrl.searchParams.get("limit");
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;
    const logs = await getAdminUnifiedLogs(Number.isFinite(limit) ? Math.min(limit, 200) : 50);

    return ok({ logs });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    const admin = await requireAdminFromRequest(request, ADMIN_LOG_WRITE_ROLES);
    const body = createLogSchema.parse(await request.json());

    const entry = await createAdminActionLog({
      adminEmail: admin.email,
      action: body.action,
      target: body.target,
      detail: body.detail,
    });

    return ok({ entry });
  } catch (error) {
    return handleRouteError(error);
  }
}




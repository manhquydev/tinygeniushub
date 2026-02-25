import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { createAdminActionLog, executeAdminBulkUsersAction } from "@/modules/admin/service";

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);

    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    const admin = await requireAdminFromRequest(request, ["SUPER_ADMIN"]);
    const input = await request.json();

    const result = await executeAdminBulkUsersAction(input);

    const actionRaw =
      input && typeof input === "object" && "action" in input && typeof (input as { action?: unknown }).action === "string"
        ? (input as { action: string }).action
        : "UNKNOWN";

    await createAdminActionLog({
      adminEmail: admin.email,
      action: `BULK_${actionRaw}`,
      detail: {
        count: result.succeeded + result.failed,
        succeeded: result.succeeded,
        failed: result.failed,
      },
    });

    return ok({
      succeeded: result.succeeded,
      failed: result.failed,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

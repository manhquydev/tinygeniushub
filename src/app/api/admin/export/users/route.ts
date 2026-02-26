import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { toCsvLine } from "@/lib/csv";
import { handleRouteError } from "@/lib/route-error";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { listAdminUsersForExport } from "@/modules/admin/service";

export async function GET(request: NextRequest) {
  try {
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    await requireAdminFromRequest(request, ["SUPER_ADMIN"]);

    const result = await listAdminUsersForExport();

    const lines: string[] = [
      toCsvLine([
        "id",
        "email",
        "displayName",
        "createdAt",
        "lastActiveAt",
        "subscriptionStatus",
        "childrenCount",
        "successfulPaymentsCount",
      ]),
      ...result.rows.map((parent) =>
        toCsvLine([
          parent.id,
          parent.email,
          parent.displayName,
          parent.createdAt.toISOString(),
          parent.lastActiveAt ? parent.lastActiveAt.toISOString() : "",
          parent.subscriptionStatus,
          parent.childrenCount,
          parent.successfulPaymentsCount,
        ]),
      ),
    ];

    return new Response(lines.join("\r\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=\"users.csv\"",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}


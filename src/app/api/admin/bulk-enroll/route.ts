import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { parseCsvRows, processBulkEnrollRows } from "@/modules/organizations/bulk-enroll-service";
import { createAdminActionLog } from "@/modules/admin/service";

// POST /api/admin/bulk-enroll
// Body: multipart/form-data with fields: orgId (string) + csv (file)
export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;

    const admin = await requireAdminFromRequest(request, ["SUPER_ADMIN"]);

    const formData = await request.formData();
    const orgId = formData.get("orgId");
    const csvFile = formData.get("csv");

    if (typeof orgId !== "string" || !orgId.trim()) {
      return fail("orgId is required", 400);
    }
    if (!(csvFile instanceof Blob)) {
      return fail("csv file is required", 400);
    }
    if (csvFile.size > 2 * 1024 * 1024) {
      return fail("CSV file must be under 2 MB", 400);
    }

    const csvText = await csvFile.text();
    const rows = parseCsvRows(csvText);

    if (rows.length === 0) {
      return fail("CSV has no valid data rows", 400);
    }
    if (rows.length > 500) {
      return fail("Maximum 500 rows per upload", 400);
    }

    const result = await processBulkEnrollRows(orgId, rows);

    await createAdminActionLog({
      adminEmail: admin.email,
      action: "BULK_ENROLL",
      target: orgId,
      detail: { rowCount: rows.length, succeeded: result.succeeded, failed: result.failed },
    });

    return ok({ result });
  } catch (error) {
    return handleRouteError(error);
  }
}

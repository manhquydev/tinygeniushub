import type { NextRequest } from "next/server";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getParentFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";
import { parseCsvRows, processBulkEnrollRows } from "@/modules/organizations/bulk-enroll-service";

// POST /api/teacher/bulk-enroll
// Body: multipart/form-data with field: csv (file)
// Automatically scoped to the requesting teacher's organization.
export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) return fail("Unauthorized", 401);

    // Resolve teacher's org
    const membership = await prisma.organizationMember.findFirst({
      where: { parentId: parent.id, role: "TEACHER_ADMIN" },
    });
    if (!membership) return fail("Forbidden — not a teacher admin", 403);

    const formData = await request.formData();
    const csvFile = formData.get("csv");

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

    const result = await processBulkEnrollRows(membership.organizationId, rows);
    return ok({ result });
  } catch (error) {
    return handleRouteError(error);
  }
}

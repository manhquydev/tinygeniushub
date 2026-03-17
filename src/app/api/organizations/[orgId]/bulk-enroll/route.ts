import type { NextRequest } from "next/server";
import { getParentFromRequest } from "@/lib/auth/session";
import { ok, fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { isTeacherAdmin } from "@/modules/organizations/organization-service";
import { enqueueBulkEnroll } from "@/worker/queue";
import type { BulkEnrollRow } from "@/modules/organizations/bulk-enroll-service";
import { DomainError } from "@/modules/platform/errors";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";

const MAX_ROWS = 500;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> },
) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) return fail("Unauthorized", 401);

    const { orgId } = await params;
    const isAdmin = await isTeacherAdmin(orgId, parent.id);
    if (!isAdmin) {
      throw new DomainError("Only teacher admins can bulk enroll", 403, "FORBIDDEN");
    }

    const body = (await request.json()) as { rows: BulkEnrollRow[] };
    if (!Array.isArray(body.rows) || body.rows.length === 0) {
      return fail("rows must be a non-empty array", 400);
    }
    if (body.rows.length > MAX_ROWS) {
      return fail(`Maximum ${MAX_ROWS} rows per request`, 400);
    }

    const job = await enqueueBulkEnroll({ orgId, rows: body.rows, requestedByParentId: parent.id });
    return ok({ jobId: job.id }, { status: 202 });
  } catch (error) {
    return handleRouteError(error);
  }
}

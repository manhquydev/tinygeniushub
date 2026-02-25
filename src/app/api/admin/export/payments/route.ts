import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { toCsvLine } from "@/lib/csv";
import { handleRouteError } from "@/lib/route-error";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { listAdminPaymentsForExport } from "@/modules/admin/service";
import { DomainError } from "@/modules/platform/errors";

function sanitizeForFileName(value: string) {
  return value.replaceAll(/[^A-Za-z0-9_-]/g, "_");
}

export async function GET(request: NextRequest) {
  try {
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;

    await requireAdminFromRequest(request);

    const from = request.nextUrl.searchParams.get("from") ?? undefined;
    const to = request.nextUrl.searchParams.get("to") ?? undefined;
    const status = request.nextUrl.searchParams.get("status") ?? "ALL";

    if (!from || !to) {
      throw new DomainError("`from` and `to` query params are required", 400, "MISSING_DATE_RANGE");
    }

    const result = await listAdminPaymentsForExport({
      from,
      to,
      status,
    });

    const lines: string[] = [
      toCsvLine([
        "id",
        "provider",
        "providerTransactionId",
        "amountVnd",
        "currency",
        "status",
        "processedAt",
        "parentEmail",
      ]),
      ...result.rows.map((payment) =>
        toCsvLine([
          payment.id,
          payment.provider,
          payment.providerTransactionId,
          payment.amountVnd,
          payment.currency,
          payment.status,
          payment.processedAt.toISOString(),
          payment.parent.email,
        ]),
      ),
    ];

    if (result.truncated) {
      lines.push("# TRUNCATED at 5000 rows");
    }

    const filename = `payments-${sanitizeForFileName(from)}-${sanitizeForFileName(to)}.csv`;

    return new Response(lines.join("\r\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"${filename}\"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

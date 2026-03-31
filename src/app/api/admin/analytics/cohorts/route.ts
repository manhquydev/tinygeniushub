import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getCohortAnalysis, CohortPeriod } from "@/modules/admin/admin-cohort-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") as CohortPeriod) || "weekly";
    const count = parseInt(searchParams.get("count") || "8", 10);

    const cohorts = await getCohortAnalysis(period, count);

    return ok({
      cohorts,
      meta: {
        period,
        count: cohorts.length,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

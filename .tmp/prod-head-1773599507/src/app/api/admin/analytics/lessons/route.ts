import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getAdminTopLessonsAnalytics, parseAdminAnalyticsPeriod } from "@/modules/admin/service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const period = parseAdminAnalyticsPeriod(
      request.nextUrl.searchParams.get("period"),
    );
    const topLessons = await getAdminTopLessonsAnalytics(period);
    return ok({ topLessons });
  } catch (error) {
    return handleRouteError(error);
  }
}


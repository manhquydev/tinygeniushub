import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getAdminLearningAnalytics } from "@/modules/admin/admin-learning-analytics-service";
import { getAdminOverview } from "@/modules/admin/admin-overview-service";
import { getAdminRetentionAnalytics } from "@/modules/admin/admin-retention-analytics-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const [overview, learningAnalytics, retention] = await Promise.all([
      getAdminOverview(),
      getAdminLearningAnalytics(),
      getAdminRetentionAnalytics(),
    ]);
    return ok({ overview, learningAnalytics, retention });
  } catch (error) {
    return handleRouteError(error);
  }
}

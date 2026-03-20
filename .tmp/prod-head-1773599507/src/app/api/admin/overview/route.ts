import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { getAdminLearningAnalytics, getAdminOverview, getAdminRetentionAnalytics } from "@/modules/admin/service";

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

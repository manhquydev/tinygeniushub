import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import {
  getContentEngagementMetrics,
  getTopPerformingLessons,
  getLessonPerformance,
} from "@/modules/admin/admin-content-analytics-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "overview";
    const days = parseInt(searchParams.get("days") || "30", 10);
    const lessonId = searchParams.get("lessonId");

    if (type === "overview") {
      const data = await getContentEngagementMetrics(days);
      return ok(data);
    } else if (type === "top") {
      const data = await getTopPerformingLessons(20, days);
      return ok(data);
    } else if (type === "lesson" && lessonId) {
      const data = await getLessonPerformance(lessonId, days);
      return ok(data);
    }

    return handleRouteError(new Error("Invalid type parameter"));
  } catch (error) {
    return handleRouteError(error);
  }
}

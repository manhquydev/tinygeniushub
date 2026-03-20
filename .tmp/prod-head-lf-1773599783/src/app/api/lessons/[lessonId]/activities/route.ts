import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { listLessonActivitiesForPlayer } from "@/modules/content/service";
import type { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    const { lessonId } = await params;
    const activities = await listLessonActivitiesForPlayer(lessonId);
    return ok({ activities });
  } catch (error) {
    return handleRouteError(error);
  }
}

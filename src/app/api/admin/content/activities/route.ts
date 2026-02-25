import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { createActivity, listActivitiesForLesson } from "@/modules/admin/content-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const lessonId = request.nextUrl.searchParams.get("lessonId")?.trim() ?? "";

    if (lessonId.length === 0) {
      return fail("Missing lessonId", 400);
    }

    const activities = await listActivitiesForLesson(lessonId);
    return ok({ activities });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    await requireAdminFromRequest(request);
    const body = (await request.json()) as {
      lessonId?: string;
      type?: string;
      prompt?: string;
      spec?: object;
      passCriteria?: number;
    };

    const activity = await createActivity({
      lessonId: body.lessonId ?? "",
      type: body.type ?? "MCQ",
      prompt: body.prompt ?? "",
      spec: body.spec ?? {},
      passCriteria: body.passCriteria ?? 80,
    });

    return ok({ activity });
  } catch (error) {
    return handleRouteError(error);
  }
}

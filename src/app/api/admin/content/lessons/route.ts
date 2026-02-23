import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { createLesson, listLessonsForUnit } from "@/modules/admin/content-service";

export async function GET(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const unitId = request.nextUrl.searchParams.get("unitId")?.trim() ?? "";

    if (unitId.length === 0) {
      return fail("Missing unitId", 400);
    }

    const lessons = await listLessonsForUnit(unitId);
    return ok({ lessons });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminFromRequest(request);
    const body = (await request.json()) as {
      unitId?: string;
      orderNo?: number;
      slug?: string;
      title?: string;
      objective?: string;
      estimatedMinutes?: number;
      trialEnabled?: boolean;
      videoSource?: string | null;
      offlineCardMarkdown?: string | null;
      parentScriptMarkdown?: string | null;
    };

    const lesson = await createLesson({
      unitId: body.unitId ?? "",
      orderNo: body.orderNo ?? 1,
      slug: body.slug ?? "",
      title: body.title ?? "",
      objective: body.objective ?? "",
      estimatedMinutes: body.estimatedMinutes ?? 15,
      trialEnabled: body.trialEnabled ?? false,
      videoSource: body.videoSource ?? null,
      offlineCardMarkdown: body.offlineCardMarkdown ?? null,
      parentScriptMarkdown: body.parentScriptMarkdown ?? null,
    });

    return ok({ lesson });
  } catch (error) {
    return handleRouteError(error);
  }
}

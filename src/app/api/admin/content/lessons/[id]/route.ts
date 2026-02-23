import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { deleteLesson, updateLesson } from "@/modules/admin/content-service";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    await requireAdminFromRequest(request);
    const { id } = await context.params;
    const body = (await request.json()) as {
      title?: string;
      objective?: string;
      estimatedMinutes?: number;
      trialEnabled?: boolean;
      videoSource?: string | null;
      offlineCardMarkdown?: string | null;
      parentScriptMarkdown?: string | null;
    };

    const lesson = await updateLesson(id, {
      title: body.title,
      objective: body.objective,
      estimatedMinutes: body.estimatedMinutes,
      trialEnabled: body.trialEnabled,
      videoSource: body.videoSource,
      offlineCardMarkdown: body.offlineCardMarkdown,
      parentScriptMarkdown: body.parentScriptMarkdown,
    });

    return ok({ lesson });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    await requireAdminFromRequest(request);
    const { id } = await context.params;
    await deleteLesson(id);
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

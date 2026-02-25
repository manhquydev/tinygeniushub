import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { deleteLesson, updateLesson } from "@/modules/admin/content-service";
import { z } from "zod";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const updateLessonSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  objective: z.string().min(1).max(500).optional(),
  estimatedMinutes: z.number().int().min(1).optional(),
  trialEnabled: z.boolean().optional(),
  videoSource: z.string().max(500).nullish(),
  offlineCardMarkdown: z.string().max(10000).nullish(),
  parentScriptMarkdown: z.string().max(10000).nullish(),
});

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    assertTrustedOrigin(request);
    await requireAdminFromRequest(request);
    const { id } = await context.params;
    const body = updateLessonSchema.parse(await request.json());

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
    assertTrustedOrigin(request);
    await requireAdminFromRequest(request);
    const { id } = await context.params;
    await deleteLesson(id);
    return ok({ deleted: true });
  } catch (error) {
    return handleRouteError(error);
  }
}

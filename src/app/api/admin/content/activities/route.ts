import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { createActivity, listActivitiesForLesson } from "@/modules/admin/content-service";
import { z } from "zod";

const createActivitySchema = z.object({
  lessonId: z.string().min(1),
  type: z.enum(["MCQ", "TRUE_FALSE", "WORD_MATCH", "FILL_BLANK"]).default("MCQ"),
  prompt: z.string().trim().min(1).max(500),
  spec: z.record(z.string(), z.unknown()).default({}),
  passCriteria: z.coerce.number().int().min(0).max(100).default(80),
});

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
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    await requireAdminFromRequest(request);
    const body = createActivitySchema.parse(await request.json());

    const activity = await createActivity({
      lessonId: body.lessonId,
      type: body.type,
      prompt: body.prompt,
      spec: body.spec,
      passCriteria: body.passCriteria,
    });

    return ok({ activity });
  } catch (error) {
    return handleRouteError(error);
  }
}



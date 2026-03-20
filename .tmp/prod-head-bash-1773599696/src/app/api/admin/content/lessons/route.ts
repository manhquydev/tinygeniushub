import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { createLesson, listLessonsForUnit } from "@/modules/admin/content-service";
import { z } from "zod";

const createLessonSchema = z.object({
  unitId: z.string().min(1),
  orderNo: z.number().int().min(1).default(1),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  objective: z.string().min(1).max(500),
  estimatedMinutes: z.number().int().min(1).default(15),
  trialEnabled: z.boolean().default(false),
  videoSource: z.string().max(500).nullish(),
  offlineCardMarkdown: z.string().max(10000).nullish(),
  parentScriptMarkdown: z.string().max(10000).nullish(),
});

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
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    await requireAdminFromRequest(request);
    const body = createLessonSchema.parse(await request.json());

    const lesson = await createLesson({
      unitId: body.unitId,
      orderNo: body.orderNo,
      slug: body.slug,
      title: body.title,
      objective: body.objective,
      estimatedMinutes: body.estimatedMinutes,
      trialEnabled: body.trialEnabled,
      videoSource: body.videoSource ?? null,
      offlineCardMarkdown: body.offlineCardMarkdown ?? null,
      parentScriptMarkdown: body.parentScriptMarkdown ?? null,
    });

    return ok({ lesson });
  } catch (error) {
    return handleRouteError(error);
  }
}



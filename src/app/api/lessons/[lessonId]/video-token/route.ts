import type { NextRequest } from "next/server";
import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { bunnySignedEmbedUrl } from "@/lib/bunny-stream-client";
import { prisma } from "@/lib/db";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";

// GET /api/lessons/[lessonId]/video-token
// Returns a signed Bunny embed URL for authenticated users.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    if (!parent) {
      return fail("Unauthorized", 401);
    }

    const { lessonId } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        bunnyVideoId: true,
        videoStatus: true,
        isPreview: true,
        trialEnabled: true,
      },
    });

    if (!lesson || !lesson.bunnyVideoId || lesson.videoStatus !== "ready") {
      return fail("Video not available", 404);
    }

    const embedUrl = bunnySignedEmbedUrl(lesson.bunnyVideoId);

    return ok({ embedUrl });
  } catch (error) {
    return handleRouteError(error);
  }
}

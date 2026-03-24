import type { NextRequest } from "next/server";
import { getParentFromRequest } from "@/lib/auth/session";
import { fail } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import {
  isAllowedVideoUrl,
  resolveProtectedVideoUrl,
  verifyVideoPlaybackToken,
} from "@/lib/secure-video-source";
import { prisma } from "@/lib/db";
import {
  isParentEnrolledForLesson,
  isPublicPreviewEligibleLesson,
  verifyGuestPreviewPlaybackToken,
} from "@/modules/courses/course-trial-policy";
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";

// GET /api/lessons/[lessonId]/secure-playback?token=...
// Verifies parent session + short-lived token, then redirects to protected source.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  try {
    assertTrustedOrigin(request);
    await assertRequestAllowedBySecurityControls(request);

    const parent = await getParentFromRequest(request);
    const { lessonId } = await params;
    const token = request.nextUrl.searchParams.get("token")?.trim() ?? "";
    if (token.length === 0) {
      return fail("Missing playback token", 400);
    }

    if (parent) {
      const claims = verifyVideoPlaybackToken(token);
      if (!claims || claims.parentId !== parent.id || claims.lessonId !== lessonId) {
        return fail("Invalid playback token", 403);
      }

      const hasEnrollment = await isParentEnrolledForLesson(prisma, {
        parentId: parent.id,
        lessonId,
      });
      if (!hasEnrollment) {
        const eligible = await isPublicPreviewEligibleLesson(prisma, lessonId);
        if (!eligible) {
          return fail("Preview not available for this lesson", 403, {
            code: "PREVIEW_NOT_ELIGIBLE",
          });
        }
      }
    } else {
      const claims = verifyGuestPreviewPlaybackToken(token);
      if (!claims || claims.lessonId !== lessonId) {
        return fail("Invalid preview playback token", 403);
      }

      const eligible = await isPublicPreviewEligibleLesson(prisma, lessonId);
      if (!eligible) {
        return fail("Preview not available for this lesson", 403, {
          code: "PREVIEW_NOT_ELIGIBLE",
        });
      }
    }

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        videoSource: true,
      },
    });

    const resolvedVideoUrl = resolveProtectedVideoUrl(lesson?.videoSource);
    if (!resolvedVideoUrl || !isAllowedVideoUrl(resolvedVideoUrl)) {
      return fail("Video source unavailable", 404);
    }

    return Response.redirect(resolvedVideoUrl, 307);
  } catch (error) {
    return handleRouteError(error);
  }
}

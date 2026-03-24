import type { NextRequest } from "next/server";
import { getParentFromRequest } from "@/lib/auth/session";
import { fail, ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import {
  buildVideoPlaybackToken,
  isVideoSourceProtected,
  resolveProtectedVideoUrl,
} from "@/lib/secure-video-source";
import { bunnySignedEmbedUrl } from "@/lib/bunny-stream-client";
import { prisma } from "@/lib/db";
import {
  buildGuestPreviewPlaybackToken,
  isParentEnrolledForLesson,
  isPublicPreviewEligibleLesson,
} from "@/modules/courses/course-trial-policy";
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

    const { lessonId } = await params;

    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        id: true,
        bunnyVideoId: true,
        videoStatus: true,
        videoSource: true,
        isPreview: true,
        trialEnabled: true,
      },
    });

    if (!lesson) {
      return fail("Video not available", 404);
    }

    const parent = await getParentFromRequest(request);
    const previewEligible = await isPublicPreviewEligibleLesson(prisma, lesson.id);
    if (!parent && !previewEligible) {
      return fail("Authentication required for this lesson", 401, {
        code: "PREVIEW_LOGIN_REQUIRED",
      });
    }
    if (parent) {
      const hasEnrollment = await isParentEnrolledForLesson(prisma, {
        parentId: parent.id,
        lessonId: lesson.id,
      });
      if (!hasEnrollment && !previewEligible) {
        return fail("Preview not available for this lesson", 403, {
          code: "PREVIEW_NOT_ELIGIBLE",
        });
      }
    }

    if (lesson.bunnyVideoId && lesson.videoStatus === "ready") {
      const embedUrl = bunnySignedEmbedUrl(lesson.bunnyVideoId);
      return ok({ embedUrl, streamType: "embed" });
    }

    if (isVideoSourceProtected(lesson.videoSource)) {
      const resolvedSource = resolveProtectedVideoUrl(lesson.videoSource);
      if (!resolvedSource) {
        return fail("Video not available", 404);
      }
      const token = parent
        ? buildVideoPlaybackToken({
            parentId: parent.id,
            lessonId: lesson.id,
          })
        : buildGuestPreviewPlaybackToken({
            lessonId: lesson.id,
          });
      const securePlaybackPath = `/api/lessons/${lesson.id}/secure-playback?token=${encodeURIComponent(token)}`;
      return ok({
        embedUrl: securePlaybackPath,
        streamType: "secure",
      });
    }

    return fail("Video not available", 404);
  } catch (error) {
    return handleRouteError(error);
  }
}

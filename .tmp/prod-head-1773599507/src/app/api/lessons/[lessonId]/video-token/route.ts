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
import { assertRequestAllowedBySecurityControls } from "@/modules/platform/security-access-guard";

// GET /api/lessons/[lessonId]/video-token
// Returns a signed Bunny embed URL for authenticated users.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const detectStreamType = (url: string | null | undefined): "hls" | "file" =>
    typeof url === "string" && /\.m3u8($|[?#])/i.test(url) ? "hls" : "file";

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

    if (lesson.bunnyVideoId && lesson.videoStatus === "ready") {
      const embedUrl = bunnySignedEmbedUrl(lesson.bunnyVideoId);
      return ok({ embedUrl, streamType: "embed" });
    }

    if (isVideoSourceProtected(lesson.videoSource)) {
      const resolvedSource = resolveProtectedVideoUrl(lesson.videoSource);
      const token = buildVideoPlaybackToken({
        parentId: parent.id,
        lessonId: lesson.id,
      });
      const securePlaybackUrl = new URL(
        `/api/lessons/${lesson.id}/secure-playback?token=${encodeURIComponent(token)}`,
        request.url,
      );
      return ok({
        embedUrl: securePlaybackUrl.toString(),
        streamType: detectStreamType(resolvedSource),
      });
    }

    return fail("Video not available", 404);
  } catch (error) {
    return handleRouteError(error);
  }
}

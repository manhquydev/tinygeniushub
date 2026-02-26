import type { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";
import { bunnyCreateVideo, bunnyDeleteVideo } from "@/lib/bunny-stream-client";
import { prisma } from "@/lib/db";

const createVideoSchema = z.object({
  lessonId: z.string().min(1),
  title: z.string().min(1).max(200),
});

// POST /api/admin/videos/upload
// Creates a Bunny video record + returns tus upload URL
export async function POST(request: NextRequest) {
  try {
    assertTrustedOrigin(request);
    const rateLimit = await enforceAdminMutationRateLimit(request);
    if (rateLimit) return rateLimit;
    await requireAdminFromRequest(request);

    const body = createVideoSchema.parse(await request.json());

    // Verify lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: body.lessonId },
      select: { id: true, bunnyVideoId: true },
    });

    if (!lesson) {
      return new Response(JSON.stringify({ ok: false, error: { message: "Lesson not found" } }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    const { videoId, uploadUrl } = await bunnyCreateVideo(body.title);

    // Link to lesson â€” cleanup orphaned Bunny video if DB update fails
    try {
      await prisma.lesson.update({
        where: { id: body.lessonId },
        data: {
          bunnyVideoId: videoId,
          videoStatus: "uploading",
        },
      });
    } catch (dbError) {
      await bunnyDeleteVideo(videoId).catch(() => {});
      throw dbError;
    }

    return ok({ videoId, uploadUrl });
  } catch (error) {
    return handleRouteError(error);
  }
}



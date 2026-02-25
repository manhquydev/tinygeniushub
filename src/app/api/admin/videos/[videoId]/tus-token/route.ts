import type { NextRequest } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth/admin";
import { ok } from "@/lib/http";
import { handleRouteError } from "@/lib/route-error";
import { assertTrustedOrigin } from "@/lib/security/csrf";
import { bunnyGenerateTusToken } from "@/lib/bunny-stream-client";
import { prisma } from "@/lib/db";

// GET /api/admin/videos/[videoId]/tus-token
// Returns a short-lived TUS upload token for browser-direct upload to Bunny CDN.
// API key never leaves the server — only HMAC signature is returned.
export async function GET(request: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    assertTrustedOrigin(request);
    await requireAdminFromRequest(request);

    const { videoId } = await params;

    if (!videoId || typeof videoId !== "string" || videoId.length < 4) {
      return new Response(JSON.stringify({ ok: false, error: { message: "Invalid videoId" } }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Verify this videoId belongs to a lesson (prevents token generation for arbitrary IDs)
    const lesson = await prisma.lesson.findFirst({
      where: { bunnyVideoId: videoId },
      select: { id: true },
    });

    if (!lesson) {
      return new Response(JSON.stringify({ ok: false, error: { message: "Video not found" } }), {
        status: 404,
        headers: { "content-type": "application/json" },
      });
    }

    const token = bunnyGenerateTusToken(videoId);

    return ok(token);
  } catch (error) {
    return handleRouteError(error);
  }
}

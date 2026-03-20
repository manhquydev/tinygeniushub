import type { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { bunnyStatusToVideoStatus } from "@/lib/bunny-stream-client";
import { logInfo, logWarn } from "@/lib/observability/logger";

// Bunny Stream sends webhooks for video encoding events
// https://docs.bunny.net/docs/stream-webhooks
//
// We verify using a shared secret in the X-BunnyWebhook-Signature header
// then update the Lesson.videoStatus accordingly.

export async function POST(request: NextRequest) {
  const signature = request.headers.get("X-BunnyWebhook-Signature");
  const webhookSecret = env.BUNNY_WEBHOOK_SECRET;

  // Verify signature (only if configured)
  if (webhookSecret && signature !== webhookSecret) {
    logWarn("webhooks.bunny.invalid_signature");
    return new Response(JSON.stringify({ ok: false, error: "Invalid signature" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const event = payload as {
    VideoGuid?: string;
    Status?: number;
    EncodeProgress?: number;
  };

  const videoId = event.VideoGuid;
  const statusCode = event.Status;

  if (!videoId || statusCode === undefined) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  const videoStatus = bunnyStatusToVideoStatus(statusCode);

  const updated = await prisma.lesson.updateMany({
    where: { bunnyVideoId: videoId },
    data: { videoStatus },
  });

  logInfo("webhooks.bunny.processed", {
    videoId,
    statusCode,
    videoStatus,
    lessonsUpdated: updated.count,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

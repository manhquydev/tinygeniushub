import { env } from "@/lib/env";
import { createHmac } from "crypto";

const BUNNY_API_BASE = "https://video.bunnycdn.com";

// ---- Types ----

export type BunnyVideoStatus = "none" | "uploading" | "processing" | "ready" | "failed";

export interface BunnyVideo {
  videoId: string;
  title: string;
  status: number; // Bunny status code: 0=queued, 2=processing, 4=finished, 5=error, 6=uploading
  availableResolutions: string | null;
  thumbnailUrl: string | null;
  length: number; // seconds
}

// ---- Bunny status code → our status ----

export function bunnyStatusToVideoStatus(statusCode: number): BunnyVideoStatus {
  if (statusCode === 4) return "ready";
  if (statusCode === 5) return "failed";
  if (statusCode === 6) return "uploading";
  if (statusCode === 2) return "processing";
  if (statusCode === 0) return "processing";
  return "none";
}

// ---- API client ----

function getApiKey() {
  const key = env.BUNNY_STREAM_API_KEY;
  if (!key) throw new Error("BUNNY_STREAM_API_KEY is not configured");
  return key;
}

function getLibraryId() {
  const id = env.BUNNY_STREAM_LIBRARY_ID;
  if (!id) throw new Error("BUNNY_STREAM_LIBRARY_ID is not configured");
  return id;
}

export async function bunnyCreateVideo(title: string): Promise<{ videoId: string; uploadUrl: string }> {
  const libraryId = getLibraryId();

  const response = await fetch(`${BUNNY_API_BASE}/library/${libraryId}/videos`, {
    method: "POST",
    headers: {
      AccessKey: getApiKey(),
      "content-type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Bunny create video failed: status=${response.status} body=${text}`);
  }

  const data = (await response.json()) as { guid: string };
  const videoId = data.guid;
  const uploadUrl = `${BUNNY_API_BASE}/library/${libraryId}/videos/${videoId}`;

  return { videoId, uploadUrl };
}

export async function bunnyGetVideo(videoId: string): Promise<BunnyVideo> {
  const libraryId = getLibraryId();

  const response = await fetch(`${BUNNY_API_BASE}/library/${libraryId}/videos/${videoId}`, {
    headers: { AccessKey: getApiKey() },
  });

  if (!response.ok) {
    throw new Error(`Bunny get video failed: status=${response.status}`);
  }

  const data = (await response.json()) as {
    guid: string;
    title: string;
    status: number;
    availableResolutions: string | null;
    thumbnailFileName: string | null;
    length: number;
  };

  const cdnHostname = env.BUNNY_STREAM_CDN_HOSTNAME;
  const thumbnailUrl =
    cdnHostname && data.thumbnailFileName
      ? `https://${cdnHostname}/${videoId}/${data.thumbnailFileName}`
      : null;

  return {
    videoId: data.guid,
    title: data.title,
    status: data.status,
    availableResolutions: data.availableResolutions,
    thumbnailUrl,
    length: data.length,
  };
}

export async function bunnyDeleteVideo(videoId: string): Promise<void> {
  const libraryId = getLibraryId();

  const response = await fetch(`${BUNNY_API_BASE}/library/${libraryId}/videos/${videoId}`, {
    method: "DELETE",
    headers: { AccessKey: getApiKey() },
  });

  if (!response.ok) {
    throw new Error(`Bunny delete video failed: status=${response.status}`);
  }
}

// ---- Signed embed URL for playback ----
// Bunny token-auth: token = sha256(libraryId + secret + expiry + videoId)
// https://docs.bunny.net/docs/stream-embed-token-authentication

export function bunnySignedEmbedUrl(videoId: string, expirySeconds = 3600): string {
  const secret = env.BUNNY_WEBHOOK_SECRET;
  const libraryId = env.BUNNY_STREAM_LIBRARY_ID;
  const cdnHostname = env.BUNNY_STREAM_CDN_HOSTNAME;

  if (!secret || !libraryId || !cdnHostname) {
    // If not configured (dev/test), return unsigned URL
    return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
  }

  const expiry = Math.floor(Date.now() / 1000) + expirySeconds;
  const token = createHmac("sha256", secret)
    .update(`${libraryId}${secret}${expiry}${videoId}`)
    .digest("hex");

  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expiry}`;
}

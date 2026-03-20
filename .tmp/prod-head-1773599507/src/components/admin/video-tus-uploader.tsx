"use client";

import { useRef, useState } from "react";
import * as tus from "tus-js-client";
import type { BunnyTusToken } from "@/lib/bunny-stream-client";

const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024; // 2GB
const POLL_INTERVAL_MS = 5_000;
const MAX_POLLS = 60; // ~5 minutes of polling

interface VideoTusUploaderProps {
  videoId: string;
  lessonId: string;
  onComplete: () => void;
}

type UploadState =
  | { phase: "idle" }
  | { phase: "uploading"; percent: number }
  | { phase: "processing" }
  | { phase: "ready" }
  | { phase: "error"; message: string };

async function fetchTusToken(videoId: string): Promise<BunnyTusToken> {
  const res = await fetch(`/api/admin/videos/${videoId}/tus-token`);
  const json = (await res.json()) as { ok: boolean; data?: BunnyTusToken; error?: { message: string } };
  if (!json.ok || !json.data) throw new Error(json.error?.message ?? "Failed to get upload token");
  return json.data;
}

async function pollLessonVideoStatus(lessonId: string): Promise<string> {
  const res = await fetch(`/api/admin/lessons/${lessonId}`);
  if (!res.ok) return "unknown";
  const json = (await res.json()) as { ok: boolean; data?: { videoStatus?: string } };
  return json.data?.videoStatus ?? "unknown";
}

export function VideoTusUploader({ videoId, lessonId, onComplete }: VideoTusUploaderProps) {
  const [state, setState] = useState<UploadState>({ phase: "idle" });
  const uploadRef = useRef<tus.Upload | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearPoll() {
    if (pollRef.current) clearTimeout(pollRef.current);
  }

  function startPolling(count = 0) {
    if (count >= MAX_POLLS) {
      setState({ phase: "error", message: "Video processing timed out. Check Bunny dashboard." });
      return;
    }
    pollRef.current = setTimeout(async () => {
      const status = await pollLessonVideoStatus(lessonId).catch(() => "unknown");
      if (status === "ready") {
        setState({ phase: "ready" });
        onComplete();
      } else if (status === "failed") {
        setState({ phase: "error", message: "Video processing failed on Bunny CDN." });
      } else {
        startPolling(count + 1);
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      setState({ phase: "error", message: "Chỉ chấp nhận file video." });
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setState({ phase: "error", message: "File quá lớn. Tối đa 2GB." });
      return;
    }

    setState({ phase: "uploading", percent: 0 });

    try {
      const token = await fetchTusToken(videoId);

      const upload = new tus.Upload(file, {
        endpoint: token.tusEndpoint,
        retryDelays: [0, 3000, 5000, 10000],
        chunkSize: 5 * 1024 * 1024, // 5MB chunks
        headers: {
          AuthorizationSignature: token.authSignature,
          AuthorizationExpire: String(token.authExpire),
          VideoId: token.videoId,
          LibraryId: token.libraryId,
        },
        metadata: {
          filename: file.name,
          filetype: file.type,
        },
        onProgress(bytesUploaded, bytesTotal) {
          const percent = Math.round((bytesUploaded / bytesTotal) * 100);
          setState({ phase: "uploading", percent });
        },
        onSuccess() {
          setState({ phase: "processing" });
          startPolling();
        },
        onError(error) {
          setState({ phase: "error", message: error.message });
        },
      });

      uploadRef.current = upload;
      upload.start();
    } catch (err) {
      setState({ phase: "error", message: err instanceof Error ? err.message : "Upload failed" });
    }
  }

  function handleAbort() {
    uploadRef.current?.abort();
    clearPoll();
    setState({ phase: "idle" });
  }

  function handleRetry() {
    clearPoll();
    setState({ phase: "idle" });
  }

  if (state.phase === "ready") {
    return (
      <p style={{ color: "var(--green-600, #16a34a)", fontSize: "0.85rem", fontWeight: 600 }}>
        ✓ Video đã sẵn sàng
      </p>
    );
  }

  if (state.phase === "processing") {
    return (
      <p style={{ color: "var(--ink-400, #64748b)", fontSize: "0.85rem" }}>
        ⏳ Đang xử lý video trên Bunny CDN... (có thể mất vài phút)
      </p>
    );
  }

  if (state.phase === "uploading") {
    return (
      <div style={{ display: "grid", gap: "0.5rem" }}>
        <p style={{ fontSize: "0.82rem", color: "var(--ink-500, #64748b)" }}>
          Đang upload... {state.percent}%
        </p>
        <progress value={state.percent} max={100} style={{ width: "100%", height: "8px" }} />
        <button type="button" onClick={handleAbort} style={{ fontSize: "0.8rem", color: "#dc2626" }}>
          Huỷ
        </button>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <div style={{ display: "grid", gap: "0.4rem" }}>
        <p style={{ color: "#dc2626", fontSize: "0.82rem" }}>Lỗi: {state.message}</p>
        <button type="button" onClick={handleRetry} style={{ fontSize: "0.8rem" }}>
          Thử lại
        </button>
      </div>
    );
  }

  // idle
  return (
    <label style={{ cursor: "pointer", display: "inline-block" }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "0.4rem 0.9rem",
          borderRadius: "0.5rem",
          border: "1px solid var(--ink-200, #e2e8f0)",
          fontSize: "0.82rem",
          fontWeight: 600,
          background: "white",
          cursor: "pointer",
        }}
      >
        ↑ Chọn file video (tối đa 2GB)
      </span>
      <input type="file" accept="video/*" onChange={handleFileChange} style={{ display: "none" }} />
    </label>
  );
}

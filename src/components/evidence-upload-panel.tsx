"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";

type MediaType = "PHOTO" | "AUDIO";

interface EvidenceUploadPanelProps {
  childId: string;
  lessonId: string;
}

type UploadSessionPayload = {
  upload: {
    provider: string;
    uploadUrl: string;
    method: string;
    requiredHeaders?: Record<string, string>;
    expiresAt: string;
  };
  media: {
    id: string;
    objectPath: string;
  };
};

function isUploadSessionPayload(value: unknown): value is UploadSessionPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as UploadSessionPayload;
  return (
    typeof candidate.media?.id === "string" &&
    typeof candidate.media?.objectPath === "string" &&
    typeof candidate.upload?.provider === "string" &&
    typeof candidate.upload?.uploadUrl === "string" &&
    typeof candidate.upload?.method === "string" &&
    typeof candidate.upload?.expiresAt === "string"
  );
}

export function EvidenceUploadPanel({ childId, lessonId }: EvidenceUploadPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>("PHOTO");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const accept = useMemo(() => (mediaType === "PHOTO" ? "image/*" : "audio/*"), [mediaType]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setError(null);
    setInfo(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Vui long chon tep truoc khi upload.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const sessionResponse = await fetch("/api/evidence/media/upload-url", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          childId,
          lessonId,
          type: mediaType,
          contentType: file.type || (mediaType === "PHOTO" ? "image/jpeg" : "audio/mpeg"),
          sizeBytes: file.size,
        }),
      });

      const sessionBody = await sessionResponse.json();
      const sessionCandidate = sessionBody?.data?.session as unknown;
      if (!sessionResponse.ok || sessionBody?.ok !== true || !isUploadSessionPayload(sessionCandidate)) {
        setError(sessionBody?.error?.message ?? "Khong tao duoc signed upload session.");
        return;
      }

      const uploadHeaders = new Headers(sessionCandidate.upload.requiredHeaders ?? {});
      if (!uploadHeaders.has("content-type")) {
        uploadHeaders.set("content-type", file.type || "application/octet-stream");
      }

      const uploadResponse = await fetch(sessionCandidate.upload.uploadUrl, {
        method: sessionCandidate.upload.method,
        headers: uploadHeaders,
        body: file,
      });

      if (!uploadResponse.ok) {
        const uploadText = await uploadResponse.text();
        setError(uploadText || "Upload tep that bai.");
        return;
      }

      setInfo(
        `Upload thanh cong (${sessionCandidate.upload.provider}) - mediaId=${sessionCandidate.media.id} - path=${sessionCandidate.media.objectPath}`,
      );
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Loi khong xac dinh khi upload.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="evidence-upload-panel" onSubmit={handleSubmit}>
      <div className="evidence-upload-head">
        <strong>Them bang chung (anh/audio)</strong>
        <span className="muted-text">Signed upload URL, policy 90-365 ngay theo plan.</span>
      </div>

      <div className="inline-form">
        <select
          value={mediaType}
          onChange={(event) => setMediaType(event.target.value as MediaType)}
          disabled={loading}
          aria-label="Loai media"
        >
          <option value="PHOTO">Anh (PHOTO)</option>
          <option value="AUDIO">Audio (AUDIO)</option>
        </select>

        <input ref={fileInputRef} type="file" accept={accept} onChange={handleFileChange} disabled={loading} />

        <button type="submit" className="ghost-button" disabled={loading || !file}>
          {loading ? "Dang upload..." : "Upload evidence"}
        </button>
      </div>

      {error ? <p className="error-text">{error}</p> : null}
      {info ? <p className="muted-text">{info}</p> : null}
    </form>
  );
}

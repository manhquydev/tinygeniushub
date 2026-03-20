"use client";

import { useEffect, useRef, useState } from "react";
import { ImageIcon, Loader2 } from "lucide-react";

interface Props {
  onInsert?: (markdownTag: string) => void;
  onUpload?: (publicUrl: string) => void;
}

type UploadState = "idle" | "uploading" | "success" | "error";

type UploadUrlResponse = {
  data?: {
    upload: {
      uploadUrl: string;
      method: string;
      requiredHeaders?: Record<string, string>;
    };
    image: {
      publicUrl: string;
    };
  };
  error?: string;
};

export function BlogImageUploadButton({ onInsert, onUpload }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state !== "success") {
      return;
    }

    const timer = setTimeout(() => {
      setState("idle");
    }, 2000);

    return () => clearTimeout(timer);
  }, [state]);

  async function handleFile(file: File) {
    if (!file) {
      return;
    }

    setState("uploading");
    setError(null);

    try {
      const sessionResponse = await fetch("/api/blog/images/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentType: file.type,
          filename: file.name,
          sizeBytes: file.size,
        }),
      });

      const sessionBody = (await sessionResponse.json()) as UploadUrlResponse;
      if (!sessionResponse.ok || !sessionBody.data) {
        setState("error");
        setError(sessionBody.error ?? "Không lấy được upload URL.");
        return;
      }

      const uploadHeaders = new Headers(sessionBody.data.upload.requiredHeaders ?? {});
      uploadHeaders.set("content-type", file.type || "application/octet-stream");

      const uploadResponse = await fetch(sessionBody.data.upload.uploadUrl, {
        method: sessionBody.data.upload.method,
        headers: uploadHeaders,
        body: file,
      });

      if (!uploadResponse.ok) {
        setState("error");
        setError("Upload thất bại. Vui lòng thử lại.");
        return;
      }

      const altText = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
      const markdownTag = `![${altText}](${sessionBody.data.image.publicUrl})`;
      onInsert?.(markdownTag);
      onUpload?.(sessionBody.data.image.publicUrl);
      setState("success");
    } catch {
      setState("error");
      setError("Có lỗi trong quá trình upload.");
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleFile(file);
          }
          event.target.value = "";
        }}
      />

      <button
        type="button"
        title="Upload ảnh"
        disabled={state === "uploading"}
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: "4px 8px",
          borderRadius: 4,
          border: "1px solid #e2e8f0",
          background: "#f8fafc",
          cursor: state === "uploading" ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 4,
          opacity: state === "uploading" ? 0.7 : 1,
        }}
      >
        {state === "uploading" ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
        <span style={{ fontSize: 13 }}>
          {state === "uploading" ? "Đang tải..." : state === "success" ? "✓" : "Thêm ảnh"}
        </span>
      </button>

      {state === "error" && error ? <span className="text-xs font-semibold text-rose-700">{error}</span> : null}
    </>
  );
}

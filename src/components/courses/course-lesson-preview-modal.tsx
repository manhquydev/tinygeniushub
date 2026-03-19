"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

type VideoState =
  | { status: "loading" }
  | { status: "ready"; embedUrl: string }
  | { status: "unavailable" };

type Props = {
  lessonId: string;
  lessonTitle: string;
  lessonObjective: string;
  courseSlug: string;
  onClose: () => void;
};

export function CourseLessonPreviewModal({
  lessonId,
  lessonTitle,
  lessonObjective,
  courseSlug,
  onClose,
}: Props) {
  const [video, setVideo] = useState<VideoState>({ status: "loading" });

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/video-token`)
      .then((res) => {
        if (!res.ok) throw new Error("unavailable");
        return res.json() as Promise<{ ok: boolean; data?: { embedUrl: string } }>;
      })
      .then((json) => {
        if (json.ok && json.data?.embedUrl) {
          setVideo({ status: "ready", embedUrl: json.data.embedUrl });
        } else {
          setVideo({ status: "unavailable" });
        }
      })
      .catch(() => setVideo({ status: "unavailable" }));
  }, [lessonId]);

  // Close on ESC key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Học thử: ${lessonTitle}`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 p-5 pb-0">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Bài học thử</p>
            <h2 className="mt-1 text-lg font-extrabold text-slate-900">{lessonTitle}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video area */}
        <div className="mt-4 px-5">
          <div className="relative overflow-hidden rounded-2xl bg-slate-900" style={{ aspectRatio: "16/9" }}>
            {video.status === "loading" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-slate-400">Đang tải video...</p>
              </div>
            )}
            {video.status === "ready" && (
              <iframe
                src={video.embedUrl}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-none"
                title={lessonTitle}
              />
            )}
            {video.status === "unavailable" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <p className="font-bold text-white">Video sắp ra mắt</p>
                <p className="text-sm text-slate-400">Bài học này chưa có video. Hãy mua khóa để xem nội dung đầy đủ.</p>
              </div>
            )}
          </div>
        </div>

        {/* Lesson info + CTA */}
        <div className="grid gap-3 p-5">
          {lessonObjective && (
            <p className="text-sm leading-relaxed text-slate-600">
              <span className="font-semibold text-slate-900">Mục tiêu: </span>
              {lessonObjective}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={`/courses/${courseSlug}`}
              className="solid-button"
              onClick={onClose}
            >
              Mua khóa để học tất cả bài
            </Link>
            <button type="button" onClick={onClose} className="ghost-button">
              Xem thông tin khóa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

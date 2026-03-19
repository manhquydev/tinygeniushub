"use client";

import { useState, useEffect } from "react";
import { SecureVideoPlayer } from "@/components/media/secure-video-player";

type VideoState = {
  status: "loading" | "ready" | "unavailable";
  embedUrl?: string;
  renderMode?: "iframe" | "native";
  streamType?: "hls" | "file" | "embed";
};

type SelectedLesson = {
  orderNo: number;
  lesson: { id: string; title: string; estimatedMinutes: number };
};

type Props = {
  selected: SelectedLesson | undefined;
  video: VideoState;
  isCompleted: boolean;
  isLast: boolean;
  allComplete: boolean;
  marking: boolean;
  onMarkComplete: () => void;
  onGoNext: () => void;
};

export function LessonPlayerContent({
  selected,
  video,
  isCompleted,
  isLast,
  allComplete,
  marking,
  onMarkComplete,
  onGoNext,
}: Props) {
  const [justCompleted, setJustCompleted] = useState(false);

  // Reset justCompleted when lesson changes
  useEffect(() => {
    setJustCompleted(false);
  }, [selected?.lesson.id]);

  function handleMarkComplete() {
    onMarkComplete();
    if (!isCompleted) {
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 5000);
    }
  }

  return (
    <div style={{ display: "grid", gap: "1rem" }}>
      {/* Video area */}
      <div
        className="card"
        style={{ padding: 0, overflow: "hidden", aspectRatio: "16/9", position: "relative" }}
      >
        {video.status === "loading" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(248,250,252,0.9)",
            }}
          >
            <p className="muted-text">Đang tải video...</p>
          </div>
        )}
        {video.status === "ready" && video.embedUrl && video.renderMode === "iframe" && (
          <iframe
            src={video.embedUrl}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            title={selected?.lesson.title}
          />
        )}
        {video.status === "ready" && video.embedUrl && video.renderMode !== "iframe" && (
          <SecureVideoPlayer
            src={video.embedUrl}
            streamTypeHint={video.streamType === "hls" ? "hls" : "file"}
            title={selected?.lesson.title}
            style={{ width: "100%", height: "100%", display: "block", background: "#020617" }}
          />
        )}
        {video.status === "unavailable" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              background: "rgba(248,250,252,0.9)",
            }}
          >
            <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>{selected?.lesson.title}</p>
            <p className="muted-text">Video sắp ra mắt</p>
          </div>
        )}
      </div>

      {/* Lesson info + actions */}
      {selected && (
        <div className="card" style={{ display: "grid", gap: "0.75rem" }}>
          <h1 style={{ fontSize: "1.15rem", fontWeight: 700 }}>
            <span className="muted-text" style={{ marginRight: "0.5rem" }}>
              {selected.orderNo}.
            </span>
            {selected.lesson.title}
          </h1>
          <p className="muted-text" style={{ fontSize: "0.85rem" }}>
            {selected.lesson.estimatedMinutes} phút
          </p>

          {/* Just completed banner */}
          {justCompleted && !isLast && (
            <div
              style={{
                background: "#d1fae5",
                border: "1px solid #6ee7b7",
                borderRadius: 8,
                padding: "0.6rem 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <span style={{ color: "#065f46", fontWeight: 600, fontSize: "0.9rem" }}>
                Giỏi lắm! Sẵn sàng bài tiếp theo?
              </span>
              <button
                type="button"
                className="solid-button"
                onClick={onGoNext}
                style={{ width: "fit-content", fontSize: "0.85rem", padding: "0.3rem 0.8rem" }}
              >
                Bài tiếp theo
              </button>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {!isCompleted ? (
              <button
                type="button"
                className="solid-button"
                onClick={handleMarkComplete}
                disabled={marking}
                style={{ width: "fit-content" }}
              >
                {marking ? "Đang lưu..." : "✓ Đánh dấu đã học"}
              </button>
            ) : (
              <span
                style={{
                  color: "#10b981",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                }}
              >
                ✓ Đã hoàn thành
              </span>
            )}
            {!isLast && (
              <button
                type="button"
                className="ghost-button"
                onClick={onGoNext}
                style={{ width: "fit-content" }}
              >
                Bài tiếp theo →
              </button>
            )}
            {isLast && allComplete && (
              <a href="/parent/courses" className="ghost-button" style={{ width: "fit-content" }}>
                🎉 Xem chứng chỉ
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

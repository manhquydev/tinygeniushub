"use client";

import { useState, useEffect, useTransition } from "react";

type CourseLesson = {
  orderNo: number;
  lesson: { id: string; title: string; objective: string; estimatedMinutes: number };
};

type Props = {
  courseSlug: string;
  courseTitle: string;
  lessons: CourseLesson[];
  enrollmentId: string;
};

type VideoState = { status: "loading" | "ready" | "unavailable"; embedUrl?: string };

export function CourseLessonsPlayer({ courseTitle, lessons }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [video, setVideo] = useState<VideoState>({ status: "loading" });
  const [, startTransition] = useTransition();

  const selected = lessons[selectedIndex];

  useEffect(() => {
    if (!selected) return;
    // Use startTransition to avoid synchronous setState inside effect body
    startTransition(() => setVideo({ status: "loading" }));

    fetch(`/api/lessons/${selected.lesson.id}/video-token`)
      .then((res) => {
        if (!res.ok) throw new Error("unavailable");
        return res.json() as Promise<{ ok: boolean; data: { embedUrl: string } }>;
      })
      .then((json) => {
        if (json.ok && json.data?.embedUrl) {
          setVideo({ status: "ready", embedUrl: json.data.embedUrl });
        } else {
          setVideo({ status: "unavailable" });
        }
      })
      .catch(() => setVideo({ status: "unavailable" }));
  }, [selected?.lesson.id]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: "1.25rem",
        alignItems: "start",
      }}
      className="page-stack"
    >
      {/* Sidebar */}
      <aside className="card" style={{ padding: "1rem", position: "sticky", top: "1rem" }}>
        <h2 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem" }}>{courseTitle}</h2>
        <nav style={{ display: "grid", gap: "0.25rem" }}>
          {lessons.map(({ orderNo, lesson }, idx) => (
            <button
              key={lesson.id}
              onClick={() => setSelectedIndex(idx)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "0.5rem",
                padding: "0.6rem 0.75rem",
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                background: idx === selectedIndex ? "var(--brand-50, #f0fdf4)" : "transparent",
                color: idx === selectedIndex ? "var(--brand-700, #15803d)" : "inherit",
                fontWeight: idx === selectedIndex ? 700 : 400,
                fontSize: "0.875rem",
                lineHeight: 1.4,
                width: "100%",
              }}
            >
              <span
                className="muted-text"
                style={{ minWidth: "1.4rem", fontVariantNumeric: "tabular-nums" }}
              >
                {orderNo}.
              </span>
              <span>{lesson.title}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
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

          {video.status === "ready" && video.embedUrl && (
            <iframe
              src={video.embedUrl}
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              title={selected?.lesson.title}
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

        {/* Lesson info */}
        {selected && (
          <div className="card">
            <h1 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
              <span className="muted-text" style={{ marginRight: "0.5rem" }}>
                {selected.orderNo}.
              </span>
              {selected.lesson.title}
            </h1>
            {selected.lesson.objective && (
              <p style={{ lineHeight: 1.6 }}>{selected.lesson.objective}</p>
            )}
            <p className="muted-text" style={{ fontSize: "0.875rem" }}>
              {selected.lesson.estimatedMinutes} phút
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

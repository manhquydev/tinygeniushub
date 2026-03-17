"use client";

import { useState, useEffect, useTransition } from "react";
import { SecureVideoPlayer } from "@/components/media/secure-video-player";

type CourseLesson = {
  orderNo: number;
  lesson: { id: string; title: string; estimatedMinutes: number };
};

type Props = {
  courseSlug: string;
  courseTitle: string;
  lessons: CourseLesson[];
  enrollmentId: string;
};

type VideoState = {
  status: "loading" | "ready" | "unavailable";
  embedUrl?: string;
  renderMode?: "iframe" | "native";
  streamType?: "hls" | "file" | "embed";
};

function shouldUseIframePlayer(url: string) {
  return /^https?:\/\/iframe\.mediadelivery\.net\/embed\//i.test(url);
}

const STORAGE_KEY = (slug: string) => `ccth_course_progress_${slug}`;

export function CourseLessonsPlayer({ courseSlug, courseTitle, lessons, enrollmentId: _enrollmentId }: Props) {
  void _enrollmentId;
  const [selectedIndex, setSelectedIndex] = useState(() => {
    // Resume from last position saved in localStorage
    if (typeof localStorage === "undefined") return 0;
    const saved = localStorage.getItem(STORAGE_KEY(courseSlug));
    const savedIdx = saved !== null ? Number(saved) : 0;
    return Number.isFinite(savedIdx) && savedIdx < lessons.length ? savedIdx : 0;
  });
  const [video, setVideo] = useState<VideoState>({ status: "loading" });
  const [completedSet, setCompletedSet] = useState<Set<string>>(() => {
    if (typeof localStorage === "undefined") return new Set();
    const raw = localStorage.getItem(`${STORAGE_KEY(courseSlug)}_done`);
    try {
      return new Set(JSON.parse(raw ?? "[]") as string[]);
    } catch {
      return new Set();
    }
  });
  const [marking, setMarking] = useState(false);
  const [, startTransition] = useTransition();

  const selected = lessons[selectedIndex];
  const isCompleted = selected ? completedSet.has(selected.lesson.id) : false;
  const isLast = selectedIndex === lessons.length - 1;

  // Persist selected index
  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY(courseSlug), String(selectedIndex));
    }
  }, [courseSlug, selectedIndex]);

  // Load video on lesson change
  useEffect(() => {
    if (!selected) return;
    startTransition(() => setVideo({ status: "loading" }));

    fetch(`/api/lessons/${selected.lesson.id}/video-token`)
      .then((res) => {
        if (!res.ok) throw new Error("unavailable");
        return res.json() as Promise<{
          ok: boolean;
          data: { embedUrl: string; streamType?: "hls" | "file" | "embed" };
        }>;
      })
      .then((json) => {
        if (json.ok && json.data?.embedUrl) {
          setVideo({
            status: "ready",
            embedUrl: json.data.embedUrl,
            renderMode: shouldUseIframePlayer(json.data.embedUrl) ? "iframe" : "native",
            streamType: json.data.streamType,
          });
        } else {
          setVideo({ status: "unavailable" });
        }
      })
      .catch(() => setVideo({ status: "unavailable" }));
  }, [selected?.lesson.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function markComplete() {
    if (!selected || isCompleted || marking) return;
    setMarking(true);
    try {
      const updated = new Set(completedSet).add(selected.lesson.id);
      setCompletedSet(updated);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(
          `${STORAGE_KEY(courseSlug)}_done`,
          JSON.stringify([...updated]),
        );
      }
      // If all lessons complete, call the course complete API
      if (updated.size === lessons.length) {
        await fetch(`/api/courses/${courseSlug}/complete`, { method: "POST" });
      }
    } finally {
      setMarking(false);
    }
  }

  function goNext() {
    if (!isLast) setSelectedIndex((i) => i + 1);
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "260px 1fr",
        gap: "1.25rem",
        alignItems: "start",
      }}
      className="page-stack"
    >
      {/* Sidebar */}
      <aside className="card" style={{ padding: "1rem", position: "sticky", top: "1rem" }}>
        <h2 style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: "0.75rem" }}>
          {courseTitle}
        </h2>
        <p style={{ fontSize: "0.78rem", marginBottom: "0.75rem" }} className="muted-text">
          {completedSet.size}/{lessons.length} bài hoàn thành
        </p>
        <nav style={{ display: "grid", gap: "0.25rem" }}>
          {lessons.map(({ orderNo, lesson }, idx) => {
            const done = completedSet.has(lesson.id);
            const active = idx === selectedIndex;
            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                style={{
                  textAlign: "left",
                  padding: "0.5rem 0.6rem",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  background: active ? "rgba(79,70,229,0.1)" : "transparent",
                  color: active ? "#4f46e5" : done ? "#6b7280" : "#0f172a",
                  fontWeight: active ? 700 : 500,
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span style={{ opacity: 0.5, minWidth: 18 }}>{orderNo}.</span>
                <span style={{ flex: 1 }}>{lesson.title}</span>
                {done && <span style={{ color: "#10b981" }}>âœ“</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div style={{ display: "grid", gap: "1rem" }}>
        {/* Video */}
        <div
          className="card"
          style={{ padding: 0, overflow: "hidden", aspectRatio: "16/9", position: "relative" }}
        >
          {video.status === "loading" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(248,250,252,0.9)" }}>
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
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.5rem", background: "rgba(248,250,252,0.9)" }}>
              <p style={{ fontWeight: 700, fontSize: "1.1rem" }}>{selected?.lesson.title}</p>
              <p className="muted-text">Video sắp ra mắt</p>
            </div>
          )}
        </div>

        {/* Lesson info + actions */}
        {selected && (
          <div className="card" style={{ display: "grid", gap: "0.75rem" }}>
            <h1 style={{ fontSize: "1.15rem", fontWeight: 700 }}>
              <span className="muted-text" style={{ marginRight: "0.5rem" }}>{selected.orderNo}.</span>
              {selected.lesson.title}
            </h1>
            <p className="muted-text" style={{ fontSize: "0.85rem" }}>{selected.lesson.estimatedMinutes} phút</p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {!isCompleted ? (
                <button
                  type="button"
                  className="solid-button"
                  onClick={markComplete}
                  disabled={marking}
                  style={{ width: "fit-content" }}
                >
                  {marking ? "Đang lưu..." : "âœ“ Đánh dấu đã học"}
                </button>
              ) : (
                <span style={{ color: "#10b981", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                  âœ“ Đã hoàn thành
                </span>
              )}
              {!isLast && (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={goNext}
                  style={{ width: "fit-content" }}
                >
                  Bài tiếp theo â†’
                </button>
              )}
              {isLast && completedSet.size === lessons.length && (
                <a href={`/parent/courses`} className="ghost-button" style={{ width: "fit-content" }}>
                  🎉 Xem chứng chỉ
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


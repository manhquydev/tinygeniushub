"use client";

import { useState, useEffect, useTransition } from "react";
import { LessonPlayerSidebar } from "./lesson-player-sidebar";
import { LessonPlayerContent } from "./lesson-player-content";
import { LessonParentScriptPanel } from "./lesson-parent-script-panel";

type CourseLesson = {
  orderNo: number;
  lesson: {
    id: string;
    title: string;
    estimatedMinutes: number;
    parentScriptMarkdown?: string | null;
  };
};

type VideoState = {
  status: "loading" | "ready" | "unavailable";
  embedUrl?: string;
  renderMode?: "iframe" | "native";
  streamType?: "hls" | "file" | "embed";
};

type Props = {
  courseSlug: string;
  courseTitle: string;
  lessons: CourseLesson[];
  enrollmentId: string;
};

const STORAGE_KEY = (slug: string) => `ccth_course_progress_${slug}`;

function shouldUseIframePlayer(url: string) {
  return /^https?:\/\/iframe\.mediadelivery\.net\/embed\//i.test(url);
}

export function CourseLessonsPlayer({
  courseSlug,
  courseTitle,
  lessons,
  enrollmentId: _enrollmentId,
}: Props) {
  void _enrollmentId;

  const [selectedIndex, setSelectedIndex] = useState(() => {
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

  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY(courseSlug), String(selectedIndex));
    }
  }, [courseSlug, selectedIndex]);

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
          JSON.stringify(Array.from(updated)),
        );
      }
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
      <LessonPlayerSidebar
        courseTitle={courseTitle}
        lessons={lessons}
        selectedIndex={selectedIndex}
        completedSet={completedSet}
        onSelect={setSelectedIndex}
      />
      <div style={{ display: "grid", gap: "1rem" }}>
        <LessonPlayerContent
          selected={selected}
          video={video}
          isCompleted={isCompleted}
          isLast={isLast}
          allComplete={completedSet.size === lessons.length}
          marking={marking}
          onMarkComplete={markComplete}
          onGoNext={goNext}
        />
        <LessonParentScriptPanel markdown={selected?.lesson.parentScriptMarkdown} />
      </div>
    </div>
  );
}

"use client";

import { CheckCircle2, Circle } from "lucide-react";

type LessonSummary = {
  orderNo: number;
  lesson: { id: string; title: string };
};

type Props = {
  courseTitle: string;
  lessons: LessonSummary[];
  selectedIndex: number;
  completedSet: Set<string>;
  onSelect: (index: number) => void;
};

export function LessonPlayerSidebar({
  courseTitle,
  lessons,
  selectedIndex,
  completedSet,
  onSelect,
}: Props) {
  const completedCount = completedSet.size;
  const totalCount = lessons.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <aside className="card" style={{ padding: "1rem", position: "sticky", top: "1rem" }}>
      <h2 style={{ fontSize: "0.88rem", fontWeight: 700, marginBottom: "0.5rem" }}>
        {courseTitle}
      </h2>
      <p style={{ fontSize: "0.78rem", marginBottom: "0.5rem" }} className="muted-text">
        {completedCount}/{totalCount} bài hoàn thành
      </p>
      {/* Progress bar */}
      <div
        style={{
          height: "6px",
          borderRadius: 99,
          background: "#e2e8f0",
          marginBottom: "0.75rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPct}%`,
            background: "#10b981",
            borderRadius: 99,
            transition: "width 0.3s ease",
          }}
        />
      </div>
      <nav style={{ display: "grid", gap: "0.25rem" }}>
        {lessons.map(({ orderNo, lesson }, idx) => {
          const done = completedSet.has(lesson.id);
          const active = idx === selectedIndex;
          return (
            <button
              key={lesson.id}
              type="button"
              onClick={() => onSelect(idx)}
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
              {done ? (
                <CheckCircle2 size={16} style={{ color: "#10b981", flexShrink: 0 }} />
              ) : (
                <Circle size={16} style={{ color: "#cbd5e1", flexShrink: 0 }} />
              )}
              <span style={{ opacity: 0.5, minWidth: 18 }}>{orderNo}.</span>
              <span style={{ flex: 1 }}>{lesson.title}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

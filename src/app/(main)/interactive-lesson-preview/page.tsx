"use client";

import { useState } from "react";
import { InteractiveLessonFlow } from "@/components/interactive-lesson";
import { DEMO_LESSONS } from "@/components/interactive-lesson/data";

export default function InteractiveLessonPreviewPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showLesson, setShowLesson] = useState(false);

  const lesson = DEMO_LESSONS[selectedIndex];
  if (!lesson) return null;

  return (
    <div style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>Interactive Lesson Preview</h1>

      <div style={{ display: "grid", gap: 8, marginBottom: 16 }}>
        {DEMO_LESSONS.map((l, i) => (
          <button
            key={l.id}
            type="button"
            onClick={() => { setSelectedIndex(i); setShowLesson(false); }}
            style={{
              padding: "10px 16px",
              textAlign: "left",
              fontSize: 16,
              border: i === selectedIndex ? "2px solid #3b82f6" : "1px solid #e2e8f0",
              borderRadius: 12,
              background: i === selectedIndex ? "#eff6ff" : "#fff",
              cursor: "pointer",
            }}
          >
            {i === selectedIndex ? "▶ " : ""}{l.title}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setShowLesson(true)}
        style={{
          padding: "14px 32px",
          fontSize: 20,
          fontWeight: 700,
          borderRadius: 16,
          border: "none",
          background: "linear-gradient(135deg, #22d3ee, #3b82f6)",
          color: "#fff",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
        }}
      >
        Start: {lesson.title}
      </button>

      {showLesson && (
        <InteractiveLessonFlow
          lessonData={lesson}
          childId="preview-child"
          lessonId={lesson.id}
          previewMode
          onCompleted={() => { setShowLesson(false); alert("Complete!"); }}
          onClose={() => setShowLesson(false)}
        />
      )}
    </div>
  );
}

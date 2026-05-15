"use client";

import { useState } from "react";
import { HybridLessonFlow } from "@/components/hybrid-lesson";
import { SAMPLE_HYBRID_LESSON } from "@/components/hybrid-lesson/sample-hybrid-lesson-data";

export default function HybridPreviewPage() {
  const [showLesson, setShowLesson] = useState(false);

  return (
    <div style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Hybrid Lesson Preview</h1>
      <p style={{ color: "#64748b", marginBottom: 24 }}>
        Video teaching + interactive practice. Press &quot;Start&quot; to view the demo.
      </p>

      <div
        style={{
          padding: 16,
          borderRadius: 12,
          border: "1px solid #e2e8f0",
          background: "#f8fafc",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{SAMPLE_HYBRID_LESSON.title}</h2>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
          {SAMPLE_HYBRID_LESSON.segments.length} segments:
          {" "}
          {SAMPLE_HYBRID_LESSON.segments.map((s, i) => (
            <span key={i} style={{
              display: "inline-block",
              padding: "2px 8px",
              margin: "2px 4px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              background: s.type === "video" ? "#dbeafe" : "#dcfce7",
              color: s.type === "video" ? "#1d4ed8" : "#15803d",
            }}>
              {s.type === "video" ? `🎬 ${s.phaseLabel}` : `🎮 ${s.step.type}`}
            </span>
          ))}
        </p>
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
          background: "linear-gradient(135deg, #f97316, #ef4444)",
          color: "#fff",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(239,68,68,0.3)",
        }}
      >
        Start Hybrid Lesson
      </button>

      {showLesson && (
        <HybridLessonFlow
          lessonData={SAMPLE_HYBRID_LESSON}
          childId="preview-child"
          lessonId={SAMPLE_HYBRID_LESSON.id}
          previewMode
          onCompleted={() => { setShowLesson(false); alert("Complete!"); }}
          onClose={() => setShowLesson(false)}
        />
      )}
    </div>
  );
}

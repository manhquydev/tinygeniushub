"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";

type Props = {
  markdown: string | null | undefined;
};

export function LessonParentScriptPanel({ markdown }: Props) {
  const [open, setOpen] = useState(false);

  if (!markdown || markdown.trim() === "") return null;

  return (
    <div
      className="card"
      style={{ padding: 0, overflow: "hidden", border: "1px solid #e2e8f0" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.75rem 1rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: "0.9rem",
          color: "#1e293b",
          textAlign: "left",
        }}
      >
        <BookOpen size={16} style={{ color: "#7c3aed", flexShrink: 0 }} />
        <span style={{ flex: 1 }}>Hướng dẫn cho Ba Mẹ</span>
        {open ? (
          <ChevronUp size={16} style={{ color: "#64748b" }} />
        ) : (
          <ChevronDown size={16} style={{ color: "#64748b" }} />
        )}
      </button>
      {open && (
        <div
          style={{
            padding: "0.75rem 1rem 1rem",
            borderTop: "1px solid #e2e8f0",
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "#334155",
          }}
          // Content is admin-authored markdown rendered as HTML
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: markdown }}
        />
      )}
    </div>
  );
}

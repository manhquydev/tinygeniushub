"use client";

import { useState } from "react";
import { BlogMarkdownEditor } from "./blog-markdown-editor";
import { BlogMarkdownPreview } from "./blog-markdown-preview";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function BlogEditorSplit({ value, onChange }: Props) {
  const [tab, setTab] = useState<"editor" | "preview" | "split">("split");

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        {(["editor", "split", "preview"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            style={{
              padding: "4px 12px",
              borderRadius: 4,
              fontSize: 13,
              background: tab === item ? "#3b82f6" : "#f1f5f9",
              color: tab === item ? "white" : "#475569",
              border: "none",
              cursor: "pointer",
            }}
          >
            {item === "editor" ? "Editor" : item === "split" ? "Split" : "Preview"}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 16, gridTemplateColumns: tab === "split" ? "1fr 1fr" : "1fr" }}>
        {tab !== "preview" ? <BlogMarkdownEditor value={value} onChange={onChange} /> : null}
        {tab !== "editor" ? <BlogMarkdownPreview markdown={value} /> : null}
      </div>
    </div>
  );
}

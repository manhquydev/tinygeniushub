"use client";

import { useEffect, useState } from "react";

interface Props {
  markdown: string;
}

export function BlogMarkdownPreview({ markdown }: Props) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!markdown.trim()) {
        setHtml("");
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/blog/preview-markdown", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ markdown }),
        });
        const payload = (await res.json()) as { html?: string };
        setHtml(payload.html ?? "");
      } catch {
        // Ignore preview failures and keep previous content.
      } finally {
        setLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [markdown]);

  return (
    <div style={{ position: "relative", minHeight: 200 }}>
      {loading ? (
        <div style={{ position: "absolute", top: 8, right: 8, fontSize: 12, color: "#888" }}>Rendering...</div>
      ) : null}
      <div
        className="prose max-w-none"
        style={{ padding: "1rem", border: "1px solid #e2e8f0", borderRadius: 8, minHeight: 200, background: "#fff" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

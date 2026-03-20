"use client";

import { useEffect, useMemo, useState } from "react";

type Heading = {
  id: string;
  text: string;
  level: number;
};

export function BlogToc({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const safeHeadings = useMemo(() => headings.filter((heading) => heading.id.length > 0), [headings]);

  useEffect(() => {
    if (safeHeadings.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-80px 0px -60% 0px",
        threshold: [0.1, 0.4, 0.8],
      },
    );

    for (const heading of safeHeadings) {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    }

    return () => observer.disconnect();
  }, [safeHeadings]);

  if (safeHeadings.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Mục lục bài viết" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h4 className="mb-3 text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Mục lục</h4>
      <ul className="space-y-2">
        {safeHeadings.map((heading) => {
          const active = activeId === heading.id;
          return (
            <li key={heading.id}>
              <button
                type="button"
                onClick={() => document.getElementById(heading.id)?.scrollIntoView({ behavior: "smooth" })}
                className={`w-full border-l-2 px-3 py-1 text-left text-sm transition ${
                  active
                    ? "border-teal-500 text-teal-700"
                    : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900"
                }`}
                style={{ paddingLeft: `${Math.max(0, (heading.level - 2) * 10 + 12)}px` }}
              >
                {heading.text}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}


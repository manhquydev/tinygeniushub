# Phase 6: Demo & Preview

## Context

- [Flow Orchestrator](./phase-04-flow-orchestrator.md)
- [Existing preview page](../../src/app/(main)/mascot-preview/) — pattern reference

## Overview

- **Priority:** P2
- **Status:** pending
- **Effort:** 30 min

Create a preview page for testing all 7 demo lessons without needing real API data.

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/app/(main)/interactive-lesson-preview/page.tsx` | Preview page | ~80 |
| `src/app/(main)/interactive-lesson-preview/layout.tsx` | Layout with metadata | ~15 |

## Implementation Steps

### 1. layout.tsx

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interactive Lesson Preview",
  robots: "noindex",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
```

### 2. page.tsx

```tsx
"use client";

import { useState } from "react";
import { InteractiveLessonFlow } from "@/components/interactive-lesson";
import { DEMO_LESSONS } from "@/components/interactive-lesson/data";

export default function InteractiveLessonPreviewPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showLesson, setShowLesson] = useState(false);

  const lesson = DEMO_LESSONS[selectedIndex];

  return (
    <div style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <h1>Interactive Lesson Preview</h1>

      {/* Lesson selector */}
      <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem" }}>
        {DEMO_LESSONS.map((l, i) => (
          <button key={l.id} onClick={() => { setSelectedIndex(i); setShowLesson(false); }}>
            {i === selectedIndex ? "▶ " : ""}{l.title}
          </button>
        ))}
      </div>

      <button onClick={() => setShowLesson(true)}>
        Bắt đầu: {lesson.title}
      </button>

      {/* Interactive lesson overlay */}
      {showLesson && (
        <InteractiveLessonFlow
          lessonData={lesson}
          childId="preview-child"
          lessonId={lesson.id}
          onCompleted={() => { setShowLesson(false); alert("Hoàn thành!"); }}
          onClose={() => setShowLesson(false)}
        />
      )}
    </div>
  );
}
```

### 3. Mock completion API

The preview page uses `childId="preview-child"`. The completion API call will 404 — this is acceptable for preview. Optionally, add a `previewMode` prop to `InteractiveLessonFlow` that skips the API call.

## Todo

- [ ] Create `layout.tsx`
- [ ] Create `page.tsx`
- [ ] Test all 7 demo lessons in browser
- [ ] Verify no console errors

## Success Criteria

- `/interactive-lesson-preview` loads without errors
- Can select and play all 7 demo lessons
- Full flow works: hook > concept > demonstrate > activity > celebrate
- Page is noindexed (not crawled)

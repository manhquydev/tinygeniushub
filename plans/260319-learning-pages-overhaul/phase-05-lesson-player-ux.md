# Phase 05: Lesson Player UX

## Context Links
- Lesson player: `src/components/courses/course-lessons-player.tsx` (252 lines — needs split)
- Lessons API: `src/app/api/courses/[slug]/lessons/route.ts`
- Prisma schema: `parentScriptMarkdown String?` on Lesson model (line 349)

## Overview
- **Priority**: P2
- **Status**: pending
- **Description**: Improve lesson player sidebar with clearer progress checkmarks, add parent script panel toggle, and enhance "Bai tiep theo" prompt after marking complete.

## Key Insights
- Player is 252 lines (client component) — **needs split** to stay under 200
- Progress tracking uses localStorage (`completedSet`) — checkmarks render as plain text "check"
- `parentScriptMarkdown` exists in DB but is NEVER fetched or displayed in the player
- Lessons API (`/api/courses/[slug]/lessons`) fetches lesson data but does NOT include `parentScriptMarkdown`
- "Next lesson" button exists (line 229-237) but is a secondary ghost button — not prominent enough
- After marking complete, nothing special happens — user must manually click next

## Requirements

### Functional
- Sidebar: replace text checkmarks with styled icons (green circle-check for done, gray circle for pending)
- Parent script panel: collapsible section below video with rendered markdown content
- Auto-prompt "Bai tiep theo" after marking complete: show a brief congratulation + auto-highlight next button
- Fetch `parentScriptMarkdown` from API

### Non-functional
- Player must be split to stay under 200 lines
- Markdown rendering: use a lightweight renderer (dangerouslySetInnerHTML with sanitized content, or `react-markdown` if already in deps)
- No new dependencies if avoidable

## Related Code Files

### Files to Modify
1. `src/components/courses/course-lessons-player.tsx` — refactor + enhance
2. `src/app/api/courses/[slug]/lessons/route.ts` — add `parentScriptMarkdown` to response

### Files to Create
1. `src/components/courses/lesson-player-sidebar.tsx` — extracted sidebar with styled progress
2. `src/components/courses/lesson-player-content.tsx` — extracted main content area
3. `src/components/courses/lesson-parent-script-panel.tsx` — collapsible parent script

## Architecture

### Modularization Plan

Current `course-lessons-player.tsx` (252 lines) splits into:
- `course-lessons-player.tsx` (~60 lines) — state management + composition
- `lesson-player-sidebar.tsx` (~70 lines) — lesson list with styled checkmarks
- `lesson-player-content.tsx` (~80 lines) — video + lesson info + actions
- `lesson-parent-script-panel.tsx` (~50 lines) — collapsible markdown panel

### Data Flow

```
CourseLessonsPlayer (state owner)
  ├── LessonPlayerSidebar (lesson list, selection handler)
  ├── LessonPlayerContent (video, mark complete, next lesson)
  └── LessonParentScriptPanel (collapsible markdown)
```

## Implementation Steps

### Step 1: Add `parentScriptMarkdown` to lessons API

File: `src/app/api/courses/[slug]/lessons/route.ts`

In the lesson select (line 67), add:
```ts
lesson: {
  select: {
    ...existing,
    parentScriptMarkdown: true, // ADD
  }
}
```

In the response mapping (line 122), add:
```ts
return {
  ...existing,
  parentScriptMarkdown: lesson.parentScriptMarkdown, // ADD
};
```

### Step 2: Update lesson type in player

```ts
type CourseLesson = {
  orderNo: number;
  lesson: {
    id: string;
    title: string;
    estimatedMinutes: number;
    parentScriptMarkdown?: string | null; // ADD
  };
};
```

### Step 3: Extract sidebar component

File: `src/components/courses/lesson-player-sidebar.tsx`

```tsx
"use client";
import { CheckCircle2, Circle } from "lucide-react";

type Props = {
  courseTitle: string;
  lessons: CourseLesson[];
  selectedIndex: number;
  completedSet: Set<string>;
  onSelect: (index: number) => void;
};

export function LessonPlayerSidebar({ courseTitle, lessons, selectedIndex, completedSet, onSelect }: Props) {
  return (
    <aside className="card" style={{ padding: "1rem", position: "sticky", top: "1rem" }}>
      <h2 ...>{courseTitle}</h2>
      <p ...>{completedSet.size}/{lessons.length} bai hoan thanh</p>
      {/* Overall progress bar */}
      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden mb-3">
        <div className="h-full bg-emerald-500 rounded-full transition-all"
             style={{ width: `${(completedSet.size / lessons.length) * 100}%` }} />
      </div>
      <nav>
        {lessons.map(({ orderNo, lesson }, idx) => {
          const done = completedSet.has(lesson.id);
          const active = idx === selectedIndex;
          return (
            <button key={lesson.id} onClick={() => onSelect(idx)} ...>
              {done
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                : <Circle className="h-4 w-4 text-slate-300 shrink-0" />}
              <span>{orderNo}. {lesson.title}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
```

### Step 4: Extract content component

File: `src/components/courses/lesson-player-content.tsx`

Contains: video player area, lesson info, mark-complete button, next button.

### Step 5: Create parent script panel

File: `src/components/courses/lesson-parent-script-panel.tsx`

```tsx
"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen } from "lucide-react";

type Props = {
  markdown: string | null | undefined;
};

export function LessonParentScriptPanel({ markdown }: Props) {
  const [open, setOpen] = useState(false);

  if (!markdown) return null;

  return (
    <div className="card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full text-left"
      >
        <BookOpen className="h-4 w-4 text-sky-600" />
        <span className="font-bold text-sm">Huong dan cho Ba Me</span>
        {open ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
      </button>
      {open && (
        <div className="mt-3 prose prose-sm max-w-none text-slate-700"
             dangerouslySetInnerHTML={{ __html: markdown }} />
      )}
    </div>
  );
}
```

Note: If markdown is raw MD (not HTML), need to check if `react-markdown` or a markdown-to-html util is available. If not, use a simple regex-based renderer or add `marked` as dep.

### Step 6: Enhance "next lesson" prompt

After `markComplete()` succeeds, if not last lesson:
```tsx
// In lesson-player-content.tsx
const [justCompleted, setJustCompleted] = useState(false);

async function markComplete() {
  // ... existing logic ...
  setJustCompleted(true);
  setTimeout(() => setJustCompleted(false), 5000); // Auto-dismiss after 5s
}

// In render, after mark complete:
{justCompleted && !isLast && (
  <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-3">
    <span className="text-emerald-700 font-bold text-sm">Gioi lam! San sang bai tiep theo?</span>
    <button onClick={goNext} className="solid-button text-sm" style={{ width: "fit-content" }}>
      Bai tiep theo
    </button>
  </div>
)}
```

### Step 7: Wire everything in main player

```tsx
export function CourseLessonsPlayer({ courseSlug, courseTitle, lessons, enrollmentId }: Props) {
  // All state stays here
  return (
    <div className="grid grid-cols-[260px_1fr] gap-5 items-start page-stack">
      <LessonPlayerSidebar ... />
      <div className="grid gap-4">
        <LessonPlayerContent ... />
        <LessonParentScriptPanel markdown={selected?.lesson.parentScriptMarkdown} />
      </div>
    </div>
  );
}
```

## Todo List
- [ ] Add `parentScriptMarkdown` to lessons API response
- [ ] Update CourseLesson type to include `parentScriptMarkdown`
- [ ] Extract `LessonPlayerSidebar` component
- [ ] Replace text checkmarks with lucide icons in sidebar
- [ ] Add overall progress bar to sidebar
- [ ] Extract `LessonPlayerContent` component
- [ ] Create `LessonParentScriptPanel` component
- [ ] Add collapsible toggle for parent script
- [ ] Check markdown rendering approach (HTML vs raw MD)
- [ ] Add "just completed" congratulation prompt
- [ ] Auto-highlight next lesson button after completion
- [ ] Wire all components in main player
- [ ] Verify main player under 80 lines
- [ ] Verify each sub-component under 200 lines
- [ ] Test: parent script shows when data exists
- [ ] Test: parent script hidden when null/empty

## Success Criteria
- Player main file under 80 lines, sub-components under 200 each
- Sidebar shows styled circle-check/circle icons instead of text
- Overall progress bar visible in sidebar
- Parent script panel renders and toggles correctly
- "Bai tiep theo" prompt appears after marking lesson complete
- No regression in video playback or completion tracking
- `parentScriptMarkdown` returned from API when present

## Risk Assessment
- **Risk**: Markdown content may contain unsafe HTML
  - **Mitigation**: Use `dangerouslySetInnerHTML` only if content is admin-authored (trusted); add DOMPurify sanitization if concerned
- **Risk**: Splitting client component may break shared state
  - **Mitigation**: Keep all state in parent, pass down as props — standard React pattern
- **Risk**: `parentScriptMarkdown` field may be empty for all lessons in prod
  - **Mitigation**: Panel hides when null — graceful degradation; no visual impact

## Security Considerations
- `parentScriptMarkdown` is admin-authored content — generally trusted
- If user-generated content ever enters this field, add sanitization
- API still requires authentication (parent + child ownership check)

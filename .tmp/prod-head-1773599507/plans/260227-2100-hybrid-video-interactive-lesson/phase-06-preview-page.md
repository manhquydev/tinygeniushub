---
phase: 6
status: pending
priority: P2
effort: 2h
---

# Phase 6: Preview Page

## Context

- Existing interactive lesson preview: `src/app/(main)/mascot-preview/`
- Need similar preview for hybrid lessons with hardcoded sample data

## Files to Create

- `src/app/(main)/hybrid-preview/page.tsx` — preview page (~80 lines)
- `src/components/hybrid-lesson/sample-hybrid-lesson-data.ts` — sample data (~60 lines)

## Implementation

### 1. sample-hybrid-lesson-data.ts

Hardcoded HybridLessonData using:
- A sample teaching video URL (local file or placeholder)
- Reuse activity/celebrate steps from existing interactive lesson sample data

### 2. Preview page

```
"use client"
- Load sample hybrid lesson data
- Render <HybridLessonFlow> in preview mode
- Add controls: reset, skip to segment
- Show segment list sidebar for debugging
```

## Todo

- [ ] Create sample data file
- [ ] Create preview page
- [ ] Test full flow in browser
- [ ] Test on mobile viewport

## Success Criteria

- Preview page loads at `/hybrid-preview`
- Can play through full hybrid lesson flow
- Reset button works

# Phase 5: Integration

## Context

- [Flow Orchestrator](./phase-04-flow-orchestrator.md)
- [LessonWizardFlow](../../src/components/lesson-wizard/lesson-wizard-flow.tsx)
- [CourseLessonsPlayer](../../src/components/courses/course-lessons-player.tsx)

## Overview

- **Priority:** P1
- **Status:** pending
- **Effort:** 1 hour

Integrate `InteractiveLessonFlow` into the two existing lesson consumers. Maintain backward compatibility — lessons without interactive data fall back to video.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/lesson-wizard/lesson-wizard-flow.tsx` | Add interactive lesson mode |
| `src/components/courses/course-lessons-player.tsx` | Add interactive lesson mode |

## Files to Create

| File | Purpose | Lines |
|------|---------|-------|
| `src/components/interactive-lesson/index.ts` | Barrel export | ~10 |

## Implementation Steps

### 1. Barrel export

```ts
// src/components/interactive-lesson/index.ts
export { InteractiveLessonFlow } from "./interactive-lesson-flow";
export type { InteractiveLessonData, InteractiveLessonStep } from "./interactive-lesson-types";
```

### 2. LessonWizardFlow integration

**Strategy**: Add optional `interactiveLessonData` prop. When present, skip video step (step 1) and render `InteractiveLessonFlow` instead of video+quiz steps.

```tsx
interface LessonWizardFlowProps {
  // ... existing props
  interactiveLessonData?: InteractiveLessonData; // NEW
}
```

Changes:
- If `interactiveLessonData` is provided:
  - Step 0 (Intro): unchanged, but "Bắt đầu" button goes to interactive flow (step 1 becomes interactive)
  - Step 1: render `InteractiveLessonFlow` instead of video iframe
  - Step 2 (quiz): SKIP — activity is embedded in interactive flow
  - Step 3 (upload): unchanged, reached after interactive lesson completes
  - Step 4 (done): unchanged
- If `interactiveLessonData` is NOT provided:
  - Everything works exactly as before (video flow)

Key: `InteractiveLessonFlow.onCompleted` triggers `setStep(3)` (upload) or `setStep(4)` (done).

### 3. CourseLessonsPlayer integration

**Strategy**: Add optional `interactiveLessons` map prop. When a lesson has interactive data, render `InteractiveLessonFlow` instead of video iframe.

```tsx
type Props = {
  // ... existing props
  interactiveLessons?: Record<string, InteractiveLessonData>; // NEW: lessonId -> data
};
```

Changes:
- In video area: check if `interactiveLessons?.[selected.lesson.id]` exists
- If yes: render `InteractiveLessonFlow` in place of iframe
- If no: render existing video iframe (unchanged)
- "Đánh dấu đã học" button: auto-triggered by interactive lesson completion

### 4. Backward Compatibility

- Both components default to video mode when interactive data is absent
- No changes to existing API endpoints
- No changes to existing lesson data model (interactive data is passed as prop, not fetched)
- Future: interactive data could be stored in DB and fetched via API

## Todo

- [ ] Create `index.ts` barrel export
- [ ] Modify `lesson-wizard-flow.tsx` — add `interactiveLessonData` prop
- [ ] Modify `lesson-wizard-flow.tsx` — conditional rendering for interactive mode
- [ ] Modify `course-lessons-player.tsx` — add `interactiveLessons` prop
- [ ] Modify `course-lessons-player.tsx` — conditional rendering for interactive mode
- [ ] Verify both modes work (interactive + fallback video)
- [ ] Verify compile

## Success Criteria

- LessonWizardFlow renders interactive lesson when data provided
- LessonWizardFlow renders video when no interactive data (backward compat)
- CourseLessonsPlayer renders interactive lesson per-lesson when data provided
- CourseLessonsPlayer renders video when no interactive data (backward compat)
- Completion API calls work in both modes

## Risk

- LessonWizardFlow is 920 lines — modifications must be surgical to avoid regressions
- Test both interactive and video paths after integration

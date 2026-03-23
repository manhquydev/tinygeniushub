# Phase 5: Course Page Integration

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 4h
- **Depends on:** Phase 4

Replace current lesson launch points to use UnifiedLessonFlow.

## Context Links
- [course-lessons-player.tsx](../../src/components/courses/course-lessons-player.tsx) — 224 lines, sidebar + iframe video player
- [lesson-start-card.tsx](../../src/components/lesson-wizard/lesson-start-card.tsx) — launches LessonWizardFlow
- [kid-mission-panel.tsx](../../src/components/kid-mission-panel.tsx) — also launches LessonStartCard

## Key Insights
- `CourseLessonsPlayer` currently shows sidebar + iframe — needs full rework to fetch lesson data and launch UnifiedLessonFlow
- `LessonStartCard` currently instantiates `LessonWizardFlow` directly — change to `UnifiedLessonFlow`
- Must fetch `/api/lessons/:id/full` to get segments before launching player
- VIDEO_ONLY lessons (0 segments) should behave identically to current wizard

## Architecture

### CourseLessonsPlayer changes:
- Keep sidebar lesson list
- On lesson select: fetch `/api/lessons/:id/full`
- Launch `UnifiedLessonFlow` as fullscreen overlay (like current wizard portal)
- Remove inline iframe player

### LessonStartCard changes:
- On launch: fetch `/api/lessons/:id/full` (replace video-token fetch)
- Pass full lesson data to `UnifiedLessonFlow` instead of `LessonWizardFlow`

## Related Code Files

### Modify
- `src/components/courses/course-lessons-player.tsx` — replace iframe with UnifiedLessonFlow launch
- `src/components/lesson-wizard/lesson-start-card.tsx` — swap LessonWizardFlow for UnifiedLessonFlow
- `src/components/kid-mission-panel.tsx` — update LessonStartCard import if needed

### No changes needed
- `src/app/(main)/courses/[slug]/lessons/page.tsx` — server component, passes data to CourseLessonsPlayer

## Implementation Steps

1. Update `lesson-start-card.tsx`:
   - Import `UnifiedLessonFlow` instead of `LessonWizardFlow`
   - In `handleLaunch`: fetch `/api/lessons/${id}/full` to get full lesson data
   - Store lesson data in state
   - Pass to `UnifiedLessonFlow` instead of `LessonWizardFlow`
   - Keep video-token fetch as fallback for backward compat (videoSource resolution)

2. Update `course-lessons-player.tsx`:
   - Add state for `activeLessonData` and `isPlayerOpen`
   - On lesson select: fetch `/api/lessons/:id/full`
   - On "start" button: open `UnifiedLessonFlow` as overlay
   - Keep sidebar list, remove inline iframe
   - On completion: update completedSet, close overlay

3. Verify kid-mission-panel still works (uses LessonStartCard)

## TODO

- [ ] Update lesson-start-card.tsx to use UnifiedLessonFlow
- [ ] Update course-lessons-player.tsx to use UnifiedLessonFlow
- [ ] Test lesson launch from home page (kid-mission-panel)
- [ ] Test lesson launch from course page
- [ ] Test VIDEO_ONLY lessons behave identically
- [ ] Test completion callback fires correctly

## Success Criteria
- Lessons launch correctly from all entry points
- VIDEO_ONLY mode: identical UX to current wizard
- HYBRID/INTERACTIVE modes: work when segments exist
- Completion tracking works end-to-end

## Risk Assessment
- **Risk:** Double fetch (video-token + full) — Mitigation: full endpoint includes videoSource, skip separate video-token fetch
- **Risk:** Loading state while fetching lesson data — Mitigation: show spinner in LessonStartCard launch button

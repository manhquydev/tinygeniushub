# Phase 8: Testing + Cleanup

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 3h
- **Depends on:** All previous phases

E2E tests for all 3 modes. Delete old players.

## Context Links
- [Existing test mocks](../../src/test/mocks/lesson-start-card.mock.tsx)

## Key Insights
- Must verify zero regression for VIDEO_ONLY (production path)
- HYBRID and INTERACTIVE are new paths, need happy path + error path tests
- Old files safe to delete only after UnifiedLessonFlow is confirmed working

## Related Code Files

### Delete
- `src/components/lesson-wizard/lesson-wizard-flow.tsx` (919 lines)
- `src/components/hybrid-lesson/hybrid-lesson-flow.tsx` (223 lines)
- `src/components/hybrid-lesson/use-hybrid-lesson-state.ts` (128 lines)
- `src/components/hybrid-lesson/hybrid-lesson-types.ts` (only if types moved to unified)
- `src/components/hybrid-lesson/sample-hybrid-lesson-data.ts`
- `src/components/hybrid-lesson/index.ts` (update exports)
- `src/components/interactive-lesson/interactive-lesson-flow.tsx` (228 lines)
- `src/components/interactive-lesson/use-interactive-lesson-state.ts` (66 lines)
- `src/components/interactive-lesson/index.ts` (update exports)
- `src/app/(main)/hybrid-preview/` (entire directory)
- `src/app/(main)/interactive-lesson-preview/` (entire directory)

### Keep (do NOT delete)
- `src/components/hybrid-lesson/video-segment-player.tsx` — reused by unified
- `src/components/hybrid-lesson/hybrid-transition-overlay.tsx` — reused by unified
- `src/components/hybrid-lesson/hybrid-replay-button.tsx` — reused by unified
- `src/components/hybrid-lesson/use-video-preloader.ts` — reused by unified
- All `src/components/interactive-lesson/lesson-step-*.tsx` — reused by unified
- `src/components/interactive-lesson/interactive-scene-background.tsx` — reused by unified
- `src/components/interactive-lesson/audio-player.tsx` — reused by step components
- All `src/components/interactive-lesson/data/demo-*.ts` — test data
- `src/components/lesson-wizard/activity-renderer.tsx` — reused by unified quiz
- `src/components/lesson-wizard/lesson-start-card.tsx` — updated in Phase 5
- Other lesson-wizard sub-components (drag-drop, sort-order, drawing activities)

### Modify
- `src/test/mocks/lesson-start-card.mock.tsx` — update mock if needed
- `src/components/hybrid-lesson/index.ts` — remove deleted exports, keep reusable
- `src/components/interactive-lesson/index.ts` — remove deleted exports, keep reusable

## Implementation Steps

1. Write E2E/integration tests:
   - VIDEO_ONLY: intro -> video -> quiz (3 activities) -> complete
   - HYBRID: intro -> video -> transition -> activity -> celebrate -> complete
   - INTERACTIVE: intro -> hook -> concept -> demonstrate -> activity -> celebrate -> complete
   - Error paths: wrong answers trigger reinforce, retry logic
   - Watch session heartbeat (VIDEO_ONLY)
   - Parent gate exit dialog

2. Run all existing tests to verify no regressions

3. Delete old player files (listed above)

4. Update barrel exports in hybrid-lesson/index.ts and interactive-lesson/index.ts

5. Update test mocks

6. Run linting and type-check

7. Final build verification: `pnpm build`

## TODO

- [ ] Write VIDEO_ONLY mode E2E test
- [ ] Write HYBRID mode E2E test
- [ ] Write INTERACTIVE mode E2E test
- [ ] Run existing test suite — 0 failures
- [ ] Delete old lesson-wizard-flow.tsx
- [ ] Delete old hybrid-lesson-flow.tsx + use-hybrid-lesson-state.ts
- [ ] Delete old interactive-lesson-flow.tsx + use-interactive-lesson-state.ts
- [ ] Delete preview pages (hybrid-preview, interactive-lesson-preview)
- [ ] Update barrel exports
- [ ] Update test mocks
- [ ] Run lint + type-check
- [ ] Run pnpm build — success

## Success Criteria
- All E2E tests pass for all 3 modes
- Existing test suite passes
- Old player files deleted
- Build succeeds with 0 errors
- No dead imports or unused code

## Risk Assessment
- **Risk:** Deleting old files breaks imports elsewhere — Mitigation: grep for all imports before deleting
- **Risk:** Missed edge case in VIDEO_ONLY mode — Mitigation: thorough E2E test covering quiz, heartbeat, evidence upload

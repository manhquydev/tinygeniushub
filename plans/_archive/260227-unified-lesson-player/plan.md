---
title: "Unified Lesson Player"
description: "Merge 3 lesson players (Wizard, Interactive, Hybrid) into one UnifiedLessonFlow with DB-driven segments"
status: pending
priority: P1
effort: 40h
branch: main
tags: [lesson-player, refactor, prisma, api, admin]
created: 2026-02-27
---

# Unified Lesson Player

## Problem

3 parallel lesson players exist:
- **LessonWizardFlow** (919 lines, production) — VIDEO_ONLY: intro, iframe video w/ heartbeat, quiz, evidence upload, done
- **InteractiveLessonFlow** (228 lines, preview) — hook/concept/demonstrate/activity/reinforce/celebrate steps
- **HybridLessonFlow** (223 lines, preview) — video segments + interactive segments with transitions

Goal: merge into 1 `UnifiedLessonFlow` that auto-detects mode from DB data.

## Phases

| # | Phase | Effort | Status |
|---|-------|--------|--------|
| 1 | [DB Schema + Migration](./phase-01-db-schema-migration.md) | 4h | pending |
| 2 | [API Endpoints](./phase-02-api-endpoints.md) | 4h | pending |
| 3 | [Unified State Machine](./phase-03-unified-state-machine.md) | 6h | pending |
| 4 | [Unified Flow Component](./phase-04-unified-flow-component.md) | 8h | pending |
| 5 | [Course Page Integration](./phase-05-course-page-integration.md) | 4h | pending |
| 6 | [Admin CMS](./phase-06-admin-cms.md) | 8h | pending |
| 7 | [Migration Script](./phase-07-migration-script.md) | 3h | pending |
| 8 | [Testing + Cleanup](./phase-08-testing-cleanup.md) | 3h | pending |

## Key Dependencies

- Phase 1 (DB) must complete before Phase 2 (API)
- Phase 3 (state machine) can start in parallel with Phase 2
- Phase 4 (component) depends on Phase 3
- Phase 5 (integration) depends on Phase 4
- Phase 6 (admin) depends on Phase 1+2
- Phase 7 (migration) depends on Phase 1
- Phase 8 (testing) depends on all above

## Mode Detection Logic

```
segments.length === 0 && videoSource exists  -> VIDEO_ONLY
segments.some(s => s.type === "video")       -> HYBRID
segments.length > 0 && all interactive       -> INTERACTIVE
```

## Files Overview

### Create
- `prisma/migrations/xxx_add_lesson_segment/` (auto-generated)
- `src/app/api/lessons/[lessonId]/full/route.ts`
- `src/app/api/admin/lessons/[lessonId]/segments/route.ts`
- `src/components/unified-lesson/unified-lesson-types.ts`
- `src/components/unified-lesson/use-unified-lesson-state.ts`
- `src/components/unified-lesson/unified-lesson-flow.tsx`
- `src/components/unified-lesson/unified-lesson-header.tsx`
- `src/components/unified-lesson/unified-lesson-intro-step.tsx`
- `src/components/unified-lesson/unified-lesson-video-only-player.tsx`
- `src/components/unified-lesson/unified-lesson-video-step.tsx`
- `src/components/unified-lesson/unified-lesson-quiz-step.tsx`
- `src/components/unified-lesson/unified-lesson-upload-step.tsx`
- `src/components/unified-lesson/unified-lesson-done-step.tsx`
- `src/components/unified-lesson/index.ts`
- `src/components/admin/lesson-segment-editor.tsx`
- `scripts/migrate-lessons-to-segments.ts`

### Modify
- `prisma/schema.prisma` (add LessonSegment model, Lesson fields)
- `src/components/courses/course-lessons-player.tsx` (use UnifiedLessonFlow)
- `src/components/lesson-wizard/lesson-start-card.tsx` (use UnifiedLessonFlow)
- `src/components/kid-mission-panel.tsx` (use UnifiedLessonFlow)
- `src/app/(main)/admin/courses/[id]/admin-course-detail-client.tsx` (add segment editor)

### Delete (Phase 8)
- `src/components/lesson-wizard/lesson-wizard-flow.tsx`
- `src/components/hybrid-lesson/hybrid-lesson-flow.tsx`
- `src/components/hybrid-lesson/use-hybrid-lesson-state.ts`
- `src/components/interactive-lesson/interactive-lesson-flow.tsx`
- `src/components/interactive-lesson/use-interactive-lesson-state.ts`
- `src/app/(main)/hybrid-preview/` (entire directory)
- `src/app/(main)/interactive-lesson-preview/` (entire directory)

### Keep (reuse as-is)
- `src/components/hybrid-lesson/video-segment-player.tsx`
- `src/components/hybrid-lesson/hybrid-transition-overlay.tsx`
- `src/components/hybrid-lesson/hybrid-replay-button.tsx`
- `src/components/interactive-lesson/lesson-step-*.tsx` (all 6 step components)
- `src/components/interactive-lesson/interactive-scene-background.tsx`
- `src/components/lesson-wizard/activity-renderer.tsx`
- `src/components/evidence-upload-panel.tsx`
- `src/components/parent-gate-dialog.tsx`
- All watch session/heartbeat API routes

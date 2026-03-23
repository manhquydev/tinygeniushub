---
title: "Learning Pages Overhaul"
description: "Free lesson preview, curriculum timeline, parent progress, dashboard viz, lesson player UX"
status: pending
priority: P1
effort: 14h
branch: main
tags: [learning, ux, courses, parent, player]
created: 2026-03-19
---

# Learning Pages Overhaul

## Scope

5 areas: free lesson preview ("Hoc thu that"), curriculum progress timeline, parent courses progress, parent dashboard learning viz, lesson player UX improvements.

## Phases

| # | Phase | Status | Effort | File |
|---|-------|--------|--------|------|
| 1 | Free Lesson Preview — "Hoc thu that" | pending | 4h | [phase-01](./phase-01-free-lesson-preview.md) |
| 2 | Curriculum Progress Timeline | pending | 2h | [phase-02](./phase-02-curriculum-progress-timeline.md) |
| 3 | Parent Courses Page Progress | pending | 3h | [phase-03](./phase-03-parent-courses-progress.md) |
| 4 | Parent Dashboard Learning Viz | pending | 2h | [phase-04](./phase-04-parent-dashboard-learning-viz.md) |
| 5 | Lesson Player UX | pending | 3h | [phase-05](./phase-05-lesson-player-ux.md) |

## Key Constraints

- No new DB schema changes — `isPreview`, `parentScriptMarkdown` fields already exist
- File size < 200 lines — split if needed
- Keep existing analytics tracking + A/B test logic intact
- TypeScript strict, no `any`
- Tailwind + shadcn/ui patterns

## Dependencies

- Phase 2 depends on Phase 1 (curriculum uses `isPreview` flag)
- Phases 3-5 are independent of each other and of 1-2
- All phases share the existing Prisma schema unchanged

## Execution Order

1. Phase 1 (highest priority, unblocks Phase 2)
2. Phase 2 (uses isPreview from Phase 1)
3. Phases 3, 4, 5 (parallel, independent)

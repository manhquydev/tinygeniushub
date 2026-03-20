---
phase: 7
status: pending
priority: P3
effort: 1h
---

# Phase 7: Production Workflow Documentation

## Files to Create/Update

- `docs/hybrid-lesson-production-workflow.md`

## Content Outline

1. Overview: what hybrid lessons are, why they exist
2. Authoring teaching video data (LessonVideoDataV2 for hook+concept+demonstrate only)
3. Authoring interactive data (InteractiveLessonStep for activity+reinforce+celebrate)
4. Running the render pipeline (`pnpm hybrid:render`)
5. Uploading video to CDN
6. Generating HybridLessonData JSON
7. Storing in database / content seed
8. Testing via preview page
9. Checklist for new hybrid lesson

## Todo

- [ ] Write production workflow doc
- [ ] Update existing `docs/interactive-lesson-production-workflow.md` to reference hybrid option

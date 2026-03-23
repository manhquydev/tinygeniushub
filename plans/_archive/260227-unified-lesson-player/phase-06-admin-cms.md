# Phase 6: Admin CMS

## Overview
- **Priority:** P2
- **Status:** pending
- **Effort:** 8h
- **Depends on:** Phase 1 + Phase 2

Add segment management UI to admin lesson editor.

## Context Links
- [admin-course-detail-client.tsx](../../src/app/(main)/admin/courses/[id]/admin-course-detail-client.tsx) — course detail admin page
- [Admin lesson API](../../src/app/api/admin/lessons/route.ts)
- [Admin lesson segments API](../../src/app/api/admin/lessons/[lessonId]/segments/route.ts) — created in Phase 2

## Key Insights
- No dedicated lesson editor page exists yet — lessons are managed via course detail page
- Need inline segment editor within course detail or a new lesson detail admin page
- Segments need: type selector, video URL input, step type selector, stepConfig JSON editor, activity picker
- Drag-to-reorder segments is essential for UX

## Architecture

### Admin UI components:
```
LessonSegmentEditor (main panel, ~180 lines)
├── SegmentListItem (single segment row with type badge, drag handle)
├── SegmentFormDialog (create/edit dialog with fields)
└── ActivityPicker (search + select existing Activity)
```

### Fields per segment type:

**Video segment:**
- videoUrl (text input)
- poster (text input, optional)
- phaseLabel (select: hook | concept | demonstrate)

**Interactive segment:**
- stepType (select: hook | concept | demonstrate | activity | reinforce | celebrate)
- stepConfig (JSON editor or structured form)
  - mascot: { variant, state, gesture?, actionProp? }
  - speech (text)
  - keyword (text)
  - subtext (text)
  - audioUrl (text)
  - autoAdvanceMs (number)
- activityId (activity picker, for activity/reinforce types)

### Lesson-level fields:
- conceptVideoUrl (text input)
- transitionAudioUrl (text input)

## Related Code Files

### Create
- `src/components/admin/lesson-segment-editor.tsx` — main segment management component
- `src/components/admin/lesson-segment-form-dialog.tsx` — create/edit segment dialog
- `src/components/admin/lesson-segment-list-item.tsx` — single segment in list

### Modify
- `src/app/(main)/admin/courses/[id]/admin-course-detail-client.tsx` — add segment editor section per lesson

## Implementation Steps

1. Create `lesson-segment-list-item.tsx`
   - Display: orderNo, type badge (video/interactive), stepType, drag handle
   - Actions: edit, delete
   - Props: segment, onEdit, onDelete

2. Create `lesson-segment-form-dialog.tsx`
   - Modal/dialog for creating or editing a segment
   - Dynamic fields based on type selection
   - Activity picker for interactive segments with activity type
   - JSON preview for stepConfig
   - Props: open, segment?, lessonId, onSave, onClose

3. Create `lesson-segment-editor.tsx`
   - Fetches segments for given lessonId via admin API
   - Renders ordered list of SegmentListItems
   - Add segment button -> opens form dialog
   - Drag-to-reorder with PATCH reorder API
   - Also shows conceptVideoUrl and transitionAudioUrl inputs
   - Props: lessonId

4. Integrate into admin-course-detail-client.tsx
   - For each lesson in course, add expandable segment editor section
   - Or add "Edit Segments" button that reveals LessonSegmentEditor

## TODO

- [ ] Create lesson-segment-list-item.tsx
- [ ] Create lesson-segment-form-dialog.tsx
- [ ] Create lesson-segment-editor.tsx
- [ ] Integrate into admin course detail page
- [ ] Test create/edit/delete/reorder segments
- [ ] Test activity picker
- [ ] Verify each file <200 lines

## Success Criteria
- Admin can create hybrid lessons with ordered segments
- Admin can set video URLs, step types, mascot configs
- Admin can link existing activities to interactive segments
- Drag-to-reorder works
- conceptVideoUrl and transitionAudioUrl editable

## Risk Assessment
- **Risk:** stepConfig JSON complexity — Mitigation: provide structured form for common fields, raw JSON fallback
- **Risk:** admin-course-detail-client.tsx already complex — Mitigation: LessonSegmentEditor is self-contained, minimal integration code

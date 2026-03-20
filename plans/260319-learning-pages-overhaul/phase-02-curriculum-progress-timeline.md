# Phase 02: Curriculum Progress Timeline

## Context Links
- Curriculum component: `src/app/(main)/courses/[slug]/course-detail-curriculum.tsx`
- Course detail page: `src/app/(main)/courses/[slug]/page.tsx`
- Phase 01 (dependency): `./phase-01-free-lesson-preview.md`

## Overview
- **Priority**: P1
- **Status**: pending
- **Description**: Add visual step progress indicator to curriculum list showing position via dots/line. Flat list (no unit grouping). Summary line showing free vs paid lesson counts.

## Key Insights
- Current curriculum is a plain flat list with no visual progress indicators
- `isPreview` flag (from Phase 1) determines which lessons are free
- No DB query changes needed — all data already available from Phase 1 additions
- Component is becoming client-side (Phase 1), so interactive progress dots are straightforward

## Requirements

### Functional
- Step progress indicator: `filled-dot -- filled-dot -- empty-dot -- empty-dot -- empty-dot` at top of curriculum
- Each dot corresponds to a lesson; filled = preview/free, empty = locked
- Summary text: "X bai dau mien phi . Y bai con lai sau khi mua"
- First lesson shows "Hoc thu" badge (from Phase 1), rest show lock

### Non-functional
- Responsive — dots should wrap or scroll on mobile for courses with many lessons
- Accessible — progress bar should have aria labels

## Related Code Files

### Files to Modify
1. `src/app/(main)/courses/[slug]/course-detail-curriculum.tsx` — add progress indicator + summary

### Files to Create
None — all changes fit within existing component (still under 200 lines after Phase 1 changes)

## Implementation Steps

### Step 1: Add progress dots component (inline)

At top of curriculum section, before the lesson list:

```tsx
// Count preview lessons
const previewCount = lessons.filter(l => l.lesson.isPreview).length;
const lockedCount = totalLessonCount - previewCount;

// Progress dots (show max ~12, with "+N more" if total > 12)
<div className="flex items-center gap-1 overflow-x-auto py-2" role="progressbar"
     aria-label={`${previewCount} bai mien phi, ${lockedCount} bai sau khi mua`}>
  {lessons.map((item, i) => (
    <Fragment key={item.id}>
      {i > 0 && <span className="h-px w-3 bg-slate-300 shrink-0" />}
      <span className={cn(
        "h-3 w-3 rounded-full shrink-0",
        item.lesson.isPreview
          ? "bg-emerald-500"
          : "bg-slate-300"
      )} />
    </Fragment>
  ))}
  {totalLessonCount > lessons.length && (
    <>
      <span className="h-px w-3 bg-slate-300 shrink-0" />
      <span className="text-xs text-slate-400 whitespace-nowrap">
        +{totalLessonCount - lessons.length}
      </span>
    </>
  )}
</div>
```

### Step 2: Add summary line

Below the progress dots:
```tsx
<p className="text-sm text-slate-600">
  <span className="font-semibold text-emerald-600">{previewCount} bai dau mien phi</span>
  {" . "}
  <span>{lockedCount} bai con lai sau khi mua</span>
</p>
```

### Step 3: Skip all visual indicators when `isOwned`

When user owns the course, show plain curriculum with no badges/locks/progress dots — they access all lessons in the player.

## Todo List
- [ ] Add preview count / locked count calculations
- [ ] Render progress dot timeline at top of curriculum
- [ ] Add summary text line
- [ ] Handle overflow for courses with 12+ lessons (horizontal scroll or truncate)
- [ ] Hide progress indicators when `isOwned`
- [ ] Add aria-label for accessibility
- [ ] Visual test on mobile viewport

## Success Criteria
- Dots render correctly matching lesson count
- Preview lessons = green dots, locked = gray dots
- Summary line shows correct counts
- Owned courses show clean curriculum without indicators
- Responsive on mobile

## Risk Assessment
- **Risk**: Courses with 50+ lessons make dots unreadable
  - **Mitigation**: Show first 12 dots + "+N more" text; `take: 12` already in query

---
status: pending
priority: P0
effort: 30m
---

# Phase 6: Dynamic Track Position Badge on Detail Hero

## Context
Detail hero (line 100-102 of `course-detail-hero.tsx`) shows hard-coded "Khóa học độc lập" badge. When a course belongs to a track (bundle), badge should instead show position info like "Khóa 2/5 — LF English".

## Key Insights
- `bundle` prop is already passed to `CourseDetailHero` (type `CourseBundleDefinition | null`)
- Track courses can be loaded via `getStorefrontCourses()` filtered by bundle slug (same pattern as `loadTrackCourses` in `page.tsx`)
- Position = index+1 in sorted track list (sorted by `compareTrackCourses`)
- Total = track courses count
- Track label = `bundleContent.shortLabel` or `bundle.title`

## Files to Modify
- `src/app/(main)/courses/[slug]/course-detail-hero.tsx` — replace badge text
- `src/app/(main)/courses/[slug]/page.tsx` — compute and pass `trackPosition` + `trackTotal` + `trackLabel`

## Architecture

### New Props for CourseDetailHero
```ts
trackPosition: number | null;  // 1-indexed position in track, null if no track
trackTotal: number | null;     // total courses in track
trackLabel: string | null;     // e.g. "LF English", "Abeka"
```

### Data Flow
1. In `page.tsx`, after loading track courses (already done for differenceCards), compute:
   - `trackPosition = idx + 1` (idx from `ordered.findIndex`)
   - `trackTotal = ordered.length`
   - `trackLabel = bundle.title`
2. Pass to `<CourseDetailHero>` as new props
3. In hero, replace badge:
   - If `trackPosition` exists: `Khóa {trackPosition}/{trackTotal} — {trackLabel}`
   - Else: keep "Khóa học độc lập"

## Implementation Steps

### Step 1: Compute Track Position in page.tsx
In the existing block where `differenceCards` is built (lines ~136-170), after `findIndex`:
```ts
const trackPosition = bundle && idx >= 0 ? idx + 1 : null;
const trackTotal = bundle ? ordered.length : null;
const trackLabel = bundle?.title ?? null;
```

### Step 2: Pass Props to Hero
Add `trackPosition`, `trackTotal`, `trackLabel` to `<CourseDetailHero>` call.

### Step 3: Update Hero Badge
In `course-detail-hero.tsx`:
- Add `trackPosition`, `trackTotal`, `trackLabel` to Props type
- Replace lines 100-102:
```tsx
<p className="inline-flex w-fit items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">
  {trackPosition && trackTotal && trackLabel
    ? `Khóa ${trackPosition}/${trackTotal} — ${trackLabel}`
    : "Khóa học độc lập"}
</p>
```

## Todo
- [ ] Compute `trackPosition`, `trackTotal`, `trackLabel` in detail page.tsx
- [ ] Pass new props to `CourseDetailHero`
- [ ] Update hero badge rendering
- [ ] Test with course in a bundle (shows position)
- [ ] Test with standalone course (shows "Khóa học độc lập")
- [ ] `npm run build` succeeds

## Success Criteria
- Course in Abeka track shows e.g. "Khóa 2/5 — Abeka"
- Standalone course shows "Khóa học độc lập"
- No layout shift

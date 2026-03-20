---
status: pending
priority: P1
effort: 1h
---

# Phase 9: Course Card Layout Simplification

## Context
Current `CourseCard` has visual noise from bordered boxes around "Kết quả" outcome statement (line 96-100) and "Giá khóa học" price block (line 103-115). Multiple bordered containers within a card create cluttered appearance. Need cleaner typography hierarchy.

## Key Insights from Current Code (`course-card.tsx`, 133 lines)
- Lines 95-100: Outcome statement wrapped in `rounded-xl border border-emerald-200 bg-emerald-50` box
- Lines 103-115: Price wrapped in `rounded-2xl border border-emerald-200 bg-emerald-50` box with "Giá khóa học" label
- Both use green bordered containers that compete visually with the card border itself
- The "Giá khóa học" label above price is unnecessary — price is self-evident
- CTA button already provides a strong visual anchor at bottom

## Files to Modify
- `src/components/courses/course-card.tsx`

## Implementation Steps

### Step 1: Simplify Outcome Statement
Replace bordered box with inline text + icon:
```
OLD (lines 95-100):
<div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
  <p className="text-xs font-semibold uppercase tracking-[0.06em] text-emerald-700">Kết quả</p>
  <p className="mt-1 text-sm leading-relaxed text-emerald-900">{outcomeStatement}</p>
</div>

NEW:
<p className="text-sm leading-relaxed text-emerald-800">
  <span className="font-semibold">Kết quả:</span> {outcomeStatement}
</p>
```

### Step 2: Simplify Price Block
Replace bordered box with clean inline price:
```
OLD (lines 103-115):
<div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2">
  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-700">Giá khóa học</p>
  <div className="mt-1 flex items-end gap-2">
    <p className="text-2xl font-black tracking-[-0.02em] text-emerald-700">...</p>
    ...
  </div>
</div>

NEW:
<div className="flex items-end gap-2">
  <p className="text-xl font-black tracking-[-0.02em] text-emerald-700">
    {formatCurrency(course.pricing.salePriceVnd)}
  </p>
  {course.pricing.hasDiscount ? (
    <p className="pb-0.5 text-xs text-slate-400 line-through">
      {formatCurrency(course.pricing.listPriceVnd)}
    </p>
  ) : null}
</div>
```

Changes: removed container box, removed "Giá khóa học" label, reduced price font from `text-2xl` to `text-xl`, muted the strikethrough color.

### Step 3: Adjust Card Padding/Gap
The card body `<div className="grid gap-3 p-4 sm:p-5">` may need gap reduced to `gap-2.5` since removing boxes saves vertical space.

### Step 4: Verify Visual Hierarchy
After changes, visual order from top to bottom should be:
1. Cover image (with lesson count + age badges)
2. Track label (if bundle) + Title + Description
3. Rating + enrollment row
4. Outcome statement (inline, no box)
5. Price (inline, no box)
6. CTA button

## Todo
- [ ] Remove bordered box from outcome statement
- [ ] Remove bordered box from price block
- [ ] Remove "Giá khóa học" label
- [ ] Reduce price font size slightly
- [ ] Optionally tighten gap
- [ ] Test with all card variations (with/without outcome, with/without discount, with/without rating)
- [ ] `npm run build` succeeds

## Success Criteria
- Card has only one visual container (the card itself)
- No nested bordered boxes inside card body
- Price is clearly visible without a label
- Outcome reads as inline text, not a callout box
- Overall card feels lighter with less visual weight
- No layout breaks on mobile or desktop

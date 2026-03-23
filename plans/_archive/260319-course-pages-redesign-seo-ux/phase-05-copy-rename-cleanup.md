---
status: pending
priority: P0
effort: 30m
---

# Phase 5: Parent-Friendly Copy Rename + Section Removal

## Context
Listing page headings use developer/internal jargon ("Compare strip", "Quick-fit filters") that parents don't understand. Bottom "Vì sao phụ huynh dễ quyết định hơn?" section adds no conversion value and lengthens page.

## Files to Modify
- `src/app/(main)/courses/page.tsx`

## Implementation Steps

### Step 1: Rename Compare Strip Heading (line ~197)
```
OLD: <h2 ...>Compare strip: 3 track hiện có</h2>
NEW: <h2 ...>3 lộ trình — khác nhau ở điểm gì?</h2>
```
Also remove the right-side `<p>` tag "Abeka / LF EN / LF CN" (line ~198) — redundant since track labels appear in each card.

### Step 2: Rename Quick-Fit Filters Heading (line ~227)
```
OLD: <h2 ...>Quick-fit filters</h2>
NEW: <h2 ...>Tìm khóa phù hợp với con</h2>
```

### Step 3: Remove Bottom "Vì sao phụ huynh dễ quyết định hơn?" Section
Delete entire `<section>` block at lines ~355-387 (the 3-column grid with BookOpen, BarChart3, ShieldCheck icons). Also remove unused imports `BookOpen`, `BarChart3`, `ShieldCheck` from lucide-react if no longer used elsewhere in file.

Check that `BarChart3`, `BookOpen`, `ShieldCheck` are not used elsewhere in the file before removing imports.

## Todo
- [ ] Rename compare strip heading to "3 lộ trình — khác nhau ở điểm gì?"
- [ ] Remove "Abeka / LF EN / LF CN" subtitle from compare strip
- [ ] Rename quick-fit filters heading to "Tìm khóa phù hợp với con"
- [ ] Remove "Vì sao phụ huynh dễ quyết định hơn?" section
- [ ] Remove unused icon imports
- [ ] `npm run build` succeeds

## Success Criteria
- All headings use parent-friendly Vietnamese
- No internal/developer jargon visible on listing page
- Page is shorter (one full section removed)
- Build passes, no regressions

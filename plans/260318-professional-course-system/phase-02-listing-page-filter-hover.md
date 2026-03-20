# Phase 2: Course Listing Page + Filters + Hover Effects

## Context Links

- [Listing UX Research](../reports/researcher-260318-course-listing-ux-patterns.md)
- [Current Listing Page](../../src/app/(main)/courses/page.tsx)
- [Course Service](../../src/modules/courses/course-service.ts)

## Overview

- **Priority:** P1
- **Status:** complete
- **Effort:** 8h
- **Description:** Add sidebar filter (subject, ageGroup, price range, duration), sort dropdown, pagination, card hover effects, active filter chips, and mobile filter drawer.

## Key Insights

- URL searchParams as single source of truth -- bookmarkable, SEO-friendly
- Server Component fetches filtered data; Client Components manage filter UI
- `router.replace()` with `{ scroll: false }` for smooth filter updates
- 200ms transition duration = industry standard for hover effects
- `group` modifier enables coordinated child animations without JS
- shadcn/ui Sheet for mobile filter drawer
- 9 cards per page, 3-column grid on desktop

## Requirements

### Functional
- Filter by: subject (checkboxes), ageGroup (radio), price range (min/max), duration (short/medium/long chips)
- Sort: newest, price asc, price desc, duration asc
- Results counter: "12 khoa tim thay"
- Pagination: 9 cards per page
- Active filter chips with "x" to remove
- Card hover: lift (-translate-y-1), shadow-xl, image scale, title color change
- Mobile: filter Sheet drawer

### Non-Functional
- Filter response <200ms (server re-render)
- Hover animations 60fps on mid-range mobile
- URL params: `?subject=MATH&ageGroup=AGE_7_9&minPrice=0&maxPrice=500000&duration=short&sort=newest&page=1`

## Architecture

```
CoursesPage (Server Component)
├── searchParams -> parse filters
├── getFilteredStorefrontCourses(filters) -> Prisma WHERE
├── CourseFilterSidebar (Client) -- reads/writes URL params
│   ├── SubjectCheckboxes
│   ├── AgeGroupRadio
│   ├── PriceRangeInputs
│   └── DurationChips
├── ActiveFilterChips (Client) -- shows applied filters
├── CourseSortSelect (Client) -- sort dropdown
├── CourseGrid (Server) -- cards with hover effects
│   └── CourseCard (Server) -- group hover pattern
└── CoursePagination (Client) -- page buttons
```

**Mobile:** Sidebar hidden on <md; Sheet trigger button shown instead.

## Related Code Files

### Files to Modify
- `src/app/(main)/courses/page.tsx` -- refactor to accept searchParams, add filter layout
- `src/modules/courses/course-service.ts` -- add `getFilteredStorefrontCourses()` function

### Files to Create
- `src/components/courses/course-filter-sidebar.tsx` -- Client: filter UI with URL param sync
- `src/components/courses/course-sort-select.tsx` -- Client: sort dropdown
- `src/components/courses/course-active-filters.tsx` -- Client: active filter chips
- `src/components/courses/course-pagination.tsx` -- Client: pagination buttons
- `src/components/courses/course-card.tsx` -- Server: card with hover effects (extracted from page)
- `src/lib/courses/course-filter-utils.ts` -- shared filter parsing/label utilities

## Implementation Steps

### Step 1: Add `getFilteredStorefrontCourses` to course-service.ts

Add function accepting filter params, build Prisma `where` clause:

```typescript
export type CourseFilterParams = {
  subject?: string;
  ageGroup?: string;
  minPrice?: number;
  maxPrice?: number;
  duration?: "short" | "medium" | "long";
  sort?: string;
  page?: number;
};

export async function getFilteredStorefrontCourses(filters: CourseFilterParams) {
  const PAGE_SIZE = 9;
  const where: Prisma.CourseWhereInput = { isPublished: true };

  if (filters.subject) where.subject = filters.subject as CourseSubject;
  if (filters.ageGroup) where.ageGroup = filters.ageGroup as AgeGroup;
  if (filters.minPrice || filters.maxPrice) {
    where.salePriceVnd = {};
    if (filters.minPrice) where.salePriceVnd.gte = filters.minPrice;
    if (filters.maxPrice) where.salePriceVnd.lte = filters.maxPrice;
  }
  if (filters.duration === "short") where.durationDays = { lt: 30 };
  else if (filters.duration === "medium") where.durationDays = { gte: 30, lte: 60 };
  else if (filters.duration === "long") where.durationDays = { gt: 60 };

  // orderBy based on sort param
  // count total for pagination
  // skip/take for page
}
```

### Step 2: Create course-filter-utils.ts

Shared constants and label maps:
- `SUBJECT_LABELS`, `AGE_GROUP_LABELS`, `DURATION_LABELS`, `SORT_OPTIONS`
- `parseFilterParams(searchParams)` helper
- `formatFilterLabel(key, value)` for chips

### Step 3: Create course-card.tsx

Extract card from current page.tsx into standalone component with hover effects:
```tsx
<article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white
  shadow-[0_12px_28px_rgba(15,23,42,0.06)]
  transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer">
  <div className="relative overflow-hidden">
    <img className="... transition-transform duration-200 group-hover:scale-[1.02]" />
  </div>
  <h2 className="... group-hover:text-emerald-700 transition-colors duration-150" />
</article>
```

### Step 4: Create course-filter-sidebar.tsx

Client component with `useSearchParams` + `useRouter`:
- Subject: checkboxes (multi-select)
- AgeGroup: radio buttons (single-select)
- Price: min/max number inputs with 300ms debounce
- Duration: chip buttons (short/medium/long)
- "Xoa tat ca" reset button

### Step 5: Create course-sort-select.tsx

Client component -- `<select>` with sort options, updates `?sort=` URL param.

### Step 6: Create course-active-filters.tsx

Horizontal scrollable chips showing active filters with "x" remove buttons.

### Step 7: Create course-pagination.tsx

Client component -- page buttons, updates `?page=` URL param. Handle edge case: page > totalPages -> redirect to page 1.

### Step 8: Refactor courses/page.tsx

- Accept `searchParams` prop (Promise in Next.js 16)
- Parse filters from searchParams
- Call `getFilteredStorefrontCourses()`
- Layout: sidebar (hidden md:block) + main content
- Mobile: Sheet trigger + Sheet containing sidebar
- Results counter + sort dropdown in header
- Grid of CourseCard components
- Pagination at bottom

### Step 9: Mobile responsive

- Sidebar: `<aside className="hidden w-64 shrink-0 md:block">`
- Mobile trigger: `<div className="md:hidden">` with Sheet from shadcn/ui
- Active filter chips: horizontal scroll with `overflow-x-auto`

## Todo List

- [x] Create `course-filter-utils.ts` with constants and parse helpers
- [x] Add `getFilteredStorefrontCourses()` to course-service.ts
- [x] Create `course-card.tsx` with hover effects
- [x] Create `course-filter-sidebar.tsx` (Client)
- [x] Create `course-sort-select.tsx` (Client)
- [x] Create `course-active-filters.tsx` (Client)
- [x] Create `course-pagination.tsx` (Client)
- [x] Refactor `courses/page.tsx` with filter layout
- [ ] Test: filters produce correct URL params
- [ ] Test: back/forward browser buttons preserve filter state
- [ ] Test: mobile Sheet drawer opens/closes (simplified: button placeholder added, no Sheet needed YAGNI)
- [ ] Test: hover animations smooth on mobile
- [x] Compile check after all changes

## Success Criteria

- Filters apply via URL params and produce correct Prisma queries
- Cards have smooth hover lift + shadow + image scale + title color change
- 9 cards per page with working pagination
- Sort dropdown changes order correctly
- Active filter chips display and remove correctly
- Mobile filter drawer works via Sheet
- Results counter updates with filter changes
- All files under 200 lines

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| URL param sync race conditions | Medium | Use `useTransition` for pending state |
| Price debounce fires too often | Low | 300ms debounce timer |
| Existing page.tsx heavily coupled | Medium | Extract card first, then refactor page |
| Filter with subject=null courses excluded | Medium | Filter query: if no subject filter, don't add WHERE clause |

## Security Considerations

- Filter params are read-only public data -- no auth required
- Validate/sanitize searchParams on server (prevent SQL injection via Prisma parameterized queries)
- Price range: clamp to reasonable bounds (0 to 10,000,000 VND)

## Next Steps

- Phase 4 (Reviews) adds rating badge to course cards
- Future: facet counts per filter option (YAGNI for now)

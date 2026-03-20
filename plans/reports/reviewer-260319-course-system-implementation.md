# Code Review Report — Course System Implementation

**Date:** 2026-03-19
**Reviewer:** code-reviewer
**Scope:** 6 files — 4 modified, 2 new

---

## Code Review Summary

### Scope
- Files reviewed: 6
- Lines of code analyzed: ~650
- Review focus: Modified + new course listing/detail components

### Overall Assessment
Code is generally clean, well-structured, and follows the project's Tailwind + shadcn/ui conventions. A/B testing and analytics tracking are intact. No critical security vulnerabilities. Found 2 high-priority accessibility issues, 1 medium-priority logic concern, and several low-priority observations.

---

## Critical Issues

None.

---

## High Priority Findings

### H1 — `CourseDetailStickyHeader` focusable when off-screen (keyboard trap risk)

**File:** `src/components/courses/course-detail-sticky-header.tsx` (line 43)

The sticky bar uses CSS `translate-y-full` to hide itself off-screen when `visible === false`. On `lg+`, when invisible, the bar is NOT in the accessibility tree barrier — tab focus can still reach the `Link` and `CourseCheckoutButton` inside it. Keyboard users will unknowingly tab into elements that are visually hidden above the viewport.

**Fix:** Add `aria-hidden={!visible}` to the outer `<div>`. This removes the subtree from the AT tree when invisible, preventing focus from landing on its children.

```tsx
<div
  aria-hidden={!visible}
  className={`fixed left-0 right-0 top-0 z-40 ...`}
>
```

---

### H2 — `CourseMobileFilterTrigger` trigger button missing `type="button"`

**File:** `src/components/courses/course-mobile-filter-trigger.tsx` (line 18)

The `<button>` has no explicit `type`. HTML default is `type="submit"`, which would submit any ancestor `<form>` if the component is ever moved into a form context. Explicit `type="button"` is required for non-submit buttons per HTML spec.

```tsx
<button type="button" className="...">
```

---

## Medium Priority Improvements

### M1 — `activeDbFilterCount` uses `filter(Boolean)` on numeric values

**File:** `src/app/(main)/courses/page.tsx` (line 163)

```ts
const activeDbFilterCount = [
  dbFilters.subject, dbFilters.ageGroup, dbFilters.minPrice,
  dbFilters.maxPrice, dbFilters.duration
].filter(Boolean).length;
```

`minPrice`/`maxPrice` are `number | undefined`. `filter(Boolean)` correctly drops `undefined` but would also drop the value `0` (falsy). `parseFilterParams` already normalizes `<= 0` to `undefined` so `0` never appears — but the intent is not obvious. Use explicit check for clarity:

```ts
.filter((v) => v !== undefined && v !== null)
```

### M2 — Two instances of `CourseFilterSidebar` have independent local state

**Files:** `src/app/(main)/courses/page.tsx` (line 290), `src/components/courses/course-mobile-filter-trigger.tsx` (line 33)

`CourseFilterSidebar` is a client component with local `minPrice`/`maxPrice` state. It is rendered twice — once in the desktop aside, once inside the Sheet portal. Both instances hydrate from the same `currentFilters` prop, but after hydration, changes to price inputs in one instance are NOT reflected in the other. This is acceptable UX (mobile drawer vs desktop sidebar) since they are never visible simultaneously, but worth documenting to avoid confusion for future maintainers.

---

## Low Priority Suggestions

### L1 — `Promise.all` wrapping a single `cookies()` call is misleading

**File:** `src/app/(main)/courses/page.tsx` (line 114)

```ts
const [cookieStore] = await Promise.all([cookies()]);
```

Single-element `Promise.all` provides no concurrency benefit. Simplify:

```ts
const cookieStore = await cookies();
```

### L2 — `formatCurrency` duplicated across two files

**Files:** `src/app/(main)/courses/[slug]/course-detail-data.ts` (line 238), `src/components/courses/course-detail-sticky-header.tsx` (line 8)

Same 2-line function defined twice. DRY violation. Extract to `src/lib/courses/course-format-utils.ts`.

### L3 — Empty `<div className="mb-4">` rendered on desktop

**File:** `src/app/(main)/courses/page.tsx` (line 295)

The `<div className="mb-4">` wrapping `CourseMobileFilterTrigger` always renders. `CourseMobileFilterTrigger` returns a `<div className="md:hidden">` — on `md+`, the outer div renders a visible 16px bottom margin against no content. Move the `md:hidden` to the call-site wrapper or accept the minor layout gap.

### L4 — `<article>` for compare track cards is a semantic mismatch

**File:** `src/app/(main)/courses/page.tsx` (line 204)

A compare track card is a comparison fragment, not a self-contained redistributable article. Use `<div>` instead. Minor.

### L5 — `CourseCard` uses raw `course.coverImageUrl` but detail page uses `resolveCourseCoverImage`

**File:** `src/components/courses/course-card.tsx` (line 44)

`CourseDetailHero` normalizes cover URLs via `resolveCourseCoverImage`. `CourseCard` uses the raw DB URL directly. If `StorefrontCourse.coverImageUrl` is already normalized at the service layer, this is fine. If not, card images may differ from detail-page images or break in some environments. Verify at `getStorefrontCourses()`.

### L6 — `trackPosition && trackTotal && trackLabel` badge guard — add comment on intentional `0` edge

**File:** `src/app/(main)/courses/[slug]/course-detail-hero.tsx` (line 107)

`trackPosition` is computed as `idx + 1`, so `0` only occurs if `idx === -1` (course not found in track). The falsy guard on `0` is then intentionally correct, falling back to "Khóa học độc lập". Add a brief comment so future readers don't change the guard to `!== null`.

---

## Positive Observations

- A/B variant correctly read from cookie and threaded to all tracking components without mutation.
- `CourseCatalogViewTracker`, `CompareStripViewTracker`, `BundleDetailViewTracker` all present and correctly placed.
- `parseFilterParams` validates all user inputs — no raw strings reach Prisma queries.
- `trackPosition`/`trackTotal` computation uses `findIndex` on sorted array with `idx >= 0` guard correctly.
- Type-safe null filter: `filter((c): c is NonNullable<typeof c> => c !== null)` on difference cards.
- Scroll listener uses `{ passive: true }` — correct for scroll performance.
- `SheetTitle` present in `SheetHeader` — required for sheet dialog accessibility.
- Full-card overlay `<Link>` in `CourseCard` includes `aria-label` — correct pattern.
- `loadPublishedCourse` uses `cache()` — prevents duplicate DB calls within a single render tree.

---

## Recommended Actions

1. **[High]** Add `aria-hidden={!visible}` to `CourseDetailStickyHeader` outer div.
2. **[High]** Add `type="button"` to the trigger button in `CourseMobileFilterTrigger`.
3. **[Medium]** Replace `filter(Boolean)` with `filter((v) => v !== undefined)` in `activeDbFilterCount`.
4. **[Low]** Remove unnecessary `Promise.all` wrapper around single `cookies()`.
5. **[Low]** Extract `formatCurrency` to a shared util.
6. **[Low]** Verify `StorefrontCourse.coverImageUrl` normalization at service layer.
7. **[Low]** Add comment to `trackPosition && trackTotal && trackLabel` guard re: intentional `0` fallback.

---

## Metrics
- Type Coverage: No new `any` types. All new props fully typed.
- Test Coverage: Not in scope.
- Linting Issues: 1 missing `type="button"`; 1 DRY (`formatCurrency`).

---

## Unresolved Questions

1. Is `StorefrontCourse.coverImageUrl` pre-normalized by `getStorefrontCourses()` via `resolveCourseCoverImage`? If yes, L5 is a non-issue.
2. Is `inert` HTML attribute safe in the project's target browser matrix? If yes, it is a cleaner H1 fix than `aria-hidden` alone.

---
status: pending
priority: P1
effort: 1.5h
---

# Phase 8: Sticky Mini-Header on Course Detail Page (Scroll-Triggered)

## Context
When user scrolls past the hero on detail page, they lose sight of course title, price, and CTA. A scroll-triggered mini-header provides persistent context and reduces scroll-back friction. Mobile already has a sticky bottom CTA bar (from phase 4), so this mini-header is **desktop-only**.

## Key Insights
- Desktop sidebar already has `sticky top-6` with price + CTA, but it scrolls off when user reaches curriculum/reviews sections (sidebar ends)
- Mini-header sits at top of viewport, shows: title (truncated) + price + CTA button
- Trigger: appears when hero section scrolls out of viewport (IntersectionObserver)
- Must not interfere with existing `BundleDetailViewTracker` or other analytics

## Files to Create
- `src/components/courses/course-detail-sticky-header.tsx` — client component

## Files to Modify
- `src/app/(main)/courses/[slug]/page.tsx` — add ref to hero, render sticky header

## Architecture

### CourseDetailStickyHeader (client component)
```tsx
"use client";
// Props: title, salePriceVnd, courseSlug, checkoutLabel, isOwned, isAuthenticated, variant
// Uses IntersectionObserver on a sentinel ref passed via prop or rendered internally
// Shows/hides based on whether hero is in viewport
```

### Sentinel Pattern
- Add an invisible `<div ref={sentinelRef}>` at top of hero section
- IntersectionObserver watches sentinel; when it leaves viewport, show mini-header
- When sentinel re-enters viewport, hide mini-header

### Since `page.tsx` is a server component:
- Wrap hero + sticky header in a thin client component OR
- Simpler: make `CourseDetailStickyHeader` self-contained with its own scroll listener (checks `scrollY > threshold`) — avoids ref threading through server/client boundary

### Recommended: Self-contained scroll approach
```tsx
// Inside CourseDetailStickyHeader:
const [visible, setVisible] = useState(false);
useEffect(() => {
  const onScroll = () => setVisible(window.scrollY > 400);
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}, []);
```

400px threshold approximates hero height. Good enough; no ref threading needed.

## Implementation Steps

### Step 1: Create CourseDetailStickyHeader
File: `src/components/courses/course-detail-sticky-header.tsx`

Props:
```ts
type Props = {
  title: string;
  salePriceVnd: number;
  courseSlug: string;
  checkoutLabel: string;
  isOwned: boolean;
  isAuthenticated: boolean;
  variant: AbVariant;
};
```

Render (hidden on mobile via `hidden lg:flex`):
```tsx
<div className={cn(
  "fixed top-0 left-0 right-0 z-40 hidden lg:flex items-center justify-between gap-4",
  "border-b border-slate-200 bg-white/95 px-6 py-3 backdrop-blur",
  "transition-transform duration-300",
  visible ? "translate-y-0" : "-translate-y-full"
)}>
  <div className="flex items-center gap-3 min-w-0">
    <h2 className="truncate text-sm font-bold text-slate-900">{title}</h2>
    <p className="shrink-0 text-sm font-black text-emerald-700">
      {formatCurrency(salePriceVnd)}
    </p>
  </div>
  {!isOwned ? (
    <CourseCheckoutButton
      courseSlug={courseSlug}
      label={checkoutLabel}
      priceVnd={salePriceVnd}
      isAuthenticated={isAuthenticated}
      tracking={{ variant, bundleSlug: courseSlug }}
    />
  ) : (
    <Link href={`/kid/courses/${courseSlug}`} className="solid-button text-sm">
      Vào học ngay
    </Link>
  )}
</div>
```

### Step 2: Add to Detail Page
In `src/app/(main)/courses/[slug]/page.tsx`, after `<CourseBreadcrumb>`:
```tsx
<CourseDetailStickyHeader
  title={course.title}
  salePriceVnd={pricing.salePriceVnd}
  courseSlug={course.slug}
  checkoutLabel={checkoutLabel}
  isOwned={isOwned}
  isAuthenticated={Boolean(parent)}
  variant={coursesVariant}
/>
```

## Todo
- [ ] Create `src/components/courses/course-detail-sticky-header.tsx`
- [ ] Add component to detail page after breadcrumb
- [ ] Test: scroll down past hero -> header slides in
- [ ] Test: scroll back to top -> header slides out
- [ ] Verify desktop-only (hidden on mobile via `hidden lg:flex`)
- [ ] Verify CTA button works (checkout flow + analytics tracking)
- [ ] `npm run build` succeeds

## Success Criteria
- Mini-header appears on desktop when hero is off-screen
- Shows truncated course title + price + CTA
- Smooth slide-in/out animation (300ms transition)
- Hidden on mobile (mobile has its own sticky bottom CTA)
- Checkout button triggers same flow as main CTA
- No z-index conflicts with nav or modals

## Risk Assessment
- Risk: z-index conflict with main nav — use z-40 (below Sheet z-50, below nav if nav uses z-50)
- Risk: scroll listener performance — mitigated by `{ passive: true }`
- Risk: `CourseCheckoutButton` may trigger tracking twice — acceptable since it's a different position; analytics already tracks position

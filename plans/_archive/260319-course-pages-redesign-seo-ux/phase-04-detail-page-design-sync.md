---
status: partial
priority: P2
effort: 3h
---

# Phase 4: Detail Page UX + Design Sync

## Context
- Course detail page CTA (checkout button) is in right sidebar, below fold on mobile
- Parents on mobile may bounce before seeing the buy button
- /pricing and /parent/courses pages have different visual language from /courses
- Need FAQ section on course detail for parent objection handling

## Key Insights
- Vietnam market: 70%+ mobile traffic -> CTA must be above fold on mobile
- Parent testimonials and trust signals reduce friction more than feature lists
- /pricing page currently has no course cards, just links to /courses
- /parent/courses cards lack age badge, rating, outcome -> inconsistent with storefront

## Files to Modify
- `src/components/courses/course-detail-sidebar.tsx` - Add mobile sticky CTA
- `src/app/(main)/pricing/page.tsx` - Add inline course cards, sync visual language
- `src/app/(main)/parent/courses/page.tsx` - Add age badge, rating to enrolled course cards

## Files to Create
- `src/app/(main)/courses/[slug]/course-detail-faq.tsx` - FAQ section for parent objections

## Key Insights (from UI/UX Audit)
- **Fit checklist is below fold** (2-3 scrolls) — critical for decision making, must move up
- **Mobile filter "Bộ lọc" button non-functional** — shows badge but no interaction
- **CTA copy misaligned with confidence levels** — evaluating user vs. buying user need different CTAs
- **parentProblem + parentVisibleValue** from storefront-content not surfaced in listing page
- **Section ordering on listing**: hero metrics not decision-relevant, should be condensed

## Implementation Steps

### Step 0: Reorder Detail Page Sections (High Priority)
In `src/app/(main)/courses/[slug]/page.tsx`:
- Move **Fit Checklist** to immediately after hero (before Difference Block)
- Current order: Hero → Difference → Outcome → Curriculum → Reviews → Related → Support
- New order: Hero → **Fit Checklist** → Difference → Outcome → Curriculum → Reviews → Related → Support
- Fit checklist answers "Is this for my child?" — must be above the fold decision

### Step 0b: Fix Mobile Filter Toggle on Listing Page
In `src/app/(main)/courses/page.tsx`:
- "Bộ lọc" badge on mobile (`md:hidden`) currently has no interaction
- Add a modal/sheet for mobile filters, or connect to existing sidebar state
- Use same approach as quick-fit filters (client component state)

### Step 1: Mobile Sticky CTA on Detail Page
In `src/components/courses/course-detail-sidebar.tsx`:
- Add a fixed-bottom CTA bar on mobile (`lg:hidden`): price + "Mua khoa hoc" button
- Uses `fixed bottom-0 left-0 right-0` with `z-50`, bg-white, border-top, safe-area padding
- Only show when user scrolls past the main CTA (use CSS-only approach or simple state)
- Hide when `isOwned` is true

### Step 2: Add Trust Signals to Detail Hero
In the hero section (now modularized in Phase 2 as `course-detail-hero.tsx`):
- Add enrollment count: "156 phu huynh da chon khoa nay"
- Add rating: stars + count (when available)
- Add trust badges: "Hoan tien 30 ngay" + "Kich hoat tu dong"
- Pass `enrollmentCount` and rating data from page to hero

### Step 3: Create Course Detail FAQ Section
File: `src/app/(main)/courses/[slug]/course-detail-faq.tsx`

Props: `bundleSlug: CourseBundleSlug | null`

Default FAQ items (Vietnamese parent objections):
1. "Con toi co the hoc duoc khong?" -> age-appropriate reassurance
2. "Phu huynh can ho tro nhieu khong?" -> self-paced learning explanation
3. "Neu khoa khong phu hop thi sao?" -> 30-day refund policy
4. "Khac gi hoc tren YouTube?" -> structured curriculum advantage
5. "Lam sao theo doi tien do?" -> dashboard + weekly checkpoints

Bundle-specific FAQ: override 1-2 items based on `bundleSlug` (e.g., Abeka has grade-level questions).

Render as `<details>/<summary>` elements (same pattern as pricing page FAQ).

### Step 4: Sync /pricing Page with Course Visual Language
In `src/app/(main)/pricing/page.tsx`:
- Replace "Cac khoa hoc dang mo" text-only section with actual course cards
- Import `getStorefrontCourses` and render simplified price cards (title, price, lesson count, CTA)
- Keep existing FAQ and conversion points sections
- Match border-radius, shadow, color tokens with /courses page

### Step 5: Sync /parent/courses Cards
In `src/app/(main)/parent/courses/page.tsx`:
- Add age badge to enrolled course cards (when `ageGroup` available on course)
- Show completion percentage if available
- Match card border-radius, shadow style with storefront `CourseCard`
- Need to extend `getParentEnrollments` to include `ageGroup` in course select

### Step 6: Add FAQ to Detail Page Composition
In `src/app/(main)/courses/[slug]/page.tsx`:
- Import and render `<CourseDetailFaq>` between reviews and support sections
- Pass `bundleSlug`

## Todo
- [x] Add mobile sticky CTA to `course-detail-sidebar.tsx`
- [x] Add trust signals + enrollment count to detail hero (partial — enrollment count + rating added; explicit "Hoàn tiền 30 ngày" badge missing)
- [x] Create `course-detail-faq.tsx` with parent objection FAQs
- [x] Add FAQ to detail page composition
- [ ] Add course price cards to /pricing page
- [ ] Sync /parent/courses card design with storefront cards
- [ ] Extend `getParentEnrollments` to include `ageGroup`
- [ ] Test mobile sticky CTA on various screen sizes
- [ ] Verify all 3 pages use consistent visual tokens
- [ ] Fix mobile sticky CTA content overlap (add pb-20 lg:pb-0 to detail page wrapper)
- [ ] Fix mobile sticky CTA iOS safe-area inset (pb-[env(safe-area-inset-bottom)])
- [ ] Fix mobile "Bộ lọc" button (Step 0b) — still non-interactive placeholder
- [ ] Add bundleSlug prop to CourseDetailFaq for bundle-specific overrides

## Success Criteria
- CTA visible above fold on mobile (375px width)
- FAQ section renders on all course detail pages
- /pricing shows actual course prices (not just links)
- /parent/courses cards match storefront card style
- `npm run build` succeeds
- No horizontal overflow on mobile

## Risk Assessment
- Risk: mobile sticky CTA overlaps page content -> add `pb-20` to page wrapper on mobile
- Risk: /pricing page becomes too long -> keep course cards compact (no decision rows)
- Risk: /parent/courses query change adds load -> ageGroup is a single column, negligible cost

## Security Considerations
- No auth changes; /parent/courses already requires parent auth via `requireParent()`
- Course pricing data is public; no sensitive data exposed

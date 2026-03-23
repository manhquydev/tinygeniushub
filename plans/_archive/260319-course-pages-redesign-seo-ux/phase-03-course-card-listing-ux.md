---
status: completed
priority: P1
effort: 4h
---

# Phase 3: Course Card + Listing UX

## Context
- Current course card shows: cover image, lesson count badge, title, description, decision rows (5 questions), duration/lesson stats, price, CTA
- Missing: age group badge, rating stars, enrollment count, outcome statement, time commitment per week
- Listing page hero is conversion-focused but lacks SEO-friendly value prop for organic landing

## Key Insights
- Parents Google: "khoa hoc tieng Anh cho be 5 tuoi" -> age badge is critical for SEO + scanning
- Social proof (enrollment count, rating) reduces decision friction
- Outcome statement ("Con doc duoc truyen tieng Anh sau 8 tuan") converts better than feature lists
- Current `StorefrontCourse` type lacks rating/ageGroup; need to extend

## Files to Modify
- `src/modules/courses/course-service.ts` - Extend `StorefrontCourse` type + query
- `src/components/courses/course-card.tsx` - Add age badge, rating, enrollment, outcome
- `src/app/(main)/courses/page.tsx` - Improve hero copy for SEO, pass new data

## Architecture

### Extended StorefrontCourse Type
Add to existing `StorefrontCourse`:
```ts
reviewAverageRating: number | null;
reviewCount: number;
ageGroup: string | null;     // from Course.ageGroup
enrollmentCount: number;     // derived from _count.enrollments
```

### Data Flow
1. `getStorefrontCourses` + `getFilteredStorefrontCourses` add `reviewAverageRating`, `reviewCount`, `ageGroup`, `_count.enrollments` to select
2. `CourseCard` receives extended data and renders new badges
3. `BundleStorefrontContent` already has `outcomes[]` -> use `outcomes[0]` as outcome statement on card

## Implementation Steps

### Step 1: Extend StorefrontCourse Query
In `src/modules/courses/course-service.ts`:
- Add `reviewAverageRating`, `reviewCount`, `ageGroup` to select clause
- Add `_count: { select: { enrollments: true } }` alongside existing `_count.lessons`
- Map `enrollmentCount: row._count.enrollments` in return

### Step 2: Extend CourseCard Props + Render

Add to `CourseCardProps`:
```ts
reviewAverageRating: number | null;
reviewCount: number;
ageGroup: string | null;
enrollmentCount: number;
outcomeStatement: string | null;
```

New UI elements (order top to bottom):
1. **Age badge** (top-right of cover image): "4-6 tuoi" / "7-9 tuoi" / "10-12 tuoi" - derive from `ageGroup` enum
2. **Rating + enrollment row** (below title): "4.8 (12 danh gia) - 156 phu huynh da mua"
3. **Outcome statement** (above decision rows): green highlight, e.g. "Ket qua: Con doc duoc truyen tieng Anh sau 8 tuan"
4. Keep existing decision rows, duration/lessons, price, CTA

### Step 3: Create Age Group Display Helper
File: `src/lib/courses/course-age-display.ts`
```ts
export function formatAgeGroupLabel(ageGroup: string | null): string | null
// Maps AgeGroup enum values to Vietnamese labels
```

### Step 4: Update Listing Page Hero for SEO
In `src/app/(main)/courses/page.tsx`:
- Add SEO-friendly subtitle below h1: "Khoa hoc truc tuyen cho be 4-12 tuoi: phonics, tieng Anh, tieng Trung voi lo trinh ro rang"
- This text targets long-tail Vietnamese keywords
- Pass `enrollmentCount`, `rating`, `ageGroup`, `outcomeStatement` to CourseCard

### Step 5: Update Courses Page to Pass New Props
- Derive `outcomeStatement` from `getBundleStorefrontContent(bundleSlug).outcomes[0]`
- Pass all new fields to `<CourseCard>` component

## Todo
- [ ] Extend `StorefrontCourse` type with rating, ageGroup, enrollmentCount
- [ ] Update `getStorefrontCourses` + `getFilteredStorefrontCourses` queries
- [ ] Create `src/lib/courses/course-age-display.ts`
- [ ] Update `CourseCard` with age badge, rating row, outcome statement
- [ ] Update listing page hero with SEO subtitle
- [ ] Pass new props through courses page
- [ ] Verify cards render correctly with null/zero values (no reviews, no age group)

## Success Criteria
- Course cards show age badge when ageGroup is set
- Rating + enrollment count visible on cards (hidden when 0)
- Outcome statement visible on cards with bundle content
- `npm run build` succeeds
- No layout shift or visual regression on mobile

## Risk Assessment
- Risk: courses with no reviews show empty rating -> hide rating row when `reviewCount === 0`
- Risk: courses with no ageGroup -> hide age badge gracefully
- Risk: `_count.enrollments` adds query cost -> minimal, Prisma handles efficiently

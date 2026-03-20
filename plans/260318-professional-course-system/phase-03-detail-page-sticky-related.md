# Phase 3: Course Detail Page -- Sticky CTA + Related Courses

## Context Links

- [Detail Page Research](../reports/researcher-260318-course-detail-page-patterns.md)
- [Current Detail Page](../../src/app/(main)/courses/[slug]/page.tsx)
- [Course Service](../../src/modules/courses/course-service.ts)

## Overview

- **Priority:** P1
- **Status:** completed
- **Effort:** 6h
- **Description:** Redesign detail page with 2-column layout, sticky CTA sidebar, breadcrumb, and related courses carousel at bottom.

## Key Insights

- CSS `sticky top-6` within parent container -- no JS needed
- 2-col desktop (content 60%, sidebar 40%); single-col mobile with fixed bottom CTA
- Related courses: same subject OR same ageGroup, exclude current, limit 4
- Tailwind `snap-x snap-mandatory overflow-x-auto` for carousel
- Breadcrumb improves navigation + SEO (BreadcrumbList schema potential)

## Requirements

### Functional
- Breadcrumb: "Khoa hoc > [Ten khoa]"
- 2-column layout: left = content (image, description, curriculum), right = sticky CTA sidebar
- Sticky CTA: price, discount, checkout button, trust guarantees
- Mobile: CTA section above curriculum (not sticky -- natural flow)
- Related courses section at bottom: horizontal scroll carousel, max 4 courses
- Related query: same subject OR same ageGroup, exclude current

### Non-Functional
- Sticky sidebar stays within parent container bounds
- Carousel: smooth snap scroll on touch devices
- No layout shift on sticky activation

## Architecture

```
CourseDetailPage (Server)
├── Breadcrumb (Server) -- static
├── 2-Column Layout
│   ├── Left Column (60%)
│   │   ├── Hero Image
│   │   ├── Quick Stats (lessons, duration, pace)
│   │   ├── Description + Bundle Content
│   │   └── Curriculum Section (existing)
│   └── Right Column (40%, sticky)
│       └── CourseDetailSidebar (Server)
│           ├── Price + Discount
│           ├── Checkout Button / "Da so huu" state
│           └── Trust Guarantees
├── Reviews Section (Phase 4 placeholder)
├── CourseRelatedSection (Server)
│   └── Horizontal scroll carousel of CourseCard
└── Support CTA Section (existing)
```

## Related Code Files

### Files to Modify
- `src/app/(main)/courses/[slug]/page.tsx` -- restructure layout, add breadcrumb, 2-col, related section
- `src/modules/courses/course-service.ts` -- add `getRelatedCourses()` function

### Files to Create
- `src/components/courses/course-detail-sidebar.tsx` -- sticky CTA sidebar (extracted from page)
- `src/components/courses/course-related-section.tsx` -- related courses carousel
- `src/components/courses/course-breadcrumb.tsx` -- breadcrumb navigation

## Implementation Steps

### Step 1: Add `getRelatedCourses()` to course-service.ts

```typescript
export async function getRelatedCourses(params: {
  courseId: string;
  subject?: CourseSubject | null;
  ageGroup?: AgeGroup | null;
  limit?: number;
}) {
  return prisma.course.findMany({
    where: {
      isPublished: true,
      id: { not: params.courseId },
      OR: [
        ...(params.subject ? [{ subject: params.subject }] : []),
        ...(params.ageGroup ? [{ ageGroup: params.ageGroup }] : []),
      ],
    },
    select: {
      id: true, slug: true, title: true, description: true,
      coverImageUrl: true, durationDays: true, priceVnd: true,
      salePriceVnd: true, listPriceVnd: true,
      _count: { select: { lessons: true } },
    },
    take: params.limit ?? 4,
  });
}
```

If no subject/ageGroup, fallback to newest courses excluding current.

### Step 2: Update `loadPublishedCourse` query

Add `subject` and `ageGroup` to select clause so related query can use them.

### Step 3: Create course-breadcrumb.tsx

Simple server component:
```tsx
<nav className="flex items-center gap-2 text-sm text-slate-500">
  <Link href="/courses" className="hover:text-emerald-700 transition-colors">Khoa hoc</Link>
  <ChevronRight className="h-3 w-3" />
  <span className="font-medium text-slate-900 truncate">{courseTitle}</span>
</nav>
```

### Step 4: Create course-detail-sidebar.tsx

Extract pricing + CTA + guarantees from current page into standalone component:
```tsx
<div className="sticky top-6 space-y-4">
  {/* Price block */}
  {/* Checkout button or "Da so huu" */}
  {/* Trust guarantees */}
</div>
```

Props: pricing, isOwned, isAuthenticated, courseSlug, childEntryHref, variant.

### Step 5: Create course-related-section.tsx

Horizontal scroll carousel:
```tsx
<section>
  <h2>Khoa hoc tuong tu</h2>
  <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
    {courses.map(course => (
      <div key={course.id} className="w-72 flex-shrink-0 snap-start">
        <CourseCard course={course} compact />
      </div>
    ))}
  </div>
</section>
```

If no related courses found, hide section entirely.

### Step 6: Restructure courses/[slug]/page.tsx

Reorganize into 2-column layout:
```tsx
<div className="page-stack">
  <CourseBreadcrumb title={course.title} />

  <section className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
    {/* Left column: image, stats, description, curriculum */}
    <div className="space-y-6">
      {/* Hero image */}
      {/* Quick stats */}
      {/* Description */}
      {/* Curriculum */}
    </div>

    {/* Right column: sticky sidebar */}
    <CourseDetailSidebar ... />
  </section>

  {/* Reviews placeholder (Phase 4) */}

  <CourseRelatedSection courseId={course.id} subject={course.subject} ageGroup={course.ageGroup} />

  {/* Support CTA */}
</div>
```

Mobile: single column, sidebar content inline (not sticky).

### Step 7: Mobile responsive

- Desktop (lg+): 2-column with sticky sidebar
- Mobile: single column, CTA section appears naturally in flow
- Related courses carousel: full-width horizontal scroll with touch support

## Todo List

- [x] Add subject/ageGroup to `loadPublishedCourse` select
- [x] Add `getRelatedCourses()` to course-service.ts
- [x] Create `course-breadcrumb.tsx`
- [x] Create `course-detail-sidebar.tsx` (extract from page)
- [x] Create `course-related-section.tsx` (carousel)
- [x] Restructure `courses/[slug]/page.tsx` with 2-col layout
- [ ] Test sticky sidebar on desktop (stays within parent)
- [ ] Test mobile layout (single col, no sticky)
- [ ] Test related courses carousel scroll snap
- [ ] Test breadcrumb navigation
- [x] Compile check after all changes

## Success Criteria

- 2-column layout on desktop with sticky CTA sidebar
- Single column on mobile with natural CTA placement
- Breadcrumb shows "Khoa hoc > [Title]" with working link
- Related courses carousel shows max 4 courses, horizontal scroll snap
- Related courses hidden when none found
- Sticky sidebar doesn't overflow parent container
- All files under 200 lines

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sticky sidebar overlaps footer on short pages | Low | Parent container bounds limit sticky naturally |
| Safari iOS sticky quirks | Low | Test on real device; fallback to relative positioning |
| No related courses for unclassified courses | Low | Hide section if empty array returned |
| Detail page already ~290 lines | Medium | Extract sidebar + related into separate components |

## Security Considerations

- No new auth endpoints in this phase
- Related courses query is public data only (isPublished: true)
- Breadcrumb uses course title -- sanitized by React rendering

## Next Steps

- Phase 4 adds reviews section between curriculum and related courses
- Future: SEO structured data (Course + AggregateRating schema.org)

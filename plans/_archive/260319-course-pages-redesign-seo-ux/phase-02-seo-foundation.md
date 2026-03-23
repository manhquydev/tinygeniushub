---
status: completed
priority: P1
effort: 4h
---

# Phase 2: SEO Foundation

## Context
- Target: Vietnamese parents searching "khoa hoc tieng Anh cho be", "hoc phonics cho tre", etc.
- Need JSON-LD structured data on all course pages for Google rich results
- Existing `generateMetadata` in both pages provides basic title/description but no structured data

## Key Insights
- Google supports `Course`, `ItemList`, `BreadcrumbList`, `AggregateRating` schema types
- Prisma schema already has `reviewAverageRating`, `reviewCount` on Course model
- `enrollmentCount` must be derived: `COUNT(CourseEnrollment WHERE courseId = X)`
- Course detail page (687 lines) must be modularized during this phase

## Files to Modify
- `src/app/(main)/courses/[slug]/page.tsx` - Add Course JSON-LD + OG tags + modularize
- `src/app/(main)/courses/page.tsx` - Add ItemList JSON-LD + improve meta
- `src/components/courses/course-breadcrumb.tsx` - Add BreadcrumbList JSON-LD

## Files to Create
- `src/lib/seo/course-jsonld.ts` - JSON-LD builder functions (Course, ItemList, BreadcrumbList)

## Implementation Steps

### Step 1: Create JSON-LD Builder Module
File: `src/lib/seo/course-jsonld.ts`

Functions to implement:
```
buildCourseJsonLd(course, enrollmentCount) -> Course schema with:
  - @type: Course
  - name, description, provider (Cung Con Tu Hoc)
  - aggregateRating (from reviewAverageRating/reviewCount)
  - offers: { price, priceCurrency: VND }
  - hasCourseInstance: { courseMode: "online" }
  - audience: { @type: EducationalAudience, educationalRole: "student" }
  - inLanguage: "vi"

buildCourseListJsonLd(courses) -> ItemList schema with:
  - @type: ItemList
  - itemListElement: array of ListItem with Course refs

buildBreadcrumbJsonLd(items) -> BreadcrumbList schema
```

### Step 2: Add Enrollment Count Query
In `src/modules/courses/course-service.ts`, add:
```
getCourseEnrollmentCount(courseId: string): Promise<number>
```
Simple `prisma.courseEnrollment.count({ where: { courseId } })`.

### Step 3: Update Course Detail Page Metadata
In `src/app/(main)/courses/[slug]/page.tsx`:
- Enhance `generateMetadata` to include OG image, OG type, twitter card
- Add `<script type="application/ld+json">` with Course JSON-LD in page body
- Include `aggregateRating` only when `reviewCount > 0`

### Step 4: Update Course Listing Page Metadata
In `src/app/(main)/courses/page.tsx`:
- Add ItemList JSON-LD listing all visible courses
- Improve meta description with keyword-rich Vietnamese text

### Step 5: Add BreadcrumbList to Breadcrumb Component
In `src/components/courses/course-breadcrumb.tsx`:
- Add `<script type="application/ld+json">` with BreadcrumbList
- Items: Trang chu > Khoa hoc > {courseTitle}

### Step 6: Modularize Course Detail Page (687 lines)
Extract from `src/app/(main)/courses/[slug]/page.tsx`:
- `src/app/(main)/courses/[slug]/course-detail-hero.tsx` - Hero section with image + stats
- `src/app/(main)/courses/[slug]/course-detail-fit-checklist.tsx` - Fit checklist section
- `src/app/(main)/courses/[slug]/course-detail-difference.tsx` - Difference cards section
- `src/app/(main)/courses/[slug]/course-detail-timeline.tsx` - Outcome timeline section
- `src/app/(main)/courses/[slug]/course-detail-curriculum.tsx` - Lesson list section
- Keep data fetching + composition in `page.tsx`, extract render sections

## Todo
- [ ] Create `src/lib/seo/course-jsonld.ts` with 3 builder functions
- [ ] Add `getCourseEnrollmentCount` to course-service
- [ ] Add Course JSON-LD to detail page
- [ ] Add OG image + twitter card meta to detail page
- [ ] Add ItemList JSON-LD to listing page
- [ ] Add BreadcrumbList JSON-LD to breadcrumb component
- [ ] Modularize course detail page into 5 sub-components
- [ ] Verify JSON-LD with Google Rich Results Test

## Success Criteria
- All course pages render valid JSON-LD (Course + BreadcrumbList)
- Listing page renders valid ItemList JSON-LD
- Course detail page is under 200 lines after modularization
- `npm run build` succeeds with no type errors

## Risk Assessment
- Risk: `reviewAverageRating` may be null for courses with no reviews -> only include aggregateRating when reviewCount > 0
- Risk: enrollmentCount query could be slow -> simple count query, acceptable for SSR

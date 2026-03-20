# Phase 4: Reviews System

## Context Links

- [Detail Page Research](../reports/researcher-260318-course-detail-page-patterns.md)
- [Schema Research](../reports/researcher-260318-course-schema-filter-design.md)
- [Course Service](../../src/modules/courses/course-service.ts)
- [Course Detail Page](../../src/app/(main)/courses/[slug]/page.tsx)

## Overview

- **Priority:** P2
- **Status:** pending
- **Effort:** 5h
- **Description:** Build reviews API (GET/POST), review display with rating distribution, write-review form for enrolled parents, and admin moderation endpoint.

## Key Insights

- Denormalized reviewAverageRating/reviewCount on Course -- update on every approve/reject
- One review per parent per course (@@unique constraint)
- Only enrolled parents can submit reviews (check CourseEnrollment)
- Admin moderation: isApproved default false, must approve before public display
- Rating distribution: simple CSS bars (5-star breakdown)
- Keep review service under 200 lines -- separate display from logic

## Requirements

### Functional
- `GET /api/courses/[slug]/reviews` -- paginated approved reviews (public)
- `POST /api/courses/[slug]/reviews` -- authenticated parent submits review (must own course)
- Review display: star rating, reviewer name, date, comment
- Rating distribution bar chart using CSS width percentages
- "Viet danh gia" section -- only if parent logged in AND owns course AND hasn't reviewed yet
- `PATCH /api/admin/courses/[id]/reviews/[reviewId]` -- approve/reject review
- Auto-update Course.reviewAverageRating and reviewCount on approve/reject

### Non-Functional
- Review submission: validate rating 1-5, comment max 1000 chars
- Approved reviews query <5ms (denormalized + index)
- Pagination: 5 reviews per page

## Architecture

```
API Routes
├── GET  /api/courses/[slug]/reviews     -> CourseReviewService.getApprovedReviews()
├── POST /api/courses/[slug]/reviews     -> CourseReviewService.createReview()
└── PATCH /api/admin/courses/[id]/reviews/[reviewId] -> CourseReviewService.moderateReview()

CourseReviewService (new)
├── getApprovedReviews(courseId, page)
├── getRatingDistribution(courseId)
├── createReview(courseId, parentId, rating, comment)
├── moderateReview(reviewId, approved)
└── updateCourseRatingAggregate(courseId)  // private helper

UI Components
├── CourseReviewsSection (Server) -- aggregate + reviews list + form
├── CourseReviewCard (Server) -- single review display
├── CourseRatingDistribution (Server) -- bar chart
└── CourseReviewForm (Client) -- write review form
```

## Related Code Files

### Files to Modify
- `src/app/(main)/courses/[slug]/page.tsx` -- add CourseReviewsSection
- `src/modules/courses/course-service.ts` -- add review aggregate to loadPublishedCourse

### Files to Create
- `src/modules/courses/course-review-service.ts` -- review CRUD + aggregation
- `src/app/api/courses/[slug]/reviews/route.ts` -- GET + POST handlers
- `src/app/api/admin/courses/[id]/reviews/[reviewId]/route.ts` -- PATCH handler
- `src/components/courses/course-reviews-section.tsx` -- reviews display section
- `src/components/courses/course-review-card.tsx` -- single review card
- `src/components/courses/course-rating-distribution.tsx` -- bar chart
- `src/components/courses/course-review-form.tsx` -- Client: review submission form

## Implementation Steps

### Step 1: Create course-review-service.ts

```typescript
// getApprovedReviews(courseId, page, pageSize=5)
// - WHERE courseId AND isApproved AND ordered by createdAt DESC
// - Include parent.displayName
// - Return { reviews, total, page, totalPages }

// getRatingDistribution(courseId)
// - groupBy rating WHERE isApproved
// - Return { 1: count, 2: count, ..., 5: count }

// createReview(courseId, parentId, data: { rating, comment? })
// - Validate rating 1-5
// - Check enrollment exists (throw if not enrolled)
// - Upsert review (update if exists, create if not)
// - Return created/updated review

// moderateReview(reviewId, approved: boolean)
// - Update isApproved
// - Call updateCourseRatingAggregate()

// updateCourseRatingAggregate(courseId)
// - Aggregate approved reviews: AVG(rating), COUNT
// - Update Course.reviewAverageRating and reviewCount
```

### Step 2: Create GET /api/courses/[slug]/reviews

```typescript
export async function GET(request: Request, { params }) {
  const { slug } = await params;
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;

  const course = await prisma.course.findUnique({ where: { slug }, select: { id: true } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = await getApprovedReviews(course.id, page);
  return NextResponse.json(result);
}
```

### Step 3: Create POST /api/courses/[slug]/reviews

```typescript
export async function POST(request: Request, { params }) {
  const parent = await getParentFromServerCookie();
  if (!parent) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { slug } = await params;
  const body = await request.json();
  // Validate: rating 1-5, comment?.length <= 1000

  const course = await prisma.course.findUnique({ where: { slug }, select: { id: true } });
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const review = await createReview(course.id, parent.id, body);
  return NextResponse.json(review, { status: 201 });
}
```

### Step 4: Create PATCH /api/admin/courses/[id]/reviews/[reviewId]

```typescript
// Validate admin auth
// body: { approved: boolean }
// Call moderateReview(reviewId, approved)
// Return updated review
```

### Step 5: Create course-rating-distribution.tsx

Server component -- CSS bars:
```tsx
{[5, 4, 3, 2, 1].map(star => (
  <div key={star} className="flex items-center gap-2">
    <span className="w-8 text-sm">{star}★</span>
    <div className="h-2 flex-1 rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-amber-400"
        style={{ width: `${percentage}%` }} />
    </div>
    <span className="w-8 text-xs text-slate-500">{count}</span>
  </div>
))}
```

### Step 6: Create course-review-card.tsx

Server component -- displays single review:
- Star icons (filled/empty)
- Parent display name
- Relative date (formatDistanceToNow)
- Comment text

### Step 7: Create course-review-form.tsx

Client component:
- Star rating selector (clickable stars)
- Textarea for comment (optional, max 1000 chars)
- Submit button
- Only shown if: logged in + enrolled + hasn't reviewed (or editing existing review)
- POST to `/api/courses/[slug]/reviews`
- Show success message after submission

### Step 8: Create course-reviews-section.tsx

Server component composing:
- Aggregate rating (average + count)
- Rating distribution bars
- List of review cards
- Review form (conditionally rendered)
- "Load more" or pagination for reviews

### Step 9: Integrate into detail page

Add `<CourseReviewsSection>` between curriculum and related courses sections.
Pass: courseId, courseSlug, parentId (if logged in), isOwned.

## Todo List

- [ ] Create `course-review-service.ts` with CRUD + aggregation
- [ ] Create `GET /api/courses/[slug]/reviews/route.ts`
- [ ] Create `POST /api/courses/[slug]/reviews/route.ts`
- [ ] Create `PATCH /api/admin/courses/[id]/reviews/[reviewId]/route.ts`
- [ ] Create `course-rating-distribution.tsx`
- [ ] Create `course-review-card.tsx`
- [ ] Create `course-review-form.tsx` (Client)
- [ ] Create `course-reviews-section.tsx`
- [ ] Integrate reviews section into detail page
- [ ] Test: enrolled parent can submit review
- [ ] Test: non-enrolled parent sees read-only reviews
- [ ] Test: admin can approve/reject review
- [ ] Test: aggregate rating updates after moderation
- [ ] Test: duplicate review prevented by unique constraint
- [ ] Compile check after all changes

## Success Criteria

- Approved reviews display with stars, name, date, comment
- Rating distribution bar chart renders correctly
- Enrolled parents can submit/edit their review
- Non-enrolled parents see reviews but no form
- Admin can approve/reject via API
- Course.reviewAverageRating and reviewCount auto-update on moderation
- Duplicate review returns upsert (update existing)
- All files under 200 lines

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Review spam from enrolled parents | Low | isApproved=false by default, admin moderation |
| Race condition on aggregate update | Low | Synchronous update after moderation; eventual consistency OK |
| XSS in review comments | Medium | React auto-escapes rendered text; no dangerouslySetInnerHTML |
| Large comment submissions | Low | Validate max 1000 chars at API layer |

## Security Considerations

- POST reviews: require authenticated parent session
- Enrollment check: parent must have CourseEnrollment for the course
- Admin endpoint: require admin role check (existing admin auth middleware)
- Rating validation: server-side 1-5 range check (don't trust client)
- Comment sanitization: React handles XSS; store raw text, render safely
- Rate limiting: unique constraint prevents spam (1 review per parent per course)

## Next Steps

- Add review rating badge to CourseCard in listing page (Phase 2 enhancement)
- Future: SEO AggregateRating schema.org markup (when min 5 reviews reached)
- Future: email notification to admin on new review submission

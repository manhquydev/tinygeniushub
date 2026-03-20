# EdTech Course Detail Page Patterns Research
**Date:** 2026-03-18
**Focus:** Sticky CTA Sidebar, Ratings & Reviews System, Related Courses Section, Overall Layout

---

## 1. STICKY CTA SIDEBAR (Price + Buy Button)

### Key Implementation Patterns

#### 1.1 Tailwind CSS Sticky Positioning
- Use `sticky top-X` utility classes for viewport-relative sticking
- `sticky` elements behave as `position: relative` until offset threshold met, then become "fixed" within parent bounds
- Once parent container scrolls out of view, sticky element also exits
- Combine with offset utilities: `top-0`, `top-4`, `top-8`, etc.

**Basic Example:**
```html
<div class="sticky top-0 bg-white shadow-lg p-4">
  <!-- Price display + CTA button -->
</div>
```

#### 1.2 Scroll-Aware Visibility Pattern
- Hide sticky CTA when scrolled to main CTA in hero section (prevent duplicate CTAs)
- Track scroll position to toggle sticky element visibility
- Typical breakpoint: sticky appears when hero CTA scrolls out of viewport
- Use CSS `transition` for smooth appearance/disappearance

**Implementation:**
```tsx
// Calculate hero CTA position
// Toggle sticky visibility based on scroll offset
// Smooth fade in/out with opacity transition
```

#### 1.3 Overflow & Container Considerations
- Sticky elements respect parent container boundaries (unlike `fixed`)
- Won't overflow parent container on scroll
- Useful for keeping CTA within content area on mobile
- Mobile pattern: use `fixed` fallback for better UX on small screens

**Responsive Strategy:**
```html
<!-- Mobile: fixed positioning (more accessible) -->
<!-- Desktop (md+): sticky positioning within parent -->
<div class="fixed md:sticky bottom-0 md:top-4 w-full md:w-auto">
```

#### 1.4 Z-Index & Stacking Context
- Use `z-20` to `z-40` for sticky sidebar (above content, below modals)
- Watch for stacking context conflicts with absolute/fixed positioned children
- Safe pattern: isolated sticky container with relative children

### Browser Support & Fallbacks
- Sticky positioning supported in all modern browsers (IE11+)
- Fallback: detect support via CSS and use `fixed` positioning if needed
- No JS intersection observer required for basic sticky (CSS handles it)

---

## 2. RATINGS & REVIEWS SYSTEM

### 2.1 Data Model (Prisma Schema Best Practices)

**Simple, Extensible Schema:**
```prisma
model CourseReview {
  id        String   @id @default(cuid())
  courseId  String
  parentId  String
  rating    Int      @db.SmallInt  // 1-5 stars
  comment   String?  @db.Text
  title     String?
  isApproved Boolean @default(false)  // Moderation flag
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  course    Course       @relation(fields: [courseId], references: [id], onDelete: Cascade)
  parent    ParentAccount @relation(fields: [parentId], references: [id], onDelete: Cascade)

  @@unique([courseId, parentId])  // One review per parent per course
  @@index([courseId, isApproved])  // Query pattern: course reviews (approved only)
  @@index([createdAt])  // Sorting by recency
  @@index([rating])  // Filter by star rating
}
```

**Schema Design Rationale:**
- `SmallInt` for rating (1-5 range, optimizes storage)
- `Text` type for comments (avoids schema changes if limit increases)
- `isApproved` boolean for moderation workflow
- `@@unique([courseId, parentId])` prevents duplicate reviews
- Indexes on query paths: courseId+isApproved (filtering), createdAt (sorting), rating (distribution)

### 2.2 Aggregate Rating Calculation

**PostgreSQL Query Pattern (avg + count):**
```sql
SELECT
  AVG(rating)::NUMERIC(3,2) as averageRating,
  COUNT(*) as totalReviews,
  COUNT(CASE WHEN rating = 5 THEN 1 END) as fiveStarCount,
  COUNT(CASE WHEN rating = 4 THEN 1 END) as fourStarCount,
  COUNT(CASE WHEN rating = 3 THEN 1 END) as threeStarCount,
  COUNT(CASE WHEN rating = 2 THEN 1 END) as twoStarCount,
  COUNT(CASE WHEN rating = 1 THEN 1 END) as oneStarCount
FROM course_review
WHERE courseId = $1 AND isApproved = true
```

**Prisma Implementation:**
```tsx
const stats = await prisma.courseReview.aggregate({
  where: { courseId, isApproved: true },
  _avg: { rating: true },
  _count: true,
});

// Distribution calculation
const distribution = await prisma.courseReview.groupBy({
  by: ['rating'],
  where: { courseId, isApproved: true },
  _count: { _all: true },
});
```

### 2.3 Review Display Component

**Key Display Elements:**
1. **Aggregate Stats:** Average rating (e.g., "4.5 ⭐") + review count
2. **Star Distribution:** Horizontal bar chart showing % breakdown (5★, 4★, 3★, 2★, 1★)
3. **Individual Reviews:**
   - Star display (filled/empty stars or numeric)
   - Reviewer name (parent display name)
   - Publish date (formatted: "2 weeks ago")
   - Comment text (truncated with "read more" if long)
   - Moderation badge (if marked as "verified" or "official")

**UI Pattern:**
```
┌─ Aggregate Rating ──────────────────────┐
│ ⭐ 4.5 (127 reviews)                    │
├─ Distribution ──────────────────────────┤
│ 5★ ████████████████████░░░ 85%          │
│ 4★ ███░░░░░░░░░░░░░░░░░░░  10%          │
│ 3★ ██░░░░░░░░░░░░░░░░░░░░   3%          │
│ 2★ ░░░░░░░░░░░░░░░░░░░░░░   1%          │
│ 1★ ░░░░░░░░░░░░░░░░░░░░░░   1%          │
├─ Recent Reviews ────────────────────────┤
│ ⭐⭐⭐⭐⭐ Nguyễn Hương (1 week ago)      │
│ "Great course! My child loved it"       │
│                                          │
│ ⭐⭐⭐⭐ Trần Mai (2 weeks ago)          │
│ "Good content but wishes had more..."   │
└──────────────────────────────────────────┘
```

### 2.4 Moderation Strategy
- **isApproved flag:** Boolean gating (moderate visible reviews)
- **Hidden reviews:** Store all reviews, display only `isApproved: true`
- **Batch moderation:** Admin endpoint to approve/reject in bulk
- **Optional:** Spam detection rules (auto-flag suspicious patterns)
- **SEO note:** Use AggregateRating schema only for approved reviews

---

## 3. RELATED COURSES SECTION

### 3.1 Recommendation Algorithm (Simple, Non-ML)

**Query Strategy - Same Bundle + Subject:**
```sql
SELECT c.* FROM course c
WHERE
  c.id != $courseId
  AND c.isPublished = true
  AND (
    -- Same bundle/subject
    (c.bundleSlug = $bundleSlug)
    OR
    -- Same ageGroup
    (c.ageGroup = $ageGroup AND c.bundleSlug != $bundleSlug)
  )
ORDER BY
  CASE WHEN c.bundleSlug = $bundleSlug THEN 0 ELSE 1 END,
  c.orderNo ASC
LIMIT 8
```

**Codebase Context (from course-bundles.ts):**
- Courses grouped by bundle: "abeka", "little-fox-en", "little-fox-cn"
- Course slugs use prefixes: `abeka-`, `lfen-`, `lfcn-`
- Bundle defines: `priceVnd`, `durationDays`, `orderNo`

**Enhanced Algorithm:**
Since courses have implicit age groups via bundle:
1. Get current course's bundle
2. Find other courses in same bundle (primary match)
3. If <5 results, add courses from other bundles with similar ageGroup field
4. Exclude current course
5. Order by relevance, then by orderNo (course sequence)

### 3.2 Prisma Query Optimization

**Single Query Pattern (avoid N+1):**
```tsx
const relatedCourses = await prisma.course.findMany({
  where: {
    isPublished: true,
    id: { not: currentCourseId },
    OR: [
      { bundleSlug: currentBundleSlug },  // Same bundle
      { ageGroup: currentAgeGroup }        // Same age group (if field exists)
    ]
  },
  select: {
    id: true,
    slug: true,
    title: true,
    description: true,
    coverImageUrl: true,
    durationDays: true,
    priceVnd: true,
    salePriceVnd: true,
    _count: { select: { enrollments: true } }  // enrollment count for social proof
  },
  orderBy: [
    { bundleSlug: 'asc' },  // Same bundle first
    { orderNo: 'asc' }       // Course order
  ],
  take: 8
});
```

**Note:** Codebase uses bundle-based organization; may need to add `bundleSlug` field to Course model if not present.

### 3.3 Horizontal Scroll Carousel Pattern

**Tailwind CSS Implementation:**
```html
<div class="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2">
  <!-- snap-start centers each card -->
  <div class="flex-shrink-0 snap-start">
    <CourseCard />
  </div>
  <!-- repeat for each course -->
</div>
```

**CSS Classes:**
- `flex gap-4`: flex layout with 1rem gaps
- `overflow-x-auto`: enable horizontal scroll
- `scroll-smooth`: smooth scroll animation
- `snap-x snap-mandatory`: scroll snap on X axis
- `snap-start` on items: align start of each card
- `pb-2`: padding-bottom for scrollbar space

**Advanced Options:**
- `snap-center` instead of `snap-start` for center alignment
- `gap-6` or `gap-8` for larger spacing
- `px-4 md:px-8` for left/right padding on container
- Custom scrollbar styling via `::-webkit-scrollbar` (non-standard but works)

**Mobile Optimization:**
- Full width on mobile with padding
- Hide scrollbar indicator or style subtly
- Show "swipe to see more" hint (optional UX touch)

### 3.4 CTA Pattern - "Bạn có thể thích"
**Vietnamese Copy Options:**
- "Khóa học tương tự" (Similar courses)
- "Bạn có thể thích" (You might like)
- "Khoá học liên quan" (Related courses)
- "Lộ trình khác từ nhà cung cấp này" (Other pathways from this provider)

---

## 4. OVERALL COURSE DETAIL PAGE LAYOUT

### 4.1 Reading Pattern Selection: Z-Pattern vs F-Pattern

**Z-Pattern (Recommended for Course Detail):**
- Flow: Top-left → Top-right → Bottom-right → Bottom-left
- Best for single-call focused journeys (hero → preview → CTA → reviews)
- Ideal when page has clear hero section with immediate CTA
- Eye path follows natural diagonal movement
- Suitable for product pages with strong lead magnet

**Typical Z-Pattern Course Layout:**
1. **Hero (Top-Left to Top-Right):** Title, subtitle, key stats, hero image
2. **Diagonal to Bottom-Right:** Quick preview, value propositions
3. **Bottom Section:** Reviews, related courses, final CTA

**F-Pattern (For Content-Heavy Course Pages):**
- Flow: Top horizontal bar → Middle horizontal bar → Left vertical scan
- Better for curriculum-heavy pages with lots of text
- Users scan left column first, less likely to see right side
- Suitable if course has detailed lesson list

**Hybrid Approach:**
- Use Z-pattern for hero section (drive initial engagement)
- Use F-pattern for curriculum section (detailed lesson information)

### 4.2 Above-the-Fold Section (Hero)
**Must-Include Elements:**
1. **Hero Image/Video:** Large, high-quality visual (60% of fold)
2. **Course Title:** Clear, benefit-focused headline
3. **Quick Stats:**
   - Duration (e.g., "365 days")
   - Lesson count (e.g., "48 lessons")
   - Aggregate rating if available (e.g., "4.5 ⭐ 127 reviews")
4. **Provider Badge:** Bundle/provider name (Abeka, Little Fox, etc.)
5. **Primary CTA:** Prominent "Mua ngay" or "Xem trước" button
6. **Trust Elements:** Badge (bestseller, most popular, etc.)

**Responsive Hero:**
- Mobile: Stack image above text, full width CTA
- Desktop: Side-by-side layout, sticky CTA sidebar shows on scroll

### 4.3 Below-the-Fold Sections (Recommended Order)

**Section 1: Brief Description**
- 2-3 sentences summarizing course value
- Key outcomes bullets

**Section 2: Course Preview/Curriculum**
- Visual lesson breakdown (tier structure if exists)
- Sample lesson or preview access link
- "What you'll learn" key points

**Section 3: Ratings & Reviews**
- Aggregate stats + distribution
- Top 3-5 recent reviews
- "Write a review" CTA (for enrolled parents)

**Section 4: Related Courses**
- Horizontal scrollable carousel
- 6-8 cards showing similar courses
- "Bạn có thể thích" heading

**Section 5: FAQ Section** (Optional but recommended)
- Age appropriateness
- Technical requirements
- Refund policy
- Duration flexibility

**Section 6: Final CTA + Social Proof**
- Enrollment button
- Trust badges
- "Join X parents" social proof

### 4.4 SEO Schema Markup Integration

**Implement AggregateRating + Course Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Course Title",
  "description": "Full description",
  "provider": {
    "@type": "Organization",
    "name": "Cung Con Tu Hoc"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.5",
    "ratingCount": "127"
  },
  "hasCourseInstance": [
    {
      "@type": "CourseInstance",
      "name": "Full Course",
      "duration": "P365D",
      "offers": {
        "@type": "Offer",
        "price": "500000",
        "priceCurrency": "VND"
      }
    }
  ]
}
```

**Why AggregateRating:**
- Rich snippet in Google search results
- Displays star rating + review count in SERPs
- Only include if `averageRating >= 3.5` (Google best practice)
- Must mirror on-page rating (no hidden/contradictory data)

---

## 5. IMPLEMENTATION PRIORITIES & COMPLEXITY

| Feature | Complexity | Time Est. | Dependencies |
|---------|-----------|----------|--------------|
| **Sticky CTA Sidebar** | Low | 2-3 hours | None (CSS only) |
| **Ratings & Reviews (Data Model)** | Low | 4-5 hours | Prisma migration |
| **Review Display Component** | Medium | 4-6 hours | Data model |
| **Related Courses Algorithm** | Low-Medium | 3-4 hours | Course model needs bundleSlug if missing |
| **Carousel Component** | Low | 2-3 hours | None (Tailwind + React state) |
| **Overall Layout + SEO** | Medium | 6-8 hours | All above + canonical course detail page |

---

## 6. CODEBASE OBSERVATIONS

### Current Course Structure
- Courses have: `id`, `slug`, `title`, `description`, `priceVnd`, `listPriceVnd`, `salePriceVnd`, `durationDays`, `coverImageUrl`, `isPublished`
- Bundle organization via `course-bundles.ts` (not database schema)
- `CourseLesson` model exists (many-to-many with Lesson)
- `CourseEnrollment` tracks parent course purchases

### Missing for Review System
- No `subject` or `categoryId` field on Course model
- No `ageGroup` field (courses grouped by bundle strategy)
- No `CourseReview` model yet
- Course detail page components not yet built

### Recommendation
- Add optional `ageGroup` field to Course model for cross-bundle recommendations
- Consider adding `bundleSlug` field to Course for easier queries
- Design CourseReview schema with moderation in mind

---

## 7. KEY TECHNICAL INSIGHTS

### Sticky vs Fixed Positioning
- **Sticky:** Stays within parent container, respects overflow, CSS-only (no JS needed)
- **Fixed:** Relative to viewport, ignores parent boundaries
- **Pattern:** Use sticky for content sidebar, fixed for true sticky-to-viewport CTAs

### Review Aggregation Performance
- Compute aggregates on read (not write)
- Cache aggregate stats in Course model if read-heavy: `avgRating DECIMAL`, `reviewCount INT`
- Update cache async after each review (eventual consistency acceptable)

### Carousel Scroll Behavior
- Prefer native CSS `snap-points` over JavaScript libraries (better mobile performance)
- Snap align: `snap-start` for left alignment, `snap-center` for centered cards
- Gap spacing: `gap-4` (1rem) is standard, `gap-6` for premium layouts

### SEO Best Practices
- Only show AggregateRating if minimum reviews threshold met (3-5+ reviews)
- Ensure marked-up rating matches on-page display
- Use structured data validator before publication
- Consider adding BreadcrumbList schema for site hierarchy

---

## SOURCES

- [Tailwind CSS Position Documentation](https://tailwindcss.com/docs/position)
- [Tailwind CSS Sticky Examples](https://tw-elements.com/docs/standard/extended/position-sticky/)
- [Prisma Best Practices](https://www.prisma.io/docs/orm/more/best-practices)
- [PlanetScale Prisma Best Practices](https://planetscale.com/docs/vitess/tutorials/prisma-best-practices)
- [PostgreSQL AVG Function](https://neon.com/postgresql/postgresql-aggregate-functions/postgresql-avg-function)
- [PostgreSQL Documentation - Aggregate Functions](https://www.postgresql.org/docs/current/tutorial-agg.html)
- [Course Recommendation System Approaches](https://medium.com/@sakshammathurr/course-recommendation-system-817f13928011)
- [E-Learning Course Recommender System Using Collaborative Filtering](https://www.mdpi.com/2079-9402/12/1/157)
- [Z-Pattern vs F-Pattern Layout](https://www.landingpageflow.com/post/z-pattern-vs-f-pattern)
- [Z-Shaped Pattern For Reading Web Content](https://uxplanet.org/z-shaped-pattern-for-reading-web-content-ce1135f92f1c)
- [Google Schema.org Course Definition](https://developers.google.com/search/docs/appearance/structured-data/course)
- [Google AggregateRating Documentation](https://developers.google.com/search/docs/appearance/structured-data/review-snippet)
- [Schema Markup for Course Websites](https://eseospace.com/blog/schema-markup-for-course-websites-schemas/)
- [Horizontal Carousel Tailwind CSS](https://robkendal.co.uk/blog/how-to-build-a-multi-image-carousel-in-react-and-tailwind/)
- [Tailwind CSS Carousel Components](https://tw-elements.com/learn/te-foundations/tailwind-css/carousel/)
- [Material Tailwind Carousel](https://www.material-tailwind.com/docs/react/carousel)

---

## UNRESOLVED QUESTIONS

1. **Course Subject/Category:** Codebase uses bundle-based organization. Should we add explicit `subject` field to Course model, or keep bundle as primary grouping? Current approach scales to ~10-20 courses per bundle; would need refactoring for 50+ courses.

2. **Review Moderation Workflow:** Should reviews require parent email verification before visibility? Current schema allows any parent to review, but no verification that parent actually enrolled.

3. **Caching Strategy:** For popular courses with 1000+ reviews, should we cache aggregate ratings in Course model or compute on-demand? Trade-off between query latency and eventual consistency.

4. **Review Authenticity:** Should system show "verified enrollment" badge on reviews? Requires linking CourseReview to CourseEnrollment, adds complexity but improves trust.

5. **Multi-language Support:** Should review comments be stored + displayed in Vietnamese only, or support multi-language with optional translation?

6. **Related Courses Logic:** Current algorithm suggests "same bundle" courses. Should system also consider course level/tier (e.g., recommend Level 2 if viewing Level 1)? Requires level metadata in schema.

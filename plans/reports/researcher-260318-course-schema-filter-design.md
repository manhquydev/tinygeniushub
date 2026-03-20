# Course Schema & Filtering System Design Research

**Date:** 2026-03-18
**Scope:** Schema design for course filtering with subject/ageGroup metadata + CourseReview model
**Status:** Complete research - ready for implementation planning

---

## 1. Enum Definition Strategy: Prisma Enums vs String

### Recommendation: Use Prisma Enums

**Why Prisma Enums (RECOMMENDED):**
- Type-safe in TypeScript — compiler catches invalid values
- Database constraint enforcement (PostgreSQL CHECK constraint)
- Migrations auto-handled by Prisma
- Query autocomplete in IDE
- Efficient storage (uses PostgreSQL enum type)
- Easy frontend filtering UI generation from enum values

**Proposed Enums for Courses:**

```prisma
enum Subject {
  MATH
  ENGLISH
  SCIENCE
  ART
  MUSIC
  OTHER
}

enum AgeGroup {
  AGE_4_6
  AGE_7_9
  AGE_10_12
  ALL_AGES
}

enum CourseDifficultyLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}
```

**Note:** `AgeGroup` already exists in schema (lines 702-708) with different values: `UNDER_3, AGE_3_5, AGE_6_8, AGE_9_12, ALL_AGES`.
- Current BlogPost uses: `UNDER_3, AGE_3_5, AGE_6_8, AGE_9_12, ALL_AGES`
- Proposed for Course: `AGE_4_6, AGE_7_9, AGE_10_12, ALL_AGES`

**Action:** Create separate enum or extend existing? See **Risk Assessment** #1.

### Alternative: String with Validation
- Pros: No enum migration on new values
- Cons: No database constraints, runtime validation overhead, error-prone

**Verdict:** Use Prisma enums for constraints + type safety.

---

## 2. Course Model Schema Additions

### Current Course Model (lines 902-918)
```prisma
model Course {
  id            String             @id @default(cuid())
  slug          String             @unique
  title         String
  description   String
  priceVnd      Int
  listPriceVnd  Int?
  salePriceVnd  Int?
  durationDays  Int
  isPublished   Boolean            @default(false)
  coverImageUrl String?
  createdAt     DateTime           @default(now())
  updatedAt     DateTime           @updatedAt
  lessons       CourseLesson[]
  enrollments   CourseEnrollment[]
  childJourneys ChildCourseJourney[]
}
```

### Proposed Additions
```prisma
model Course {
  // ... existing fields ...

  // NEW: Filtering & classification fields
  subject           Subject?                      // nullable for backward compat
  ageGroup          AgeGroup?                     // nullable for backward compat
  difficultyLevel   CourseDifficultyLevel?        // optional

  // NEW: Review relationship
  reviews           CourseReview[]

  // NEW: Metadata for catalog
  isPopular         Boolean            @default(false)
  reviewAverageRating Float?           // denormalized for query performance
  reviewCount       Int                @default(0)   // denormalized counter
}
```

### Default Values for Existing Courses
- **subject:** NULL (will require migration data seeding)
- **ageGroup:** NULL (will require migration data seeding)
- **difficultyLevel:** NULL (safe default, truly optional)

**Suggested seed defaults** (to be confirmed with product):
- Abeka courses: subject=ENGLISH, ageGroup=ALL_AGES or specific by level
- Little Fox EN: subject=ENGLISH, ageGroup=ALL_AGES
- Little Fox CN: subject=OTHER, ageGroup=ALL_AGES

---

## 3. CourseReview Model Design

### Proposed Schema
```prisma
model CourseReview {
  id              String        @id @default(cuid())
  courseId        String
  parentId        String
  rating          Int           // 1-5 stars
  comment         String?       // optional text review
  isApproved      Boolean       @default(false)
  approvedBy      String?       // admin email who approved
  rejectionReason String?       // why review was rejected (if any)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  deletedAt       DateTime?     // soft delete

  course          Course        @relation(fields: [courseId], references: [id], onDelete: Cascade)
  parent          ParentAccount @relation(fields: [parentId], references: [id], onDelete: Cascade)

  // PRIMARY KEY: One review per parent per course (no duplicate reviews)
  @@unique([courseId, parentId])

  // INDEXES: Query patterns for filtering/display
  @@index([courseId, isApproved, createdAt(sort: Desc)])  // For storefront: approved reviews
  @@index([courseId, isApproved, rating])                  // For rating aggregation
  @@index([parentId, createdAt])                           // For parent's own reviews
  @@index([isApproved(sort: Desc), createdAt])             // For admin moderation queue
  @@index([deletedAt])                                     // For soft-delete queries
}

// ParentAccount changes (add relation)
model ParentAccount {
  // ... existing fields ...
  courseReviews   CourseReview[]
}
```

### Rationale
- **One review per parent per course:** Prevents duplicate/spam reviews, allows updates
- **isApproved flag:** Admin moderation workflow (not auto-published)
- **Denormalized fields (reviewAverageRating, reviewCount on Course):**
  - Improves storefront query performance (no aggregation on every load)
  - Trade-off: cache staleness (acceptable for reviews)
  - Update triggers: on review creation/approval/deletion
- **Soft delete (deletedAt):** Preserve referential integrity, audit trail
- **Index strategy:** Optimized for three patterns:
  1. Storefront display (approved reviews, sorted by date)
  2. Rating aggregation (count/average by rating)
  3. Admin moderation (pending approvals)

---

## 4. Course Filtering Query Patterns

### Query 1: Storefront Filter - Multiple Criteria
```typescript
// GET /api/courses?subject=ENGLISH&ageGroup=AGE_7_9&minPrice=0&maxPrice=500000&sortBy=rating

const courses = await prisma.course.findMany({
  where: {
    isPublished: true,
    subject: 'ENGLISH',                    // Optional: AND
    ageGroup: 'AGE_7_9',                   // Optional: AND
    salePriceVnd: {
      gte: 0,                              // Price range: AND
      lte: 500000,
    },
    // Duration range (OPTIONAL feature)
    // durationDays: {
    //   gte: 30,
    //   lte: 60,
    // },
  },
  select: {
    id: true,
    slug: true,
    title: true,
    subject: true,
    ageGroup: true,
    difficultyLevel: true,
    salePriceVnd: true,
    coverImageUrl: true,
    reviewAverageRating: true,
    reviewCount: true,
    _count: {
      select: { lessons: true },
    },
  },
  orderBy:
    sortBy === 'rating'
      ? { reviewAverageRating: 'desc' }
      : { createdAt: 'desc' },
});
```

### Query 2: Approved Reviews for Storefront Display
```typescript
// Display on course detail page

const reviews = await prisma.courseReview.findMany({
  where: {
    courseId,
    isApproved: true,
    deletedAt: null,
  },
  select: {
    id: true,
    rating: true,
    comment: true,
    createdAt: true,
    parent: {
      select: { displayName: true },
    },
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
});
```

### Query 3: Admin Moderation Queue
```typescript
// GET /api/admin/reviews?status=pending

const pendingReviews = await prisma.courseReview.findMany({
  where: {
    isApproved: false,
    deletedAt: null,
  },
  include: {
    course: { select: { title: true } },
    parent: { select: { displayName: true, email: true } },
  },
  orderBy: { createdAt: 'asc' },
});
```

### Query 4: Rating Aggregation (for denormalization refresh)
```typescript
// Compute and update Course.reviewAverageRating & reviewCount

const stats = await prisma.courseReview.aggregate({
  where: {
    courseId,
    isApproved: true,
    deletedAt: null,
  },
  _avg: { rating: true },
  _count: true,
});

await prisma.course.update({
  where: { id: courseId },
  data: {
    reviewAverageRating: stats._avg.rating ?? 0,
    reviewCount: stats._count,
  },
});
```

### Query 5: Parent's Own Review (for review form pre-fill)
```typescript
// Check if parent already reviewed + fetch to allow edit

const existingReview = await prisma.courseReview.findUnique({
  where: { courseId_parentId: { courseId, parentId } },
});
```

---

## 5. Migration Strategy

### Phase 1: Add Fields (Non-Breaking)
```sql
-- Prisma migration will generate:
ALTER TABLE "Course" ADD COLUMN "subject" ENUM('MATH', 'ENGLISH', ...);
ALTER TABLE "Course" ADD COLUMN "ageGroup" ENUM('AGE_4_6', ...);
ALTER TABLE "Course" ADD COLUMN "difficultyLevel" ENUM('BEGINNER', ...);
ALTER TABLE "Course" ADD COLUMN "isPopular" BOOLEAN DEFAULT false;
ALTER TABLE "Course" ADD COLUMN "reviewAverageRating" DOUBLE PRECISION;
ALTER TABLE "Course" ADD COLUMN "reviewCount" INT DEFAULT 0;
```

- All new columns have defaults (NULL or 0)
- Existing courses unaffected
- No data backfill required (queries handle NULL)

### Phase 2: Create CourseReview Table
```sql
-- Auto-generated from Prisma model
CREATE TABLE "CourseReview" (
  id UUID PRIMARY KEY,
  courseId UUID NOT NULL REFERENCES "Course"(id),
  parentId UUID NOT NULL REFERENCES "ParentAccount"(id),
  rating INT NOT NULL,
  comment TEXT,
  isApproved BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT NOW(),
  ...
  CONSTRAINT one_review_per_parent UNIQUE(courseId, parentId),
  INDEX idx_storefront (courseId, isApproved, createdAt DESC),
  ...
);
```

### Phase 3: Seed Existing Course Metadata (Manual)
```sql
-- Update course subject/ageGroup based on slug patterns
UPDATE "Course" SET
  subject = 'ENGLISH',
  ageGroup = 'ALL_AGES'
WHERE slug LIKE 'abeka%' OR slug LIKE 'littlefox%';
```

**No downtime required** — migrations auto-run on deploy.

---

## 6. Index Recommendations

### On Course Table
```prisma
@@index([subject, ageGroup, isPublished])                  // Filtering
@@index([isPublished, reviewAverageRating(sort: Desc)])   // Popularity sort
@@index([difficultyLevel, ageGroup])                      // Learning progression
```

### On CourseReview Table (already detailed above)
- `[courseId, isApproved, createdAt(sort: Desc)]` — Storefront display
- `[courseId, isApproved, rating]` — Rating stats
- `[parentId, createdAt]` — Parent's reviews
- `[isApproved(sort: Desc), createdAt]` — Admin queue
- `[deletedAt]` — Soft delete filtering

**Index count:** ~5-6 total per table (reasonable for query patterns)

---

## 7. API Endpoints (Outline)

### Storefront (Public)
- `GET /api/courses?subject=ENGLISH&ageGroup=AGE_7_9&sortBy=rating` — filtered catalog
- `GET /api/courses/[slug]/reviews` — approved reviews for detail page
- `POST /api/courses/[slug]/reviews` — authenticated parent submits review

### Admin (Protected)
- `GET /api/admin/reviews?status=pending` — moderation queue
- `PATCH /api/admin/reviews/[id]` — approve/reject with reason
- `DELETE /api/admin/reviews/[id]` — hard delete (backup)

### Backend (Private)
- Trigger to denormalize `Course.reviewAverageRating` on review approve/reject
- BullMQ job (optional) to batch-update stats nightly

---

## 8. Risk Assessment

### Risk #1: AgeGroup Enum Overlap
**Issue:** Blog system defines `AgeGroup` with 5 values; Course needs different values.

**Options:**
1. **Extend existing enum** (recommended)
   - Rename to: `AgeGroup = UNDER_3 | AGE_3_5 | AGE_6_8 | AGE_9_12 | AGE_4_6 | AGE_7_9 | AGE_10_12 | ALL_AGES`
   - Pro: Single source of truth
   - Con: Enum becomes bloated, requires validation per entity

2. **Create separate enums**
   - `BlogAgeGroup` and `CourseAgeGroup`
   - Pro: Isolated semantics
   - Con: Duplication, harder to sync

**Recommendation:** Option 1 (extend). Keep validation at model level (e.g., `@relation` constraints, or service-layer validation).

### Risk #2: Review Spam / Fake Reviews
**Mitigation:**
- `isApproved: false` by default (admin review required)
- Only enrolled parents can review (add validation: check CourseEnrollment)
- Rate-limit: 1 review per parent per course (unique constraint handles this)
- Future: IP-based spam detection, sentiment analysis

### Risk #3: Denormalization Staleness
**Issue:** `reviewAverageRating` may lag behind actual reviews if cache update fails.

**Mitigation:**
- Update on every review action (approve/reject/delete) — synchronous
- Optional: Nightly batch job to reconcile
- Cache invalidation: include `ETag` or version timestamp on Course

### Risk #4: Breaking Change for Existing Filtering
**Issue:** No existing filtering API, so no breaking change risk.

**Safe:** Add new optional query params; default behavior (no filters) returns all published.

---

## 9. Implementation Checklist

- [ ] Define enums in `prisma/schema.prisma`
- [ ] Add Course fields: subject, ageGroup, difficultyLevel, isPopular, reviewAverageRating, reviewCount
- [ ] Create CourseReview model with indexes
- [ ] Update ParentAccount relation to reviews
- [ ] Run `pnpm prisma migrate dev --name add_course_filtering`
- [ ] Seed existing courses with default subject/ageGroup
- [ ] Create `course-review-service.ts` (CRUD, stats aggregation)
- [ ] Add API route: `GET /api/courses?filters`
- [ ] Add API route: `POST /api/courses/[slug]/reviews`
- [ ] Add API route: `GET /api/admin/reviews?status=pending`
- [ ] Add API route: `PATCH /api/admin/reviews/[id]`
- [ ] Update `StorefrontCourse` type to include metadata
- [ ] Write tests for filtering query patterns
- [ ] Write tests for review moderation workflow
- [ ] Update API documentation

---

## 10. Schema Comparison Summary

| Feature | Current | Proposed | Impact |
|---------|---------|----------|--------|
| Subject/AgeGroup | None | Enum fields | Enables filtering |
| Difficulty Level | None | Optional enum | UI segmentation |
| Reviews | None | CourseReview model | Social proof + moderation |
| Denormalized Stats | None | reviewAverageRating, reviewCount | Query performance |
| Indexes | 2 (courseId, createdAt) | +4 on both tables | Better query plans |
| Breaking Changes | N/A | None (all nullable/default) | Zero downtime |

---

## 11. Query Performance Notes

**Filter Query Estimate** (without indexes):
- 500 courses, scan all → ~10-50ms

**With proposed indexes:**
- Filtered by subject + ageGroup → ~1-5ms (index seek)
- Sorted by rating → ~2-8ms (use index, no sort)

**Review Query (10 approved reviews):**
- courseId + isApproved + createdAt index → ~0.5-2ms

**Denormalization benefit:**
- Aggregation query (stats) on 1000 reviews → ~100-300ms (background job)
- Storefront display (cached denormalized field) → <1ms

---

## 12. Unresolved Questions

1. **Should Course.subject be required or nullable?**
   - Current seed data lacks subject classification
   - Recommendation: NULL with explicit migration phase to populate
   - Alternative: Make required, seed all courses immediately

2. **Should ageGroup be consistent between Blog and Course enums?**
   - Current Blog enum: UNDER_3, AGE_3_5, AGE_6_8, AGE_9_12
   - Proposed Course enum: AGE_4_6, AGE_7_9, AGE_10_12
   - Action: Confirm with product team on age band alignment

3. **Should reviews be auto-published or require admin approval?**
   - Recommendation: Require approval (isApproved default false)
   - Alternative: Auto-publish if from enrolled parent + rating 3-5 stars
   - Decision needed: approval process (who, SLA, notification)

4. **Should difficultyLevel be on Course or CourseLesson?**
   - Current Activity model has difficultyLevel (line 368)
   - Proposal: Course-level difficulty summarizes lesson content
   - Question: Is course difficulty uniform or varies by lesson?

5. **How to handle bulk review edits after moderation?**
   - If parent edits review after approval, should it re-require approval?
   - Recommendation: Require re-approval on significant changes (rating/comment update)
   - Implement: updatedAt > approvedAt check in service layer

6. **Soft delete strategy: include deletedAt in all indexes?**
   - Current proposal: separate index on deletedAt for audit queries
   - Alternative: Always AND deletedAt IS NULL in where clause (safer)
   - Recommendation: Both (explicit index + WHERE clause)

---

## Summary

**Status:** ✅ Research complete, ready for implementation planning

**Key Decisions:**
1. Use Prisma enums for subject/ageGroup/difficulty (type-safe, DB-enforced)
2. Create CourseReview model with 6 strategic indexes
3. Denormalize rating stats on Course for query performance
4. Admin moderation required (isApproved workflow)
5. Zero-breaking-change migration (all nullable fields)

**Next Phase:** Planner to create implementation plan with detailed tasks, phase breakdown, and test strategy.

---

*Report generated 2026-03-18 by researcher-course-schema*

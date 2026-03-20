# Brainstorm Report: Professional Course System Redesign

**Date:** 2026-03-18
**Status:** Research Complete — Ready for Planning

---

## Problem Statement

Trang khóa học hiện tại (`/courses`, `/courses/[slug]`) thiếu:
- Hệ thống lọc (filter) theo môn học, độ tuổi, giá, thời lượng
- Hover/animation effects trên course cards
- Sticky CTA sidebar trên trang detail
- Ratings & reviews system
- Related courses section
- Schema fields để support filtering

Course model hiện tại không có `subject`, `ageGroup`, `difficultyLevel` → không thể filter.

---

## Evaluated Approaches

### A. Client-side filtering (React state only)

**Pros:** Nhanh implement, không cần API changes
**Cons:** Không bookmarkable, không SEO-friendly, toàn bộ data phải load trước
**Verdict:** ❌ Không phù hợp — sẽ tệ khi course list tăng lên

### B. URL searchParams + Server Component (Recommended)

**Pros:**
- Filter state trong URL → bookmarkable, shareable, SEO-friendly
- Server-side filtering → chỉ load data cần thiết
- Next.js 16 App Router native pattern
- `useTransition` + `useDeferredValue` cho smooth UX khi filter thay đổi

**Cons:** Cần server re-render mỗi khi filter thay đổi (giải quyết bằng `useTransition`)
**Verdict:** ✅ Chọn approach này

### C. Full-text search (Algolia/Meilisearch)

**Pros:** Real-time search, typo tolerance
**Cons:** Over-engineering cho số lượng course hiện tại (<50 courses)
**Verdict:** ❌ YAGNI — không cần thiết lúc này

---

## Final Recommended Solution

### 1. Schema Changes (Migration-safe)

**Course model additions:**
```prisma
enum CourseSubject {
  MATH
  ENGLISH
  SCIENCE
  ART
  MUSIC
  OTHER
}

enum CourseAgeGroup {
  AGE_4_6
  AGE_7_9
  AGE_10_12
  ALL_AGES
}

model Course {
  // existing fields...
  subject              CourseSubject?   // nullable for backward compat
  ageGroup             CourseAgeGroup   @default(ALL_AGES)
  reviewAverageRating  Float?           // denormalized for fast queries
  reviewCount          Int              @default(0)

  reviews              CourseReview[]
  @@index([subject, isPublished])
  @@index([ageGroup, isPublished])
}
```

**New CourseReview model:**
```prisma
model CourseReview {
  id         String   @id @default(cuid())
  courseId   String
  parentId   String
  rating     Int      // 1-5
  comment    String?
  isApproved Boolean  @default(false)
  createdAt  DateTime @default(now())

  course   Course  @relation(fields: [courseId], references: [id], onDelete: Cascade)
  parent   Parent  @relation(fields: [parentId], references: [id], onDelete: Cascade)

  @@unique([courseId, parentId])  // 1 review per parent per course
  @@index([courseId, isApproved, createdAt])
}
```

**Migration strategy:** 3 phases, zero breaking changes, all new fields nullable/default.

---

### 2. Course Listing Page (`/courses`)

**Layout:** Grid cards + sidebar filter (Udemy-style)

```
Desktop:
┌──────────┬─────────────────────────────────────┐
│ FILTER   │  Sort: Mới nhất ▼   12 khóa tìm thấy│
│ ────────  │  ─────────────────────────────────── │
│ Môn học  │  [Card] [Card] [Card]                │
│ ○ Tất cả │  [Card] [Card] [Card]                │
│ ○ Toán   │                                      │
│ ○ Tiếng  │  [Pagination]                        │
│   Anh    │                                      │
│ ────────  │                                      │
│ Độ tuổi  │                                      │
│ ○ 4-6 t  │                                      │
│ ○ 7-9 t  │                                      │
│ ────────  │                                      │
│ Giá      │                                      │
│ [slider] │                                      │
│ ────────  │                                      │
│ Thời lượng│                                     │
│ ○ Ngắn   │                                      │
│ ○ Dài    │                                      │
└──────────┴─────────────────────────────────────┘

Mobile: Filter button → Sheet drawer từ bottom
```

**Component split:**
- `CoursesPage` (Server Component) — fetch filtered data từ URL params
- `CourseFilterSidebar` (Client Component) — filter UI, đọc/ghi URL params
- `CourseCard` (Server Component) — pure display
- `CourseSortSelect` (Client Component) — sort dropdown

**Hover effects (Tailwind, subtle):**
```tsx
<article className="... transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer group">
  <img className="... transition-transform duration-200 group-hover:scale-[1.02]" />
  <h2 className="... group-hover:text-emerald-700 transition-colors duration-150" />
</article>
```

---

### 3. Course Detail Page (`/courses/[slug]`)

**New layout:**
```
┌─────────────────────────────────────┐
│ Breadcrumb: Khóa học > Toán lớp 1   │
├─────────────────────┬───────────────┤
│ Hero image          │ STICKY SIDEBAR│
│                     │ ─────────────  │
│ Title               │ Giá: 250,000đ │
│ Description         │ ~~300,000đ~~  │
│ Quick stats         │               │
│                     │ [Mua khóa học]│
│                     │               │
│                     │ ✓ Truy cập ngay│
│                     │ ✓ Theo dõi tiến│
│                     │   độ rõ ràng  │
├─────────────────────┴───────────────┤
│ Curriculum (lesson list)            │
├─────────────────────────────────────┤
│ ★ Đánh giá từ phụ huynh (4.8/5)    │
│ [Review cards]                      │
│ [Viết đánh giá — nếu đã mua]       │
├─────────────────────────────────────┤
│ Khóa học tương tự                   │
│ ← [Card] [Card] [Card] →           │
└─────────────────────────────────────┘
```

**Sticky CTA:** `<div className="sticky top-6 space-y-4">`
**Related courses query:** `WHERE (subject = $subject OR ageGroup = $ageGroup) AND id != $courseId LIMIT 4`
**Carousel:** Tailwind `snap-x snap-mandatory overflow-x-auto`

---

### 4. Animation Strategy (Subtle & Fast)

| Element | Effect | Duration |
|---------|--------|----------|
| Course card | `-translate-y-1` + `shadow-xl` | 200ms |
| Card image | `scale-[1.02]` | 200ms |
| Card title | color → emerald-700 | 150ms |
| Filter checkbox | scale bounce | 100ms |
| CTA button | `scale-[1.02]` | 150ms |
| Page enter | skeleton → content | native |

**No Framer Motion** — Tailwind đủ cho subtle effects. KISS.

---

## Implementation Considerations

### Complexity Assessment

| Feature | Effort | Risk |
|---------|--------|------|
| Schema migration (subject, ageGroup) | 2-3h | Low — nullable fields |
| CourseReview model | 2-3h | Low — new table |
| Filter sidebar UI | 4-5h | Medium — URL state sync |
| Course card hover effects | 1h | Low |
| Sticky CTA sidebar | 2-3h | Low |
| Reviews display + write | 4-6h | Medium — new APIs |
| Related courses | 3-4h | Low-Medium |
| Mobile filter drawer | 2-3h | Low |
| **Total** | **~20-25h** | Medium |

### Dependencies & Order

1. Schema migration first (blocks filtering + reviews)
2. Filter sidebar (blocks listing page UX)
3. Card hover effects (independent, can do anytime)
4. Sticky CTA (independent from reviews)
5. Reviews (needs CourseReview table)
6. Related courses (needs subject/ageGroup in schema)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Existing courses có subject=null | Medium | Default filter "Tất cả" bỏ qua null; Admin panel để fill data |
| Review spam/fake | Medium | `isApproved=false` default + admin moderation |
| Sticky sidebar overflow issues | Low | Test on Safari iOS (known sticky quirk) |
| Price slider UX trên mobile | Low | Min/max input fallback thay vì slider |

---

## Success Metrics

- Filter UX: <200ms response khi toggle filter (URL param change → re-render)
- Card hover: smooth 60fps trên mid-range mobile
- Sticky CTA: không bị cut-off trên mobile landscape
- Reviews: aggregate rating query <5ms (denormalized counter)
- Related courses: query <10ms với index

---

## Unresolved Questions

1. `subject` field: required hay nullable cho admin khi tạo course mới?
2. Review moderation: auto-approve sau 7 ngày hay manual approval?
3. Price range slider: step intervals (10k, 50k, 100k VND)?
4. Pagination size: 9 hay 12 cards per page?
5. "Khóa học tương tự" carousel: show khi không có review hay ẩn?

---

## Next Steps

Suggested implementation phases:
1. **Phase 1 (Schema):** Add subject/ageGroup to Course, create CourseReview model
2. **Phase 2 (Listing):** Filter sidebar + hover effects + sort
3. **Phase 3 (Detail):** Sticky CTA + related courses
4. **Phase 4 (Reviews):** Reviews model + display + write flow

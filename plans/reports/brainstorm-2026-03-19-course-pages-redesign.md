# Brainstorm: Course Pages Redesign (SEO + UX + Bug Fix)

**Date:** 2026-03-19
**Approach:** Evolution (A) — incremental, low-risk, 1-2 tuần
**Plan:** `plans/260319-course-pages-redesign-seo-ux/`

---

## Problem Statement

Trang `/courses` và `/courses/[slug]` không tối ưu SEO/conversion, phụ huynh không thấy giá trị rõ ràng. Trang detail bị broken (redirect sai). Design không đồng bộ giữa /courses, /pricing, /parent/courses.

## Goals (4 mục tiêu)
1. Tăng conversion rate (phụ huynh mua khóa)
2. SEO organic traffic từ Google (3 kênh traffic hiện tại: organic, social, word-of-mouth)
3. Giảm confusion khi chọn (ai nên mua khóa nào)
4. Đồng bộ visual design

## Root Cause Found (Bug Critical)

`src/modules/courses/legacy-bundle-routes.ts` sai:
- `entryCourseSlugs` (`["littlefox", "littlefoxcn"]`) bị thêm vào legacy redirect set
- `/courses/littlefox` và `/courses/littlefoxcn` bị `permanentRedirect("/courses")` thay vì hiển thị detail page
- **Fix đã apply:** Xóa `entryCourseSlugs` khỏi set, chỉ giữ `explicitLegacyRouteSlugs`

## Recommended Solution (Approach A - Evolution)

### Phase 1: Bug Fix (DONE)
- `legacy-bundle-routes.ts` fixed — 1 dòng xóa

### Phase 2: SEO Foundation
- JSON-LD Course schema trên detail pages
- ItemList schema trên listing page
- BreadcrumbList schema
- AggregateRating schema (dùng reviewAverageRating/reviewCount có sẵn)
- Meta descriptions unique per course
- OG/Twitter Card tags

### Phase 3: Course Card + Listing UX
- Age group badge nổi bật trên card
- Rating + review count hiển thị
- Enrollment count ("500+ gia đình")
- Outcome statement ("Sau 4 tuần, con sẽ...")
- Time commitment rõ ràng

### Phase 4: Detail Page + Design Sync
- Mobile sticky CTA (above fold)
- Trust signals (enrollment count, guarantee)
- FAQ section cho phụ huynh
- /pricing và /parent/courses sync design

## Key Research Insights

**Parent buyer psychology (Vietnam):**
- 24% household income cho giáo dục → willing to pay, nhưng cần proof
- Parent testimonials > instructor credentials
- Age fit là filter #1 quan trọng nhất
- Outcome-focused > feature-focused copy

**SEO priorities:**
- JSON-LD Course schema → Google rich results
- Canonical tags cho filtered URLs → tránh duplicate
- H1-H3 hierarchy → content authority

**Competitor landscape:**
- Monkey Junior: mobile-first, gamified, 10M+ users
- KidsOnline: B2B2C hybrid
- Differentiation: curriculum transparency + outcome tracking + parent-first UX

## Architecture Decisions

- No DB schema changes (ageGroup, reviewAverageRating, reviewCount đã có)
- enrollmentCount = derived từ `_count.enrollments`
- Shared JSON-LD builder tại `src/lib/seo/course-jsonld.ts`
- Course detail page modularized thành 5 section components (currently 687 lines)

## Unresolved Questions

1. Có muốn hiển thị enrollment count thật hay ẩn khi số nhỏ?
2. Có instructor profile trong DB chưa? (Chưa có — cần thêm hay dùng platform name?)
3. Có đủ parent reviews đã approve để hiển thị không?

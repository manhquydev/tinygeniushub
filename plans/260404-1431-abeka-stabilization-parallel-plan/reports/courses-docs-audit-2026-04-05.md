# Courses Docs Audit (24-48h) - Abeka / WS3

## 1) Source files + timestamps
- `plans/260404-1431-abeka-stabilization-parallel-plan/plan.md` — 2026-04-05 01:27:47
- `plans/260404-1431-abeka-stabilization-parallel-plan/ws3-content-and-commerce-quality.md` — 2026-04-05 01:27:03
- `plans/260404-1431-abeka-stabilization-parallel-plan/ws1-canonical-package-and-doc-sync.md` — 2026-04-04 14:32:04
- `plans/260404-1431-abeka-stabilization-parallel-plan/ws2-abeka-hierarchy-and-allocation-repair.md` — 2026-04-04 14:32:12
- `docs/business/abeka-course-package-design.md` — 2026-04-05 00:54:55
- `docs/abeka-curriculum-system.md` — 2026-04-05 00:54:28
- `docs/DATABASE-MIGRATION-PLAN.md` — 2026-04-04 14:41:25
- `docs/DEPLOYMENT-EXECUTION-PLAN.md` — 2026-04-04 14:42:24
- `docs/IMPLEMENTATION-FIXES-SUMMARY.md` — 2026-04-04 11:31:48

## 2) Mandatory content/data checklist for frontend

### `/courses` (list + card)
- Card layout must be equal height.
- Card must show locked fields: `trackLabel`, `lessonCount`, `duration`, price/free state.
- If `salePriceVnd = 0` then commerce state is `statusLabel=freeTemporary`.
- For free-temporary courses, copy must show `Miễn phí` or `0đ (miễn phí tạm thời)`.
- Do not use copy `Giá đang cập nhật` for free-temporary.

### `/courses/[slug]` (detail)
- Commerce display must be consistent with `/courses` policy.
- If free-temporary, detail must show `0đ (miễn phí tạm thời)`.
- Publish gate dependency: detail content quality must satisfy thresholds before publish.

### Content quality gates (upstream data requirements)
- `Course.description >= 80` chars (published courses).
- `CurriculumPackage.description >= 60` chars (active packages).
- `AbekaVideo.description >= 20` chars.
- Publish is blocked on invalid sale window or description below threshold.
- Publish is not blocked only because course is `0đ` / `isPurchasable=false`.

### Canonical package data source
- Single source of truth: `prisma/seeders/curriculum-packages.ts`.
- Docs must sync to canonical package fields: `code`, `name`, `videoCount`, `monthlyPrice`, `yearlyPrice`, `displayOrder`.

## 3) Current mismatches found
- **Price drift inside `docs/business/abeka-course-package-design.md`:** canonical table vs lower package sections differ (example: yearly prices for Preschool/THPT/English/Math/STEM; also monthly/yearly variations by section).
- **State drift between commerce docs:** WS3 reports all 18 courses currently `0đ` free-temporary, while business package doc presents paid price tables. Need explicit note: package list price vs current storefront promo price.
- **Potential metric drift:** canonical package `videoCount` snapshot uses metadata values (e.g. `ULTIMATE=8500`) while other sections describe full access as `20,195` videos. This can mislead UI if not labeled as metadata vs actual content pool.
- **Legacy/stale value in `docs/IMPLEMENTATION-FIXES-SUMMARY.md`:** sample table includes numbers not matching canonical snapshots (example shown for Middle package yearly price).
- **Spec gap for FE contract:** WS3 locks display fields (`trackLabel`, `lessonCount`, `duration`) but docs in this window do not define exact API field names/fallback/null handling for `/api/courses` and `/api/courses/[slug]`.

## Unresolved questions
- Frontend should read price from `Course` runtime fields or from `CurriculumPackage` canonical fields when they conflict?
- `videoCount` displayed on card/detail should follow canonical metadata or real allocated/available content count?
- Required fallback behavior when `trackLabel`/`lessonCount`/`duration` is missing is not documented.

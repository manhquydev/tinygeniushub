# Planner Report: Course Split Handover Plan

Date: 2026-03-18
Work context: D:\project\cungcontuhoc

## Goal
- Produce executive handover doc giải thích rõ: hiện trạng chia khóa, lý do chia, ý nghĩa giáo dục, bằng chứng dữ liệu.

## Implementation Steps
1. Confirm current split state from DB (published + draft).
2. Verify storefront consistency (bundle metadata, counts, pricing sync).
3. Verify split integrity for pilot SKUs (mapping lesson range/order).
4. Pull educational rationale from existing research docs + current storefront pedagogical copy.
5. Draft executive handover doc theo format quản lý: decision-ready, ngắn, có số liệu, có risk.
6. List decisions cần cấp trên duyệt + next actions 30/60/90 ngày.

## Data Sources To Check
- `scripts/check-courses.js`
- `scripts/education/check-course-storefront-sync.ts`
- `scripts/education/verify-db-pilot-courses.mjs`
- `scripts/education/generate-education-baseline.mjs`
- `plans/2026-03-17-education-agent-team/reports/learning-science-and-market-evidence.md`
- `src/modules/courses/course-bundles.ts`
- `src/modules/courses/course-storefront-content.ts`
- `src/modules/courses/pilot-sku-catalog.ts`

## Executive Handover Structure (Proposed)
1. Executive Summary (5-7 bullets)
2. Current Course Split Snapshot (root vs split vs pilot)
3. Why This Split Exists (product + pedagogy)
4. Educational Meaning by Track (Abeka / LFEN / LFCN)
5. Evidence Table (data integrity, storefront sync, pilot coverage, early CVR)
6. Risks + Controls
7. Decisions Required from Leadership
8. Next 30/60/90 days
9. Unresolved questions

## TODO Checklist
- [ ] Run DB snapshot script and capture counts.
- [ ] Run storefront sync script and capture pass/fail.
- [ ] Run pilot integrity script and capture pass/fail.
- [ ] Pull baseline coverage metrics for pilot scope.
- [ ] Pull latest checkout conversion snapshot.
- [ ] Draft handover doc in `docs/handover/`.
- [ ] Review language for executive audience (ngắn, quyết định được).
- [ ] Add unresolved questions section at end.

## Unresolved questions
- Cấp trên muốn format bàn giao thuần Markdown hay thêm bản slide 1 trang?
- Có cần tách riêng quyết định thương mại và quyết định học thuật thành 2 memo?

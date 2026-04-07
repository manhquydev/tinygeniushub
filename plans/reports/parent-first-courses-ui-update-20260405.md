# Parent-First Courses UI Update - 2026-04-05

## Scope
- Professionalize commerce copy on course detail.
- Re-layout `/courses/[slug]` for parent-first decision flow.
- Re-layout `/courses` cards with equal-height and parent-first hierarchy.
- Audit docs created within ~24-48h for curriculum/course split alignment.

## Implemented
- Detail pricing copy removed internal wording (`admin`, `checkout`) and now uses parent-facing commerce language.
- Added parent-first decision block in detail page (`Con học gì` / `Có hợp không` / `Theo dõi tiến bộ`).
- Moved heavy detail sections into collapsible blocks to reduce overload.
- `/courses` hero + cards now prioritize 3 parent questions and keep equal-height cards.
- Free courses (`salePriceVnd=0`) consistently show `Miễn phí` or `0đ - Đang mở trải nghiệm`.

## Files Changed (this turn)
- `src/components/courses/course-detail-sidebar.tsx`
- `src/app/(main)/courses/[slug]/course-detail-parent-priorities.tsx`
- `src/app/(main)/courses/[slug]/page.tsx`
- `src/components/courses/course-card.tsx`
- `src/app/(main)/courses/page.tsx`

## Verification
- `pnpm exec eslint ...` on changed courses files: PASS.
- `pnpm type-check`: PASS.
- GitNexus impacts before edits for `CoursesPage`, `CourseCard`, `CourseDetailPage`, `CourseDetailSidebar`: LOW.
- GitNexus `detect_changes(scope=unstaged)`: HIGH due large pre-existing unstaged set in workspace, not only this turn.

## Docs Audit (24-48h)
- Source report: `plans/260404-1431-abeka-stabilization-parallel-plan/reports/courses-docs-audit-2026-04-05.md`.
- Locked rules confirmed:
  - `/courses` card equal-height.
  - Must show: `trackLabel`, `lessonCount`, `duration`, free/price state.
  - `salePriceVnd=0` => free-temporary storefront messaging.
- Detected doc drifts recorded in audit report (package pricing sections vs runtime free state, video count interpretation).

## Unresolved Questions
1. Should storefront display package list price (business doc) together with runtime promo/free price, or runtime only?
2. Should `videoCount` shown to parents use canonical package metadata or actual allocated content count?
3. Do we enforce one shared API contract doc for `trackLabel/lessonCount/duration` fallback behavior to avoid future FE drift?

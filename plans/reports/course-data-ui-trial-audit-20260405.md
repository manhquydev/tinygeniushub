# Course Data + UI + Trial Audit (2026-04-05)

## Scope
- Verify course title/lesson metadata is aligned with locked data.
- Enforce all courses `0đ` (free temporary).
- Redesign `/courses/[slug]` toward parent-first reading flow.
- Verify trial videos for every published course.

## Code Changes
- Parent-first detail page flow:
  - `src/app/(main)/courses/[slug]/page.tsx`
  - `src/app/(main)/courses/[slug]/course-detail-hero.tsx`
  - `src/app/(main)/courses/[slug]/course-detail-curriculum.tsx`
  - `src/app/(main)/courses/[slug]/course-detail-parent-priorities.tsx` (new)
  - `src/components/courses/course-detail-sidebar.tsx`
- Prevent future pricing drift in import/split scripts:
  - `scripts/split-large-courses.ts`
  - `scripts/education/import-pilot-courses.mjs`
- Production SQL audit/recheck helpers:
  - `scripts/production/course-metadata-audit.sql`
  - `scripts/production/course-preview-lessons-audit.sql`
  - `scripts/production/course-title-consistency.sql`
  - `scripts/production/course-lesson-order-integrity.sql`
  - `scripts/production/enforce-all-course-zero-price.sql`
  - `scripts/production/check-trial-videos-remote.sh`

## Local Verification
- `pnpm type-check` -> PASS
- `pnpm exec eslint ...` (changed files) -> PASS
- `pnpm exec vitest run src/modules/courses/course-pricing.test.ts src/app/api/admin/courses/[id]/publish/route.test.ts src/app/api/admin/courses/[id]/route.test.ts` -> PASS

## Production Verification
- Build/restart:
  - `pnpm type-check` -> PASS
  - `pnpm build` -> PASS
  - `pm2 restart cungcontuhoc-web`
  - `pm2 restart cungcontuhoc-worker`
- Health:
  - `/api/health` -> `200`

## Data Integrity Results
- Course pricing matrix:
  - `total_courses=18`
  - `salePriceVnd=0` for all `18`
  - `priceVnd=0` for all `18`
  - `listPriceVnd=0` for all `18`
- Published course metadata:
  - `12` published split courses.
  - Lesson sequence integrity: `12/12` `OK` (`orderNo` contiguous, no gaps/dupes).
- Slug/title consistency checks:
  - Level token mapping (`K4/K5/G1/L1/L2`) -> `12/12` pass.
  - Phase naming mapping (`intro|starter` vs `foundation|builder`) -> `12/12` pass.

## Storefront/UI Results
- `/courses` shows free label correctly:
  - `Miễn phí` count detected: `18`.
- `/courses/[slug]` now shows parent-first structure:
  - `Phu huynh thuong muon xem nhanh`
  - `Học thử ... bài đầu`
  - `Thông tin chi tiết thêm` with collapsible blocks.
- Primary CTA for free-temporary flow:
  - `Xem học thử miễn phí`
  - `Nhận tư vấn lộ trình`

## Trial Video Results
- Checked all published courses, preview window `orderNo <= 3`:
  - total checks: `36`
  - `PASS=36`
  - `FAIL=0`
- Endpoint checked:
  - `GET /api/lessons/{lessonId}/video-token`

## Unresolved Questions
- Keep parent-facing copy fully accented Vietnamese, or standardize to ASCII-safe copy to avoid future encoding drift in deployment scripts?
- Keep review/FAQ/related as collapsed blocks (current), or move one of them back to always-visible for conversion tracking?

# Debugger report - production course pricing/trial audit (2026-04-07)

## Scope
- Verify imported course data exists on production DB.
- Verify storefront pricing state that drives CTA behavior.
- Verify trial preview token/stream path for `/courses/[slug]`.

## Production checks run
- SSH host: `152.42.246.218`
- app path: `/var/www/cungcontuhoc`
- app commit: `65c2f129`
- pm2: `cungcontuhoc-web` + `cungcontuhoc-worker` online

## Findings
1. Course import data exists.
- Total courses: 18 rows in `"Course"`.
- Published split courses found: `abeka-*`, `lfen-*`, `lfcn-*`.
- Lesson rows present with large counts (example: `abeka-g1-intro-4w` has 20 lessons).

2. Pricing data on production is all zero.
- Query output shows `listPriceVnd=0`, `salePriceVnd=0`, `priceVnd=0` for all course slugs.
- This forces storefront into non-commercial/pending behavior and removes checkout CTA in old pricing logic.

3. Production code still contains old free-temporary copy/logic.
- Found strings:
  - `Giá thanh toán`
  - `Khóa học đang mở miễn phí tạm thời (0đ).`
  - `COURSE_PRICE_NOT_AVAILABLE`
- Current production pricing resolver at commit `65c2f129` still uses `normalizePositivePrice` for sale price and sets `isPurchasable = salePriceVnd > 0`.

4. Trial preview API responds with HLS secure stream path.
- `/api/lessons/{id}/video-token` returns `ok=true`, `streamType="hls"`, and secure playback URL.
- `/api/lessons/{id}/secure-playback?token=...` returns `307` to `https://fileta.hoctienganh.xyz/...m3u8`.

## Root-cause assessment
- Pricing/CTA issue on production is confirmed from both code + data state:
  - Old resolver logic + all-zero pricing rows.
- Trial preview likely intermittently fails due token/playback flow fragility (secure stream bootstrap), not missing video data.

## Proposed minimal patch set (code)
- `src/components/courses/course-lesson-preview-modal.tsx`
  - Keep token refresh when user clicks `Bắt đầu xem thử`.
  - Default ambiguous secure stream hint to HLS.
  - Add explicit retry CTA `Tải lại video` in unavailable and footer actions.
- `src/app/(main)/courses/[slug]/course-detail-hero.tsx`
  - Add compact "Gợi ý quyết định nhanh" block for per-course personalization and lower cognitive load.

## Ops recommendation (production)
- Backfill non-zero `listPriceVnd/priceVnd` for commercial courses, then use timed `salePriceVnd=0` where needed.
- Deploy latest branch containing updated pricing resolver + free temporary checkout path.

## Unresolved questions
1. What is the approved source-of-truth price matrix for all 18 production courses?
2. Should free-temporary checkout be enabled for bundle checkout targets with amount `0` as well, or course-only?
3. Do we want an automatic migration to recover prices after accidental `enforce-all-course-zero-price.sql` execution?

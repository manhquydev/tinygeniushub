# Brainstorm 2026-03-24 - Courses Customer Clarity Strategy

## Problem statement
- `/courses` và `/courses/[slug]` đang có độ nhiễu quyết định cho phụ huynh.
- Mục tiêu kinh doanh: tăng mua đúng khóa, không chỉ tăng click.
- Mục tiêu UX: phụ huynh hiểu nhanh `khóa này là gì`, `hợp con không`, `học thử ra sao`, `mua có đáng không`.
- Bài toán sống còn: claim trial hiện chưa đồng nhất với implementation.

## Requirements
- Card listing gọn hơn, ưu tiên điều hướng vào detail.
- Detail phải làm vai trò `decision page`, không chỉ `info page`.
- Trial policy phải đúng dữ liệu thực tế.
- Tracking funnel phải đủ để ra quyết định không cảm tính.

## Reality check (hard truths)
1. Giảm data card là đúng, nhưng không phải đòn quyết định nhất.
2. Điểm nghẽn chính là `độ tin + độ hợp` và `chọn điểm bắt đầu đúng`.
3. Nếu claim trial lệch data, trust mất rất nhanh.
4. AB hiện chưa đủ tin cậy vì variant cũ ghi `unknown`.

## Evidence snapshot
- Detail đang lấy preview list `take: 12`: `src/app/(main)/courses/[slug]/page.tsx`.
- Trial thực tế phụ thuộc `isPreview/trialEnabled`, import có nhánh `<=5` hoặc `<=3`: `prisma/scripts/import-three-courses-bootstrap.ts`.
- Preview modal gọi API cần parent auth: `src/app/api/lessons/[lessonId]/video-token/route.ts`.
- AB CVR cũ: variant `unknown` (8 start, 6 success): `docs/handover/packages/2026-03-18-course-split-executive-package/03-evidence/courses-ab-cvr-report.md`.

## Evaluated approaches
### Approach A - Card Lite + Detail Strong (recommended)
- Listing card chỉ giữ thông tin quyết định tối thiểu.
- Detail gánh phần chứng minh phù hợp, trial, trust, comparison.
- Pros: giảm cognitive load, tăng quality click, dễ scale.
- Cons: cần detail thật mạnh và tracking đầy đủ.

### Approach B - Card Balanced (fallback)
- Card giữ outcome ngắn + proof ngắn + giá + CTA.
- Pros: cân bằng clarity/trust.
- Cons: dễ quay lại tình trạng nhồi data nếu thiếu kỷ luật copy.

### Approach C - Deep Card (not recommended for cold traffic)
- Giữ nhiều data ngay listing.
- Pros: user high-intent có thể quyết nhanh.
- Cons: giảm click vào detail, tăng nhiễu cho first-touch.

## Final recommendation
- Chọn Approach A với cấu trúc quyết định theo funnel:
1. `/courses`: discovery + qualification nhẹ.
2. `/courses/[slug]`: decision + risk reduction + checkout.

### IA đề xuất `/courses`
1. Decision hero (1 câu định vị + 1 câu hướng dẫn chọn).
2. Quick chooser 3 câu (mục tiêu, mức hiện tại, thời gian/tuần).
3. Compare strip 3 track.
4. Results + filters + sort.
5. Card gọn.
6. Trust strip.
7. Bottom CTA.

### IA đề xuất `/courses/[slug]`
1. Hero quyết định.
2. Trial block ngay dưới hero.
3. Fit checklist (phù hợp/chưa phù hợp/nên mua khi).
4. Difference block với khóa liền trước/sau.
5. Outcome timeline tuần 1-2-4.
6. Curriculum preview.
7. Trust + risk reversal.
8. Sticky CTA mua + tư vấn level.

## Card vs detail allocation
- Card: khóa là gì (1 dòng), dành cho ai (1 dòng), trial ngắn, giá, CTA `Xem có hợp con không`.
- Detail: entry level, outcome timeline, trial section đầy đủ, comparison, trust stack, checkout lane.

## Trial policy decision
- Không nên claim toàn cục `học thử 7 bài` ngay bây giờ.
- Nếu chưa enforce backend: dùng copy động `Học thử {previewCount} bài đầu`.
- Nếu muốn chốt marketing `7 bài`: cần product contract thống nhất data + API + UI + test trước khi public.

## Measurement plan
### North-star
- Qualified Purchase Rate (purchase quality / unique detail viewers).

### 2-week leading KPIs
1. Catalog -> Detail CTR.
2. Detail -> Trial Preview Play Rate.
3. Detail -> Checkout Start Rate.
4. Checkout Start -> Success Rate.

### 6-week quality KPIs
1. Week-1 activation (>=3 lessons/7 days).
2. D7/D28 retention.
3. Refund/reversal rate.
4. Support ticket rate 7 ngày sau mua.

## Instrumentation backlog
### P0
1. Track full-card click (không chỉ CTA button).
2. Trial events: modal_open, play_start, play_complete, play_fail.
3. Checkout return events: success/fail/cancel + reason.
4. Add funnel_session_id để nối client-server.
5. Alert variant unknown.

### P1
1. Filter/sort usage events.
2. Section engagement detail page.
3. Cohort dashboard theo variant/channel/slug.

## Execution plan (survival order)
### Phase 0 - Measurement + Truth alignment (3-5 ngày)
- Chốt trial policy (dynamic hoặc fixed 7).
- Fix tracking gap tối thiểu.
- Ngưng tranh luận AB copy cho đến khi variant sạch.

### Phase 1 - Listing clarity (4-6 ngày)
- Áp dụng card lite/balanced.
- Bỏ số tổng catalog gây nhiễu.
- Đưa CTA thống nhất theo intent.

### Phase 2 - Detail conversion (5-7 ngày)
- Đưa trial block lên above-the-fold.
- Thêm fit checklist + difference block.
- Tăng lane tư vấn level cạnh lane mua.

### Phase 3 - Validate and iterate (2 tuần)
- Chạy 1 vòng AB nhỏ trên copy/section order sau khi tracking sạch.
- Quyết định scale theo quality metrics, không theo click đơn thuần.

## Risks
1. Card quá nhẹ -> tăng click nhưng giảm mua.
2. Trial claim sai -> rớt trust nhanh.
3. Dữ liệu variant bẩn -> tối ưu sai hướng.
4. Tối ưu checkout ngắn hạn nhưng tăng mua sai level.

## Next steps
1. Chốt policy trial trong tuần này.
2. Chốt KPI ưu tiên sprint (checkout start vs purchase success vs giảm mua sai level).
3. Ship Phase 0 trước, rồi mới UI redesign.

## Unresolved questions
1. Policy chính thức: trial động theo khóa hay fixed 7 bài?
2. Nếu fixed 7 bài: source of truth đặt ở config, DB flag, hay query cap?
3. Priority sprint: tăng `checkout start`, tăng `purchase success`, hay giảm `mua sai level`?
4. Purchase confidence policy: có cho đổi level/chuyển khóa sau mua không?
5. Source of truth dashboard: GA4, SQL audit logs, hay hybrid?

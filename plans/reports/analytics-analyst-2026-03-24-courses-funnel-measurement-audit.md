# Courses Funnel Measurement Audit

Date: 2026-03-24
Scope: /courses, /courses/[slug]

## 1) Data hiện có vs data thiếu

### Data hiện có
- Client analytics (GA/Pixel wrapper):
  - `courses_catalog_view`
  - `courses_bundle_detail_click`
  - `courses_bundle_detail_view`
  - `courses_checkout_start`
- Server audit logs (source đo checkout/purchase thật):
  - `course_checkout_started`
  - `course_purchase_succeeded`
  - `pilot_checkout_started`
  - `pilot_purchase_succeeded`
- Attribution + A/B cookie plumbing:
  - `ab_courses_v` (A/B variant)
  - `ccth_attr_v1` (attribution snapshot)
- Historical conversion snapshot:
  - report `courses-ab-cvr-report.md` (30 ngày): 8 checkout start, 6 purchase success, CVR 75%, variant = unknown.

### Data thiếu / chưa đủ tin cậy
- Thiếu event cho bước funnel bắt buộc: `trial_preview_play` (hiện chưa có open/play/success/fail).
- Thiếu `checkout_success` ở client analytics; purchase đang nằm chủ yếu trong audit log backend.
- `card_click` bị thiếu một phần: full-card overlay link không track, chỉ nút CTA có track.
- Chưa có join key xuyên suốt client -> server:
  - client event không gửi `session_id/event_id` dùng chung với audit log.
- Thiếu event thất bại/huỷ thanh toán chuẩn hóa (`checkout_failed`, `checkout_cancelled`, reason_code).
- Payload quality issue:
  - `courses_catalog_view` đang gửi `bundles` và `tracks` cùng một giá trị, không phản ánh đúng ngữ nghĩa.
- A/B đọc được nhưng lịch sử đã có giai đoạn variant `unknown`; cần coi dữ liệu cũ là low-confidence.

## 2) North-star + supporting metrics cho redesign

### North-star (khuyến nghị)
- `Qualified Purchase Rate (QPR)`
- Định nghĩa: số purchase có chất lượng / số unique detail viewers.
- Purchase có chất lượng = mua thành công và trong 7 ngày đầu có >= 3 lesson completed hoặc >= 1 trial preview + >= 1 lesson completed sau mua.

### Supporting metrics (2 tuần - leading)
- `Catalog -> Detail CTR`
- `Detail -> Trial Preview Play Rate`
- `Detail -> Checkout Start Rate`
- `Checkout Start -> Success Rate`
- `Median time to checkout start` từ first detail view

### Supporting metrics (6 tuần - quality & sustainability)
- `Week-1 Learning Activation Rate` (>=3 lesson/7 ngày)
- `D7 and D28 learner retention`
- `Refund/Reversal rate` (nếu có)
- `Support ticket rate` trong 7 ngày sau mua (proxy cho mismatch kỳ vọng)

### Guardrail metrics
- Refund/reversal tăng => fail guardrail.
- Week-1 activation giảm => fail guardrail.
- Checkout success tăng nhưng D7 retention giảm => fail guardrail.

## 3) Instrumentation backlog ưu tiên (P0/P1)

### P0 (làm trước khi chạy A/B mới)
1. Bổ sung trial events:
- `courses_trial_preview_open`
- `courses_trial_preview_play_start`
- `courses_trial_preview_play_success`
- `courses_trial_preview_play_fail`

2. Sửa tracking click detail:
- Track cả click từ full-card overlay (không chỉ nút CTA).
- Chuẩn hóa thành 1 event `courses_detail_click` với `click_zone` (`card_overlay|cta_button`).

3. Bổ sung checkout outcome events:
- `courses_checkout_success`
- `courses_checkout_failed`
- `courses_checkout_cancelled`
- Kèm `reason_code`, `provider`, `order/session id`.

4. Tạo join key xuyên suốt:
- Sinh `funnel_session_id` ở client, gửi vào checkout API, lưu vào audit log và event client.
- Giúp đo chuẩn full path từ catalog/detail đến purchase.

5. Cứng hóa variant capture:
- Validate `ab_courses_v` tại checkout start + purchase success.
- Alert khi tỉ lệ `variant=unknown` > 5%.

6. Chuẩn hóa schema event catalog:
- Sửa field `bundles/tracks` cho đúng semantics.

### P1 (sau P0)
1. Track filter usage:
- `courses_filter_apply`, `courses_filter_clear`, `courses_sort_change`.

2. Track section-level engagement trên detail:
- `courses_fit_check_view/click`
- `courses_curriculum_expand`
- `courses_reviews_interaction`

3. Track trial-to-paid bridge:
- Event map rõ từ preview bài thử -> checkout start.

4. Build dashboard cohort:
- cohort theo variant, channel attribution, bundle/course slug.

## 4) Cảnh báo bias khi đọc số hiện tại
- Sample size rất nhỏ (8 checkout starts) => CVR dao động mạnh, không đủ kết luận A/B.
- Dữ liệu lịch sử có `variant=unknown` => so sánh variant có thể sai.
- Selection bias:
  - `courses_checkout_start` client không bắn cho user chưa login (redirect sớm), làm thiếu nhu cầu thật ở top funnel.
- Measurement gap bias:
  - Không có `trial_preview_play` => không biết trial đang kéo hay làm rơi user.
- Attribution drift:
  - nếu cookie/flow bị mất ở một số path, phân tích channel/variant bị nhiễu.

## 5) Unresolved questions
1. Refund/reversal hiện lấy từ nguồn nào để làm guardrail realtime?
2. Định nghĩa canonical cho “purchase success” khi dùng nhiều provider là gì (webhook success, redirect success, hay enrollment success)?
3. Có cần đo riêng funnel guest vs logged-in không (vì hiện guest click checkout không vào `courses_checkout_start`)?
4. Chính sách “học thử 7 bài” là global hay phụ thuộc cờ `isPreview` từng course?
5. Team đang dùng dashboard nào làm source of truth (GA4, SQL report, hay both)?

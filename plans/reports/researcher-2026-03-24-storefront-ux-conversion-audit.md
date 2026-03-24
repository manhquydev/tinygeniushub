# Storefront UX Conversion Audit (/courses -> /courses/[slug])

Date: 2026-03-24
Work context: D:\project\cungcontuhoc
Reports path: D:\project\cungcontuhoc\plans\reports\
Plans path: D:\project\cungcontuhoc\plans\

## 1) Findings theo severity + file path

### Critical

1. Trial claim không nhất quán với implementation hiện tại.
- Detail đang lấy cố định `take: 12` lesson đầu để hiển thị preview: `src/app/(main)/courses/[slug]/page.tsx:61`.
- Curriculum copy hiển thị theo `lessons.length` (`Xem trước {lessons.length} bài học đầu tiên`), không phải rule 7 bài: `src/app/(main)/courses/[slug]/course-detail-curriculum.tsx:38`.
- Nếu định vị thương mại là "học thử 7 bài đầu", hiện tại chưa có enforcement ở lớp page data.

2. API video preview gây trải nghiệm sai cho guest và tạo nhiễu trust.
- Modal preview gọi `/api/lessons/[lessonId]/video-token`.
- API yêu cầu auth cứng (`Unauthorized` nếu chưa login): `src/app/api/lessons/[lessonId]/video-token/route.ts:28-30`.
- Modal catch lỗi rồi hiển thị "Video sắp ra mắt" => user dễ hiểu sai là thiếu content, không phải thiếu đăng nhập.

3. Dữ liệu A/B đang không usable để ra quyết định UI.
- Báo cáo 30 ngày: variant toàn bộ = `unknown` (8 checkout start, 6 purchase, 75%):
  - `docs/handover/packages/2026-03-18-course-split-executive-package/03-evidence/courses-ab-cvr-report.md`.
- Không thể kết luận copy/layout nào hiệu quả hơn.

### High

4. Card đang over-inform cho mục tiêu "đẩy vào detail".
- Hiện card gồm: image, lesson badge, age badge, short label, pilot badge, title, description, rating, enrollment, outcome block, price, CTA.
- Files: `src/components/courses/course-card.tsx:59-146`.
- Với traffic lạnh, lượng dữ liệu này tăng cognitive load trước khi user hiểu core fit.

5. Hero listing ưu tiên số tổng catalog hơn quyết định chọn khóa.
- `Tổng bài học`, `Tổng thời lượng` ở listing hero: `src/app/(main)/courses/page.tsx:139,143`.
- Đây là vanity context, không trả lời nhanh "khóa nào hợp con tôi".

6. CTA flow chưa tách rõ 2 intent chính: "đánh giá phù hợp" vs "mua".
- Card CTA hiện tốt (`Xem có hợp con không`), nhưng detail có CTA mua mạnh + fit-check ở sidebar; trial value không nằm above-the-fold.
- Files: `src/app/(main)/courses/page.tsx:227`, `src/components/courses/course-detail-sidebar.tsx:96-99`.

### Medium

7. Tracking event chưa cover đoạn giữa funnel (preview behavior + filter behavior).
- Hiện có view/click/checkout_start, nhưng thiếu event preview open/play/complete và filter usage.
- File: `src/components/courses/course-storefront-tracking.tsx:62-164`.

8. API `video-token` select `isPreview/trialEnabled` nhưng chưa enforce theo entitlement ở route này.
- Select fields có: `isPreview`, `trialEnabled`: `route.ts:42-43`.
- Route vẫn trả token nếu parent đã login và nguồn video sẵn, không check enrollment/preview gating tại đây.
- Có thể gây lệch giữa thông điệp paywall và behavior backend.

## 2) 3 phương án thiết kế card list (lite/balanced/deep) + trade-off

### Option A - Lite (khuyên dùng cho cold traffic)
- Giữ: title, 1-line "dành cho ai", price, 1 CTA.
- Bỏ khỏi card: rating, enrollment, milestone block dài, nhiều badge.
- Trade-off: CVR click vào detail tăng; quality click có thể giảm nhẹ nếu thiếu proof.

### Option B - Balanced (khuyên dùng mặc định)
- Giữ: title, "dành cho ai", 1 proof ngắn (rating hoặc enrollment, chỉ 1), price, CTA.
- Thêm: 1 line outcome 4 tuần (max 1 câu).
- Trade-off: cân bằng clarity và trust, phù hợp phần lớn traffic.

### Option C - Deep (khuyên dùng cho retargeting / high-intent)
- Giữ gần như hiện tại: outcome block + proof + pricing đầy đủ.
- Dùng khi user đã lọc sâu hoặc quay lại lần 2.
- Trade-off: tốt cho user có intent cao; nặng cho first-touch traffic.

## 3) Đề xuất nhanh cho trang detail để chốt mua tốt hơn

1. Đưa block trial lên ngay dưới hero.
- Copy rõ: `Học thử X bài đầu miễn phí` (X lấy từ `previewCount` thực tế hoặc rule business 7).
- CTA cạnh nhau: `Xem bài học thử` + `Mua khóa này`.

2. Sửa thông điệp lỗi preview cho đúng ngữ cảnh.
- Guest: "Bạn cần đăng nhập để xem học thử".
- Video thật chưa sẵn: "Video sắp ra mắt".
- Tránh gom chung 2 trạng thái.

3. Chuẩn hóa decision block trên detail theo thứ tự:
- `Phù hợp nếu` -> `Chưa phù hợp nếu` -> `Nên mua khi` -> `Mốc sau 4 tuần`.
- Không để user phải cuộn sâu mới hiểu fit.

4. Tách copy theo intent stage.
- Stage evaluate: `Xem có hợp con không`.
- Stage commit: `Mua khóa và bắt đầu ngay`.
- Không dùng một loại copy cho mọi trạng thái.

5. Nếu xác định chiến lược 7 bài: enforce ở data layer.
- Tránh để UI nói 7 nhưng backend trả 12/biến thiên.

## 4) Measurement gaps trong tracking events

### Đang có
- `courses_catalog_view`
- `courses_bundle_detail_click`
- `courses_bundle_detail_view`
- `courses_fit_check_click`
- `courses_outcome_timeline_view`
- `courses_difference_block_view`
- `courses_checkout_start`

### Thiếu (P0)
1. `courses_filter_applied` (filter type, value bucket, results count).
2. `courses_card_impression` (position, variant) để tính CTR card thực.
3. `courses_preview_modal_open`.
4. `courses_preview_play_start` / `courses_preview_play_complete`.
5. `courses_checkout_return` (success/fail/cancel + reason).
6. `courses_purchase_success` ở client analytics map với variant.

### Thiếu (P1)
1. `time_to_first_meaningful_action` (catalog -> card click hoặc filter apply).
2. `detail_scroll_depth` theo section (`fit`, `timeline`, `curriculum`).
3. `consult_click_before_checkout` để đo nhu cầu tư vấn level.

## 5) Unresolved questions

1. Business chốt rule trial là "7 bài đầu" hay "theo cờ preview động"?
2. Nếu chốt 7 bài, source of truth nằm ở đâu (DB flag, config, hay query cap)?
3. KPI sprint tới ưu tiên `detail click-through`, `checkout start`, hay `purchase success`?
4. Có muốn giữ card chế độ deep cho retargeting segment, hay unify 1 kiểu card toàn site?
5. Chính sách nếu phụ huynh mua sai level hiện được truyền thông ở đâu (đổi level/tư vấn sau mua)?

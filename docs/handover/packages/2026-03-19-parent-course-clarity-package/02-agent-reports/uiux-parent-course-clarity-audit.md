# UI/UX Audit - Parent Clarity for Courses

Date: 2026-03-19  
Role: UI/UX specialist  
Work context: `D:\project\cungcontuhoc`

## Scope + files reviewed
- `src/app/(main)/courses/page.tsx`
- `src/app/(main)/courses/[slug]/page.tsx`
- `src/modules/courses/course-storefront-content.ts`
- `docs/handover/packages/2026-03-18-course-split-executive-package/01-executive/executive-memo.md`
- `README.md`
- `ui-ux-pro-max` quick benchmark (`product/style/typography/color` domains)

## 1) Audit hiện trạng: điểm gây mơ hồ cho phụ huynh

### A. Trang `/courses` (listing)
1. Thiếu “khung so sánh trước khi vào card”
- Hiện tại vào thẳng grid card, chưa có block trả lời nhanh: `3 nhóm khóa khác nhau ở đâu`.
- Hậu quả: phụ huynh phải tự đọc từng card rồi tự suy luận khác biệt.

2. Hero metrics gây nhiễu quyết định mua
- `Số khóa / Tổng bài / Tổng thời lượng` là số tổng catalog, không giúp chọn khóa đúng cho con.
- Hậu quả: nhiều thông tin nhưng không trả lời câu hỏi “khóa nào hợp con tôi bây giờ”.

3. Card chưa trả lời rõ “khác khóa kia ở đâu”
- Card có `shortLabel`, `description`, `bestFor`, `duration`, `lessonCount`, `price`.
- Nhưng thiếu block so sánh chuẩn hóa giữa các card (`mục tiêu đầu ra`, `điểm bắt đầu`, `không phù hợp nếu...`, `khi nên mua`).

4. CTA card còn generic
- `Xem khóa và bắt đầu` hoặc `Xem chi tiết khóa` chưa phản ánh intent của phụ huynh chưa chắc level.
- Với catalog split nhiều SKU (memo: 3 root + 28 split + pilot), CTA hiện tại chưa dẫn hướng chọn đúng mức trước khi mua.

5. Nội dung có dữ liệu mạnh nhưng chưa dùng hết
- `course-storefront-content.ts` có `parentProblem`, `outcomes`, `parentVisibleValue`, nhưng listing chưa khai thác rõ để tăng clarity.

### B. Trang `/courses/[slug]` (detail)
1. Hero mạnh về mô tả, yếu về định vị tương đối
- Có `title`, `description`, `promise`, `lesson/duration`, giá.
- Thiếu block “khóa này đứng ở đâu trong lộ trình” và “khác khóa liền trước/liền sau thế nào”.

2. Chưa có checklist readiness (“khi nào nên mua”)
- Chưa có tiêu chí để phụ huynh tự xác định `mua ngay` vs `chưa nên mua`.
- Hậu quả: tăng do dự, hoặc mua sai level.

3. “Dành cho ai” có nhưng “không dành cho ai” chưa rõ
- Có `bestFor`, nhưng thiếu “chưa phù hợp nếu...”, làm phụ huynh khó loại trừ nhanh.

4. Bài học hiển thị nhiều nhưng chưa translate thành giá trị phụ huynh quan sát được
- Có lesson list khá chi tiết.
- Thiếu lớp diễn giải: sau 2-4 tuần phụ huynh sẽ nhìn thấy tiến bộ gì cụ thể.

5. CTA detail thiên về checkout, thiếu nhánh tư vấn nhanh
- Có `Mua khóa...` + `Liên hệ tư vấn` (ở dưới).
- Thiếu secondary CTA gần hero kiểu `Kiểm tra phù hợp 60s` hoặc `So sánh với khóa gần nhất` để giảm sai mua.

## 2) Bố cục mới đề xuất

## 2.1 `/courses` - Parent decision-first catalog
Mục tiêu: phụ huynh vào trang 5-10 giây hiểu ngay 4 câu:
- Khóa này là gì?
- Khác khóa kia ở đâu?
- Dành cho ai?
- Khi nào nên mua?

### Display order (đề xuất)
1. `Decision Hero` (1 câu định vị + 1 câu hướng dẫn chọn)
2. `3-track Compare Strip` (Abeka vs LF English vs LF Chinese, dạng bảng ngắn)
3. `Quick Fit Filters` (Mục tiêu, độ tuổi/lớp, trình độ hiện tại, thời lượng học/tuần)
4. `Course Cards` (chuẩn hóa theo cùng khung thông tin)
5. `How to choose in 60s` (3 bước)
6. `Trust + outcomes` (kết quả phụ huynh quan sát được)
7. `Bottom CTA band`

### Course card structure mới (text-first)
- Dòng 1: `Track + Level/Grade badge`
- Dòng 2: `Khóa này là gì` (1 câu plain language)
- Dòng 3: `Khác khóa bên cạnh ở đâu` (1 bullet duy nhất, cụ thể)
- Dòng 4: `Dành cho ai` (1 bullet)
- Dòng 5: `Khi nên mua` (trigger ngắn)
- Dòng 6: `Output sau 4 tuần` (1-2 bullet)
- Dòng 7: `Giá + thời hạn + số bài`
- CTA chính: `Xem có hợp con không`
- CTA phụ: `So sánh với khóa cùng track`

## 2.2 `/courses/[slug]` - Conversion with confidence
Mục tiêu: trước khi bấm mua, phụ huynh phải tự tin rằng khóa đúng nhu cầu hiện tại.

### Display order (đề xuất)
1. `Hero clarity block`
- Tên khóa
- 1 câu “khóa này là gì”
- 1 câu “dành cho ai”
- Giá + CTA cụm

2. `Fit & timing panel` (ngay dưới hero, above the fold)
- `Phù hợp khi...` (3 check)
- `Chưa phù hợp khi...` (2-3 cảnh báo)
- `Nên mua ngay khi...` (trigger ngắn)

3. `Difference block`
- So sánh nhanh với 2 khóa gần nhất:
  - khóa trước (dễ hơn)
  - khóa sau (khó hơn)
- Cột so sánh: đầu vào, mục tiêu, khối lượng, kết quả kỳ vọng.

4. `Outcome timeline`
- Tuần 1-2: phụ huynh thấy gì
- Tuần 3-4: phụ huynh thấy gì
- Sau hoàn thành: con đạt gì

5. `Curriculum preview`
- Lesson list giữ lại, nhưng thêm nhãn `core skill` cho từng cụm bài.

6. `Risk reversal + support`
- Hỗ trợ chọn level, FAQ ngắn trước checkout.

7. `Sticky bottom CTA` (mobile + desktop rail)
- Giá
- CTA chính
- CTA phụ tư vấn

## 3) Wireframe content blocks (text-first)

## 3.1 Wireframe `/courses`

### Block 01 - Decision Hero
- Heading: `Chọn đúng khóa để con tiến bộ sớm, không học sai mức`
- Subcopy: `Bắt đầu từ mục tiêu của con hôm nay, không cần đoán level.`
- Microcopy: `Mỗi khóa đều ghi rõ: dành cho ai, khác gì, khi nào nên mua.`

### Block 02 - 3-track Compare Strip
- Columns: `Abeka | Little Fox English | Little Fox Chinese`
- Rows (fixed):
  - `Mục tiêu chính`
  - `Dành cho ai`
  - `Đơn vị tiến trình (cấp lớp/cấp độ)`
  - `Khi nên bắt đầu`
- CTA row: `Xem tất cả khóa trong track`

### Block 03 - Quick Fit Filters
- Fields:
  - `Con đang cần gì nhất?` (đọc hiểu / nghe nói / bắt đầu tiếng Trung...)
  - `Mức hiện tại` (mới bắt đầu / đang học dở / cần tăng tốc)
  - `Thời gian học mỗi tuần` (<60p / 60-120p / >120p)
- Output text: `Gợi ý 3 khóa phù hợp nhất`

### Block 04 - Standardized Course Cards
- Each card copy template:
  - `Khóa này là: ...`
  - `Khác với [khóa gần nhất]: ...`
  - `Dành cho: ...`
  - `Nên mua khi: ...`
  - `Sau 4 tuần phụ huynh thường thấy: ...`
- CTA primary: `Xem có hợp con không`
- CTA secondary: `So sánh nhanh`

### Block 05 - How to choose in 60s
- Step 1: `Chọn mục tiêu`
- Step 2: `Đối chiếu dấu hiệu hiện tại của con`
- Step 3: `Chốt khóa theo trigger nên mua`

### Block 06 - Trust & Parent-visible outcomes
- 3-4 bullets từ `parentVisibleValue` theo từng track
- Một note rõ: `Nếu chưa chắc level, ưu tiên tư vấn trước khi thanh toán.`

### Block 07 - Bottom CTA band
- Primary: `Nhận đề xuất khóa trong 60s`
- Secondary: `Liên hệ tư vấn chọn level`

## 3.2 Wireframe `/courses/[slug]`

### Block 01 - Hero clarity
- Title
- `Khóa này là gì:` 1 câu
- `Dành cho ai:` 1 câu
- Pricing + urgency nhẹ (không gây áp lực)
- CTA primary: `Mua khóa này`
- CTA secondary: `Kiểm tra độ phù hợp 60s`

### Block 02 - Fit checklist
- `Phù hợp nếu:`
  - ...
  - ...
  - ...
- `Chưa phù hợp nếu:`
  - ...
  - ...
- `Khi nào nên mua:`
  - trigger 1
  - trigger 2

### Block 03 - Difference vs adjacent courses
- Mini-table:
  - `Khóa hiện tại`
  - `Khóa trước`
  - `Khóa sau`
- Criteria:
  - đầu vào
  - mục tiêu đầu ra
  - độ khó
  - nhịp học khuyến nghị

### Block 04 - Expected outcomes timeline
- `Tuần 1-2:` ...
- `Tuần 3-4:` ...
- `Sau hoàn thành:` ...

### Block 05 - Curriculum preview
- Lesson group A/B/C
- mỗi group ghi `kỹ năng chính` + `time budget`

### Block 06 - Purchase confidence
- `Sau thanh toán nhận gì ngay`
- `Nếu sai mức xử lý thế nào`
- `Kênh hỗ trợ nhanh`

### Block 07 - Sticky CTA
- Primary: `Mua khóa này`
- Secondary: `Nhờ tư vấn chọn level`
- Context note: `Bạn đang xem cấp độ X của track Y`

## 4) CTA strategy (theo trạng thái phụ huynh)

### Stage A - Chưa rõ nhu cầu
- Primary CTA: `Nhận đề xuất khóa trong 60s`
- Secondary CTA: `So sánh 3 lộ trình`
- KPI: filter completion rate, click compare rate

### Stage B - Đã shortlist nhưng chưa chắc level
- Primary CTA: `Xem có hợp con không`
- Secondary CTA: `Nhờ tư vấn chọn level`
- KPI: detail view to fit-check completion

### Stage C - Đủ tự tin mua
- Primary CTA: `Mua khóa này`
- Secondary CTA: `Xem chính sách hỗ trợ sau mua`
- KPI: checkout start rate, purchase success rate

### CTA placement rules
- Listing:
  - top: discovery CTA (`đề xuất trong 60s`)
  - card: evaluation CTA (`xem có hợp con không`)
  - bottom: support CTA (`tư vấn`)
- Detail:
  - hero: purchase + fit-check dual CTA
  - mid-page: compare CTA
  - sticky bottom: purchase CTA luôn hiển thị

## 5) Nội dung nên tận dụng ngay từ data hiện có
- Từ `course-storefront-content.ts`:
  - Đưa `parentProblem` lên listing/detail để phụ huynh nhận diện đúng pain point.
  - Đưa `outcomes` thành timeline kỳ vọng.
  - Đưa `parentVisibleValue` thành block “phụ huynh sẽ thấy gì”.
- Từ memo 2026-03-18:
  - Catalog đã split sâu -> UI bắt buộc có compare chuẩn hóa, không thể chỉ dùng mô tả tự do từng card.

## 6) Quick win implementation priority (UI copy/layout first)
1. Thêm compare strip + standardized card template ở `/courses`.
2. Thêm fit checklist + difference block ở `/courses/[slug]`.
3. Đổi CTA label theo intent (`xem có hợp con không` trước `mua`) ở stage khám phá.
4. Đưa `parentProblem/outcomes/parentVisibleValue` vào render thay vì chỉ dùng `bestFor/promise`.

## Unresolved questions
- Có muốn chuẩn hóa một taxonomy duy nhất cho `đầu vào/đầu ra` giữa tất cả track để render bảng so sánh tự động không?
- Priority KPI sprint này là tăng `checkout start` hay giảm `mua sai level` (để cân CTA buy vs CTA fit-check)?
- Có policy rõ cho xử lý trường hợp phụ huynh mua nhầm level chưa (đổi level/chuyển khóa), để viết block “purchase confidence” chính xác?
- Có giữ song song root + split catalog trên UI công khai trong Q2/2026 hay chuyển hẳn split-first?

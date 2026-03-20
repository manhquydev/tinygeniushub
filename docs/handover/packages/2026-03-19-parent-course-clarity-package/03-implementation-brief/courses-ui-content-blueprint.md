# Courses UI Content Blueprint (Parent Clarity)

Date: 2026-03-19  
Goal: biến trang khóa học thành giao diện “quyết định mua”, không còn mơ hồ.

## 1) Nguyên tắc hiển thị

1. Mỗi màn hình phải trả lời được 4 câu:
- Khóa này là gì?
- Khác khóa kia ở đâu?
- Dành cho ai?
- Khi nào nên mua?
2. Mỗi block chỉ 1 mục tiêu quyết định, tối đa 3-5 ý quét nhanh.
3. Ưu tiên ngôn ngữ outcome (thấy được sau 2-4 tuần), tránh mô tả chung chung.

## 2) Blueprint cho `/courses` (listing)

## Block A - Decision Hero
- Heading: `Chọn đúng khóa để con tiến bộ sớm, không học sai mức`
- Subcopy: `Bắt đầu từ mục tiêu hiện tại của con, không cần đoán level.`

## Block B - Compare Strip (3 track)
- Cột: `Abeka`, `Little Fox EN`, `Little Fox CN`
- Dòng:
- Mục tiêu chính
- Dành cho ai
- Đơn vị tiến trình (grade/level)
- Trigger nên bắt đầu
- CTA nhỏ: `Xem track này`

## Block C - Quick Fit Filters
- Inputs:
- Mục tiêu chính của con
- Mức hiện tại (mới bắt đầu/đang học/cần tăng tốc)
- Quỹ thời gian mỗi tuần
- Output: `Gợi ý 3 khóa phù hợp`

## Block D - Standardized Course Card
- Trường bắt buộc:
- Khóa này là gì (1 câu)
- Khác khóa lân cận ở đâu (1 bullet)
- Dành cho ai (1 bullet)
- Nên mua khi nào (1 bullet)
- Sau 4 tuần thấy gì (1-2 bullet)
- Số bài, thời hạn, giá
- CTA chính: `Xem có hợp con không`
- CTA phụ: `So sánh nhanh`

## Block E - 60s Selection Guide
- Step 1: Chọn mục tiêu
- Step 2: Đối chiếu dấu hiệu hiện tại
- Step 3: Chốt khóa theo trigger mua

## 3) Blueprint cho `/courses/[slug]` (detail)

## Block 1 - Hero Clarity
- Tên khóa
- `Khóa này là gì` (1 câu)
- `Dành cho ai` (1 câu)
- Giá + CTA cụm

## Block 2 - Fit Checklist (P1)
- `Phù hợp nếu...` (3 ý)
- `Chưa phù hợp nếu...` (2-3 ý)
- `Nên mua ngay khi...` (2 ý)

## Block 3 - Difference Block (P1)
- So sánh với khóa trước/sau trong cùng track:
- đầu vào
- mục tiêu đầu ra
- độ khó
- nhịp học

## Block 4 - Outcome Timeline (P1)
- Tuần 1-2: phụ huynh thấy gì
- Tuần 3-4: phụ huynh thấy gì
- Sau hoàn thành: con đạt gì

## Block 5 - Curriculum Preview
- Nhóm bài + kỹ năng chính + time budget

## Block 6 - Purchase Confidence
- Mua xong nhận gì ngay
- Nếu chưa chắc level thì làm gì
- Kênh hỗ trợ nhanh

## Block 7 - Sticky CTA
- CTA chính: `Mua khóa này`
- CTA phụ: `Chưa chắc level? Nhờ tư vấn`

## 4) Copy differentiation (dùng trực tiếp)

## Abeka
- `Khóa này là`: Lộ trình học thuật theo cấp lớp.
- `Khác biệt`: Đi theo grade K4-G12, ưu tiên nền đọc hiểu-từ vựng-tư duy.
- `Dành cho`: phụ huynh muốn lộ trình bài bản theo lớp.
- `Nên mua khi`: con cần đi đúng nhịp học thuật theo cấp lớp.

## Little Fox EN
- `Khóa này là`: Luyện nghe-đọc tiếng Anh qua truyện theo level.
- `Khác biệt`: Đi theo level 1-9, nhịp bài ngắn, tăng đều độ khó.
- `Dành cho`: phụ huynh muốn tăng nghe hiểu và phản xạ tiếng Anh.
- `Nên mua khi`: con học tốt bằng truyện/video và cần lộ trình rõ.

## Little Fox CN
- `Khóa này là`: Lộ trình nhập môn tiếng Trung theo level.
- `Khác biệt`: Đi theo level 1-5, ưu tiên giảm quá tải đầu vào.
- `Dành cho`: phụ huynh muốn con bắt đầu tiếng Trung có kiểm soát nhịp.
- `Nên mua khi`: con mới làm quen tiếng Trung và cần tiến dần từng bước.

## 5) CTA strategy theo trạng thái phụ huynh

1. Chưa rõ nhu cầu:
- CTA chính: `Nhận đề xuất khóa trong 60s`
2. Đã shortlist nhưng chưa chắc level:
- CTA chính: `Xem có hợp con không`
3. Đã sẵn sàng mua:
- CTA chính: `Mua khóa này`
- CTA phụ: `Nhờ tư vấn chọn level`

## 6) Acceptance criteria cho sprint

1. Trang list có compare strip + quick-fit + standardized card.
2. Trang detail có fit checklist + difference block + outcome timeline.
3. Mỗi khóa hiển thị rõ “dành cho ai/không dành cho ai”.
4. CTA discovery được đổi sang ngữ cảnh đánh giá phù hợp trước mua.
5. Sự khác biệt giữa 3 khóa đọc hiểu được trong <=20 giây quét mắt.

## Unresolved questions

- Có đủ dữ liệu để hiển thị entry-level tự động ngay sprint này không?
- KPI ưu tiên để chốt A/B là conversion hay giảm mua sai level?
- Có cần public policy đổi level sau mua trên detail page không?

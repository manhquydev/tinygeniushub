# Executive Summary - Parent Course Clarity

Date: 2026-03-19  
From: Agent Team (planner + UI/UX + copywriting + education researcher)

## Bài toán

- Phụ huynh đang thấy khóa học “na ná nhau”, thiếu khung để trả lời nhanh:
- Khóa này là gì?
- Khác khóa kia ở đâu?
- Dành cho ai?
- Khi nào nên mua?

## Kết luận chính

- Friction hiện tại nằm ở `decision scaffolding`, không phải thiếu nội dung.
- Trang `/courses` đang mạnh về số liệu tổng, yếu về so sánh và định hướng chọn khóa.
- Trang `/courses/[slug]` đã có CTA mua, nhưng thiếu khối `phù hợp/không phù hợp` và `khác khóa liền kề`.
- Dữ liệu nội bộ đã có đủ nền để làm rõ hơn (parentProblem, outcomes, parentVisibleValue), nhưng chưa render hết trên UI.

## Khung phân biệt 3 khóa (để hiển thị rõ ngay trên UI)

| Khóa | Dành cho ai | Khác biệt chính | Trigger nên mua |
|---|---|---|---|
| Abeka | Phụ huynh muốn nền học thuật theo cấp lớp | Trục tiến bộ theo grade K4-G12 | Con cần lộ trình bài bản theo lớp, cần mốc theo tuần rõ |
| Little Fox EN | Phụ huynh muốn tăng nghe-đọc tiếng Anh qua truyện | Trục level 1-9, nhịp unit ngắn dễ duy trì | Con hợp học qua truyện, cần duy trì đều hàng ngày |
| Little Fox CN | Phụ huynh muốn nhập môn tiếng Trung có lộ trình | Trục level 1-5, ưu tiên giảm quá tải đầu vào | Con mới bắt đầu tiếng Trung, cần tiến dần từng bước |

## Quyết định đề xuất

1. Chuyển UI từ “catalog summary-first” sang “decision-first” ngay sprint tới.
2. Bắt buộc thêm 3 block P1:
- `Khóa này dành cho ai / không dành cho ai`
- `Khác gì khóa bên cạnh`
- `Sau 4 tuần phụ huynh thấy gì`
3. Đổi CTA discovery từ “mua ngay” sang “xem có hợp con không” ở list và upper detail.
4. Fix tracking variant trước khi chạy A/B message mới.

## Scope triển khai nhanh (1 sprint)

- `/courses`:
- thêm compare strip 3 track
- thêm quick-fit filters (mục tiêu, mức hiện tại, thời gian/tuần)
- chuẩn hóa card copy theo template phân biệt
- `/courses/[slug]`:
- thêm fit checklist (phù hợp/không phù hợp)
- thêm khối so sánh với khóa trước/sau
- thêm outcome timeline tuần 1-2 / tuần 3-4 / sau hoàn thành

## KPI đo sau rollout

- `% phụ huynh chọn đúng track trong <= 90 giây` (test task-based)
- `detail view -> checkout start`
- `checkout start -> purchase`
- `% case mua sai level` (hoặc yêu cầu đổi level sau mua)

## Unresolved questions

- Triển khai quiz/placement nhẹ ngay sprint này hay để phase 2?
- KPI ưu tiên điều hành trong 2 tuần đầu là conversion hay giảm mua sai level?
- Chính sách xử lý mua nhầm level đã đủ rõ để hiển thị công khai chưa?

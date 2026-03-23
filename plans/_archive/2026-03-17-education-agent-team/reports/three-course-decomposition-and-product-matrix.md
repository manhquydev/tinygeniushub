# Three-Course Decomposition and Product Matrix

## 1) Hiện trạng học liệu (trong repo)

Nguồn dữ liệu nội bộ:
- `docs/api/program-bootstrap/three-courses-program-summary.md`
- `docs/api/program-bootstrap/three-courses-program.json`
- `scripts/analyze_courses.ts` (đã chạy ngày 2026-03-17)

### Tổng quan quy mô
| Course | Levels/Grades | Collections/Series | Lessons/Episodes | Videos |
|---|---:|---:|---:|---:|
| abeka | 14 grade (k4..g12) | 14 | 2,380 lessons | 20,195 |
| littlefox | 9 levels | 137 series | 8,718 episodes | n/a |
| littlefoxcn | 5 levels | 48 series | 1,983 episodes | n/a |

### Nhịp học hiện có trong bootstrap
- `abeka`: K4/K5 ~4 lesson/tuần; G1+ ~5 lesson/tuần.
- `littlefox`: L1-2 ~5 episode/tuần; L3-5 ~4; L6+ ~3.
- `littlefoxcn`: hiện dùng nhịp tương đương littlefox theo level.

## 2) Nguyên tắc tách khóa (giữ cũ + thêm mới)

Giữ phần cũ (ổn định):
- Lộ trình tuyến tính theo grade/level.
- Nền tảng kỹ năng theo thứ tự độ khó.
- Tiến độ học theo tuần rõ ràng.

Thêm phần mới (linh hoạt):
- Mỗi lesson thêm checkpoint truy hồi 2-5 phút.
- Chia nhỏ theo outcome thay vì chỉ theo nguồn nội dung thô.
- Tạo micro-course 2-6 tuần để phụ huynh dễ mua thử và thấy kết quả sớm.
- Mỗi track có phiên bản self-paced + phiên bản có coaching/tutoring.

## 3) Danh mục micro-course đề xuất

## Nhóm A: Abeka Skills Track (theo grade)
Mỗi grade `170 lessons` tách thành:
1. `Foundation` (51 lessons)
2. `Core` (85 lessons)
3. `Mastery` (34 lessons)

SKU đề xuất cho mỗi grade:
- `A-Intro-4W`: 16-20 lesson (tripwire)
- `A-Foundation-10W`: phần Foundation còn lại
- `A-Core-17W`: phần Core
- `A-Mastery-7W`: phần Mastery

Kết quả: mỗi grade thành 4 SKU; 14 grade => 56 SKU nhỏ.

## Nhóm B: Little Fox EN Fluency Track (theo level + series)
Mỗi level tách 3 tầng:
1. `Story Starter` (phase 1)
2. `Story Builder` (phase 2)
3. `Story Mastery` (phase 3)

SKU mẫu theo level:
- `LFEN-Lx-Starter-6W`
- `LFEN-Lx-Builder-10W`
- `LFEN-Lx-Mastery-6W`

Ưu tiên làm trước: L1-L3 (nhu cầu đầu vào lớn, dễ chứng minh tiến bộ).

## Nhóm C: Little Fox CN Track
Dùng khung tương tự EN nhưng sản phẩm gọn hơn:
- `LFCN-Lx-Starter-5W`
- `LFCN-Lx-Builder-8W`
- `LFCN-Lx-Mastery-5W`

Ưu tiên sản xuất: L1-L2 trước, sau đó mở rộng L3-L5.

## Nhóm D: Cross-course Outcome Bundles (để tăng AOV)
Bundle theo mục tiêu phụ huynh, không theo nguồn nội dung:
- `Nghe hiểu nền tảng 8 tuần` (Abeka + LittleFox EN L1-2)
- `Đọc hiểu kể chuyện 10 tuần` (LittleFox EN/CN + bài truy hồi)
- `Tăng tốc từ vựng học thuật 6 tuần` (Abeka G3+ + LittleFox L3+)

## 4) Funnel thương mại đề xuất

1. `Free`: placement + 7 ngày học mẫu
2. `Tripwire`: micro-course 2-4 tuần
3. `Core`: track 8-12 tuần
4. `Premium`: track + tutoring nhóm nhỏ
5. `Subscription`: học liên tục theo tháng/quý

KPI theo tầng:
- Free -> Tripwire CVR
- Tripwire -> Core CVR
- Core completion rate
- Subscription month-2 retention
- Payback period theo kênh acquisition

## 5) Phân bổ tài nguyên (đề xuất thực thi)

Nguyên tắc ưu tiên:
- Ưu tiên SKU có `impact học tập cao` + `thời gian sản xuất thấp` + `nhu cầu cao`.

Thứ tự triển khai 90 ngày:
1. Pilot 12 SKU:
- Abeka: k4, k5, g1 mỗi grade 2 SKU đầu
- LittleFox EN: L1, L2 mỗi level 2 SKU đầu
- LittleFox CN: L1 2 SKU đầu
2. Đo KPI 4 tuần, khóa nào đạt ngưỡng thì nhân rộng.
3. Mở rộng sang g2-g3, LFEN L3, LFCN L2.

Ngưỡng scale gợi ý:
- Completion >= 55%
- Tripwire -> Core >= 18%
- Hoàn vốn CAC <= 2.5 tháng

## 6) Rủi ro chính
- Quá nhiều SKU làm phức tạp vận hành nếu không chuẩn hóa template lesson.
- Tập trung marketing quá sớm vào "AI" có thể lệch kỳ vọng phụ huynh.
- Nếu không có checkpoint đánh giá, khó chứng minh hiệu quả để giữ chân thuê bao.

## 7) Kết luận hành động
- Tách khóa lớn thành micro-course là khả thi ngay trên dữ liệu hiện có.
- Nên chạy chiến lược hai tốc độ: pilot nhỏ để học nhanh, rồi scale theo KPI.
- Trục định vị: "kết quả học tập đo được" + "hành trình ngắn, dễ theo cho phụ huynh".

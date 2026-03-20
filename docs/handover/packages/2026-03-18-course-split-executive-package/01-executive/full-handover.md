# Bàn giao cấp cao: Lý do chia khóa học hiện tại và ý nghĩa giáo dục

Date: 2026-03-18
Owner: Education Agent Team (execution by lead)
Scope: Kiểm tra lại cấu trúc khóa học đang chạy trong DB + storefront + pilot split

## 1) Executive summary
- Hệ hiện tại đang chạy mô hình 3 tầng: `3 khóa gốc` + `28 khóa tách chính thức` + `12 SKU pilot micro-course`.
- Split catalog đã active và có adoption rõ: enrollments ở nhánh split (`153`) cao hơn root monolith (`7`).
- Tính toàn vẹn kỹ thuật của pilot split đang sạch (`issues=0`), storefront sync giữa dữ liệu học liệu và trang bán hàng đang `PASS 3/3 bundle`.
- Cách chia hiện tại hợp lý cho giáo dục: giữ progression theo grade/level, giảm tải nhận thức cho phụ huynh, tạo milestone ngắn để đo tiến bộ.
- Điểm cần xử lý ngay: tracking biến thể A/B đang ghi `unknown`, làm giảm giá trị đọc kết quả thực nghiệm thông điệp.

## 2) Hiện trạng course split (đã verify)

### 2.1 Snapshot DB hiện tại
- Total courses: `43`
- Published courses: `31`
- Root monolith published: `3` (`abeka`, `littlefox`, `littlefoxcn`)
- Split published: `28`
  - Abeka theo grade: `14` course (`abeka-k4..abeka-g12`)
  - Little Fox EN theo level: `9` course (`little-fox-en-level-1..9`)
  - Little Fox CN theo level: `5` course (`little-fox-cn-level-1..5`)
- Pilot micro-course draft: `12` SKU, chưa publish (`published=0`)

### 2.2 Quy mô học liệu
- Abeka: `2,380 lessons`, `20,195 videos`
- Little Fox EN: `8,718 episodes`
- Little Fox CN: `1,983 episodes`

### 2.3 Adoption nhanh
- Enrollments root: `7`
- Enrollments split: `153`
- Enrollments pilot: `0` (đúng vì chưa publish)

## 3) Vì sao chia như vậy (business + pedagogy)

### 3.1 Giảm ma sát quyết định cho phụ huynh
- Monolith quá lớn (mua 1 lần, phạm vi rất rộng) khó chọn điểm bắt đầu.
- Chia theo grade/level giúp phụ huynh trả lời nhanh 3 câu: học gì, học bao lâu, đang ở mức nào.

### 3.2 Giữ trục tiến bộ giáo dục, không chia tùy tiện
- Trục Abeka: grade progression (K4 -> G12), phù hợp logic readiness học thuật tăng dần.
- Trục Little Fox EN/CN: level progression, phù hợp logic phát triển năng lực ngôn ngữ theo độ khó.
- Không phá cấu trúc nguồn: split là tái đóng gói phạm vi học, không đảo curriculum order.

### 3.3 Chuyển từ "khóa dài" sang "mốc ngắn đo được"
- Framework phase (`foundation/core/mastery`) cho từng scope giữ được mục tiêu dài hạn.
- Pilot SKU 4-8 tuần tạo kết quả sớm, dễ quan sát tiến bộ tuần và giảm drop-off đầu kỳ.

### 3.4 Vận hành an toàn
- Giữ song song root + split để không đứt compatibility và không làm gián đoạn funnel cũ.
- Storefront đang map đúng dữ liệu split (`PASS`) nên scale không cần đổi kiến trúc lớn.

## 4) Ý nghĩa giáo dục theo từng track

### 4.1 Abeka (Academic readiness)
- Ý nghĩa: xây nền đọc hiểu/từ vựng/tư duy học thuật theo cấp lớp.
- Lợi ích giáo dục: tránh học vượt hoặc học hụt so với mức sẵn sàng của trẻ.
- Ý nghĩa cho phụ huynh: theo dõi tiến độ rất rõ theo grade, dễ set mục tiêu tuần.

### 4.2 Little Fox EN (Listening + reading fluency)
- Ý nghĩa: phát triển năng lực nghe hiểu và phản xạ tiếng Anh qua chuỗi truyện tăng dần.
- Lợi ích giáo dục: học đều bằng unit ngắn, dễ duy trì thói quen dài hạn.
- Ý nghĩa cho phụ huynh: thấy rõ level hiện tại, điểm chuyển level, số tập còn lại.

### 4.3 Little Fox CN (Chinese beginner pathway)
- Ý nghĩa: lộ trình nhập môn tiếng Trung có kiểm soát nhịp độ.
- Lợi ích giáo dục: giảm quá tải đầu vào, giữ nhịp lặp đều cho trẻ mới bắt đầu.
- Ý nghĩa cho phụ huynh: minh bạch trạng thái học theo level và milestone ngắn.

## 5) Bằng chứng kỹ thuật và vận hành

| Claim | Evidence | Kết luận |
|---|---|---|
| Split đang sync đúng storefront | `course-storefront-sync-report.md` => PASS 3/3 | Đạt |
| Pilot split không sai lệch lesson mapping/order | `pilot-db-integrity.json` => issues=0 | Đạt |
| Pilot scope đủ lớn để test | `course-baseline-metrics.json` => coverage ~21-23% lessons/episodes | Đạt cho pilot |
| Early checkout funnel có tín hiệu | `courses-ab-cvr-report.md` => 8 start, 6 success (75%) | Có tín hiệu, mẫu nhỏ |
| Tracking variant cho A/B chưa usable | `courses-ab-cvr-report.md` => variant=unknown | Cần fix ngay |

## 6) Rủi ro hiện tại
- Rủi ro đo lường: A/B variant chưa capture đúng -> khó kết luận copy nào tốt.
- Rủi ro vận hành catalog: song song root + split có thể gây nhiễu nếu governance title/price không chặt.
- Rủi ro học thuật khi scale: nếu publish ồ ạt SKU ngắn mà không thêm checkpoint/mastery gate, có thể tăng completion ngắn hạn nhưng giảm retention học thật.

## 7) Quyết định cần cấp trên duyệt
1. Giữ mô hình dual-catalog (root + split) thêm 1-2 chu kỳ hay chuyển hẳn split-only ở storefront.
2. Go-live 12 pilot SKU theo phase hay tiếp tục để draft thêm 1 vòng QA giáo dục.
3. Ưu tiên fix tracking (`ab_courses_v`) trong sprint gần nhất trước khi chạy A/B copy mới.
4. Duyệt ngưỡng scale cho pilot (ví dụ completion, conversion, week-2 retention) để tránh scale cảm tính.

## 8) Kế hoạch đề xuất 30/60/90 ngày
- 30 ngày:
  - Fix attribution variant tracking.
  - Publish pilot có chọn lọc (nhóm demand cao).
  - Đặt dashboard tuần cho completion + checkout + return learning.
- 60 ngày:
  - Review hiệu quả theo track (Abeka / LFEN / LFCN).
  - Chuẩn hóa rubric checkpoint theo phase foundation/core/mastery.
- 90 ngày:
  - Quyết định catalog strategy dài hạn (dual vs split-only).
  - Nhân rộng SKU nếu đạt threshold đã duyệt.

## 9) File evidence đã dùng
- `scripts/check-courses.js`
- `plans/2026-03-17-education-agent-team/reports/course-storefront-sync-report.md`
- `plans/2026-03-17-education-agent-team/reports/pilot-db-integrity.json`
- `plans/2026-03-17-education-agent-team/reports/course-baseline-metrics.json`
- `plans/2026-03-17-education-agent-team/reports/courses-ab-cvr-report.md`
- `plans/2026-03-17-education-agent-team/reports/learning-science-and-market-evidence.md`
- `src/modules/courses/course-bundles.ts`
- `src/modules/courses/course-storefront-content.ts`
- `src/modules/courses/pilot-sku-catalog.ts`

## Unresolved questions
- Cấp trên muốn chốt luôn split-only catalog ngoài storefront, hay giữ dual thêm 1 quý để giảm migration risk?
- Có cần mở pilot publish cho LFEN L2 và LFCN L1 cùng lúc, hay chạy tuần tự để dễ đọc hiệu ứng?
- Mốc ưu tiên của ban điều hành là conversion ngắn hạn hay retention học tập sau tuần 4?

# Education Expert Rationale Audit - Course Split

Date: 2026-03-18  
Work context: `D:\project\cungcontuhoc`  
Reports path: `D:\project\cungcontuhoc\plans\reports\`  
Plans path: `D:\project\cungcontuhoc\plans\`

## Executive summary
- Cách chia khóa hiện tại đang đi theo 4 tầng rõ ràng: `nguồn học liệu -> grade/level -> phase học -> pilot SKU`.
- Về sư phạm, cấu trúc này hợp lý vì giảm quá tải nhận thức, giữ lộ trình tăng dần độ khó, và tạo checkpoint để củng cố nhớ dài hạn.
- Về phía phụ huynh, cấu trúc hiện tại cho điểm bắt đầu rõ hơn, dễ theo dõi tiến độ tuần, và dễ quyết định mua thử trước khi mở rộng.
- Rủi ro lớn nhất hiện tại không nằm ở logic chia, mà nằm ở thiếu dữ liệu outcome thực tế của pilot (funnel/learning events đang 0 trong cửa sổ gần nhất).

## Findings (có dẫn file nội bộ)

### 1) Split ở mức sản phẩm đã nhất quán, đang publish theo 3 bundle lớn
Evidence:
- `src/modules/courses/course-bundles.ts:1` định nghĩa 3 bundle: `abeka`, `little-fox-en`, `little-fox-cn`.
- `src/modules/courses/course-bundles.ts:34`-`37`, `50`-`54`, `67`-`71` cho rule mapping slug theo exact/prefix để gom đúng course con vào đúng bundle.
- `plans/2026-03-17-education-agent-team/reports/course-storefront-sync-report.md:6`-`7` xác nhận `3/3 bundle PASS`.

Educational meaning:
- Split theo domain ngôn ngữ/nội dung lớn giúp phụ huynh ra quyết định nhanh theo mục tiêu học chính của con, thay vì bị nhiễu bởi catalog quá sâu.

### 2) Quy mô nội dung lớn, cần chia theo cấp để kiểm soát cognitive load
Evidence:
- `docs/api/program-bootstrap/three-courses-program-summary.md:7`-`9`:
  - Abeka: 2,380 lessons, 20,195 videos.
  - Little Fox EN: 8,718 episodes.
  - Little Fox CN: 1,983 episodes.

Educational meaning:
- Với quy mô như trên, nếu không chia tầng sẽ gây overload cho cả phụ huynh (khó chọn) và trẻ (khó duy trì nhịp học).

### 3) Trục chia grade/level + nhịp tuần có chủ đích sư phạm
Evidence:
- `docs/api/program-bootstrap/three-courses-program-summary.md:13`-`24` nêu rollout theo phase pilot -> scale -> full.
- `docs/api/program-bootstrap/three-courses-program.json` (assumptions):
  - Abeka: kindergarten 4 lesson/tuần; g1+ 5 lesson/tuần.
  - Little Fox: level 1-2 = 5 episode/tuần; level 3-5 = 4; level 6+ = 3.

Educational meaning:
- Nhịp tuần giảm dần theo độ phức tạp nội dung và độ dài chương trình, giúp tăng khả năng hoàn thành thay vì ép tải quá sớm.

### 4) Trục chia phase (foundation/core/mastery) đúng logic học tăng dần
Evidence:
- Abeka sample trong `three-courses-program.json`: mỗi grade 170 bài, tách `51/85/34` (foundation/core/mastery).
- Little Fox EN/CN cũng tách cùng pattern tỷ lệ ~`30%/50%/20%` theo level.

Educational meaning:
- `Foundation` tạo an toàn tâm lý và nền kỹ năng.
- `Core` là vùng luyện tập khối lượng lớn để hình thành độ trôi chảy.
- `Mastery` khóa chuẩn đầu ra trước khi lên level/grade tiếp theo.

### 5) Pilot SKU đang bám đúng mục tiêu “học ngắn hạn có thể thấy tiến bộ”
Evidence:
- `src/modules/courses/pilot-sku-catalog.ts:9`-`52` có 12 pilot SKU:
  - Abeka: K4/K5/G1, mỗi grade 2 SKU.
  - LFEN: L1/L2, mỗi level 2 SKU.
  - LFCN: L1, 2 SKU.
- `plans/2026-03-17-education-agent-team/reports/course-baseline-metrics.json`:
  - Pilot coverage khoảng 21%-23% lesson/episode (đủ rộng để test, chưa quá rộng để vận hành khó).

Educational meaning:
- SKU ngắn (4-8 tuần) phù hợp phụ huynh mới bắt đầu: giảm cam kết ban đầu nhưng vẫn đủ dài để quan sát thay đổi hành vi học.

### 6) Parent-facing narrative đã map đúng intent sư phạm
Evidence:
- `src/modules/courses/course-storefront-content.ts:13`-`71` mô tả rõ:
  - pain point của phụ huynh,
  - promise theo level/grade,
  - outcomes và `parentVisibleValue`.

Educational meaning:
- Nội dung storefront không chỉ “bán khóa”, mà chuyển ngôn ngữ kỹ thuật sang ngôn ngữ tiến bộ quan sát được bởi phụ huynh.

### 7) Cơ sở learning science nội bộ đã có, nhưng chưa đóng vòng bằng dữ liệu pilot
Evidence:
- `plans/2026-03-17-education-agent-team/reports/learning-science-and-market-evidence.md` nêu các trụ cột: active learning, spacing/retrieval, tutoring có mục tiêu.
- `plans/2026-03-17-education-agent-team/reports/pilot-funnel-report.md` hiện đang 0 checkout/purchase/active learner trong cửa sổ 14 ngày.

Educational implication:
- Rationale sư phạm tốt ở tầng thiết kế, nhưng chưa đủ bằng chứng outcome ở tầng thực thi để kết luận hiệu quả thương mại-học tập.

## Recommendation cho tài liệu bàn giao cấp cao
1. Chốt thông điệp điều hành:
   - “Chia khóa theo 4 tầng để kiểm soát độ khó, tăng completion, và giúp phụ huynh ra quyết định nhanh.”
2. Đưa một bảng “Decision Rationale Matrix” vào tài liệu bàn giao:
   - Cột `Trục chia` | `Vấn đề giải quyết` | `Ý nghĩa giáo dục` | `KPI xác thực`.
3. Giữ nguyên kiến trúc split hiện tại ở pilot:
   - Không đổi slug kỹ thuật; chỉ tối ưu cách trình bày và đo lường.
4. Bổ sung 3 guardrail bắt buộc trước scale:
   - placement/entry diagnostic rõ cho điểm bắt đầu,
   - mastery gate trước khi lên cấp,
   - weekly parent-facing progress signal (không chỉ completion thô).
5. Điều kiện chuyển từ pilot sang scale:
   - Có dữ liệu thật cho funnel và learning outcomes theo từng SKU (không dùng aggregate chung toàn catalog).

## Unresolved questions
1. Placement diagnostic hiện đã đủ mạnh để xếp đúng điểm vào grade/level cho trẻ mới chưa?
2. Mastery gate đang đo theo completion hay theo chất lượng hoàn thành (accuracy/retention)?
3. Bộ KPI “học thật” nào sẽ là chuẩn bắt buộc trước khi scale toàn bộ g2+ và level 3+?
4. Có cần thêm nhánh “fast-track/remedial” cho trẻ lệch nhịp so với baseline của grade/level hiện tại không?

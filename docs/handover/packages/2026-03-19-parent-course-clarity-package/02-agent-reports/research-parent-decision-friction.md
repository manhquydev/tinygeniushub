# Parent Decision Friction Research - Courses UI

Date: 2026-03-19
Work context: `D:\project\cungcontuhoc`
Reports path: `D:\project\cungcontuhoc\plans\reports\`
Plans path: `D:\project\cungcontuhoc\plans\`

## Executive summary
- Friction lớn nhất hiện tại không phải thiếu khóa, mà là thiếu `decision scaffolding` cho phụ huynh: chưa có bước xác định điểm bắt đầu, chưa có bộ tiêu chí so sánh chuẩn, chưa có map readiness -> khóa.
- Trang `/courses` hiện đưa mạnh số liệu tổng (`tổng bài`, `tổng thời lượng`) nhưng thiếu thông tin đầu vào quan trọng để chọn đúng khóa (entry level, prerequisite, expected weekly effort theo từng khóa).
- Trang chi tiết có CTA mua rõ, nhưng "nhịp gợi ý" đang hardcode `4-5 bài/tuần` cho mọi khóa, dễ lệch thực tế pacing theo level/grade.
- Tracking A/B checkout đang chưa đủ tin cậy cho quyết định tối ưu UI: CVR chỉ có variant `unknown` (75%), nên chưa thể kết luận A vs B.

## Findings

### 1) Parent decision friction hiện tại trên trang khóa học

1. Choice overload, thiếu cơ chế thu hẹp lựa chọn ngay đầu funnel.
- Evidence: `/courses` hiển thị KPI tổng catalog (`Số khóa`, `Tổng bài học`, `Tổng thời lượng`) tại [src/app/(main)/courses/page.tsx](D:/project/cungcontuhoc/src/app/(main)/courses/page.tsx:63), [src/app/(main)/courses/page.tsx](D:/project/cungcontuhoc/src/app/(main)/courses/page.tsx:67), [src/app/(main)/courses/page.tsx](D:/project/cungcontuhoc/src/app/(main)/courses/page.tsx:71).
- Evidence: không có UI filter/placement thực sự (không có select/input/filter control) trong [src/app/(main)/courses/page.tsx](D:/project/cungcontuhoc/src/app/(main)/courses/page.tsx).
- Impact: phụ huynh phải tự suy luận "con thuộc khóa nào" từ title/description.

2. Thiếu thông tin "điểm bắt đầu đúng" (entry readiness) ở cả list và detail.
- Evidence: data render ra storefront chủ yếu gồm `slug/title/description/duration/lessonCount/pricing` từ [src/modules/courses/course-service.ts](D:/project/cungcontuhoc/src/modules/courses/course-service.ts:75).
- Evidence: detail page cũng chưa có trường entry-level/prerequisite/placement signal tại [src/app/(main)/courses/[slug]/page.tsx](D:/project/cungcontuhoc/src/app/(main)/courses/[slug]/page.tsx:22).
- Evidence chiến lược: audit đã nêu cần guardrail placement + mastery trước scale tại [plans/reports/education-expert-2026-03-18-rationale-audit.md](D:/project/cungcontuhoc/plans/reports/education-expert-2026-03-18-rationale-audit.md:92).

3. Decision copy có nhưng chưa dùng hết asset nội dung sư phạm đã chuẩn bị.
- Evidence: content model có `parentProblem`, `outcomes`, `parentVisibleValue` tại [src/modules/courses/course-storefront-content.ts](D:/project/cungcontuhoc/src/modules/courses/course-storefront-content.ts:5), [src/modules/courses/course-storefront-content.ts](D:/project/cungcontuhoc/src/modules/courses/course-storefront-content.ts:8), [src/modules/courses/course-storefront-content.ts](D:/project/cungcontuhoc/src/modules/courses/course-storefront-content.ts:9).
- Evidence: UI list hiện mới render `shortLabel` + `bestFor`; detail chủ yếu render `promise` tại [src/app/(main)/courses/page.tsx](D:/project/cungcontuhoc/src/app/(main)/courses/page.tsx:114), [src/app/(main)/courses/page.tsx](D:/project/cungcontuhoc/src/app/(main)/courses/page.tsx:123), [src/app/(main)/courses/[slug]/page.tsx](D:/project/cungcontuhoc/src/app/(main)/courses/[slug]/page.tsx:176).
- Impact: phụ huynh chưa thấy rõ "kết quả quan sát được theo tuần" ngay trước khi ra quyết định.

4. Pacing signal đang generic, có rủi ro mismatch kỳ vọng.
- Evidence: detail page hardcode `Nhịp gợi ý: 4-5 bài/tuần` tại [src/app/(main)/courses/[slug]/page.tsx](D:/project/cungcontuhoc/src/app/(main)/courses/[slug]/page.tsx:163).
- Evidence chiến lược: curriculum validation ghi nhận pacing theo level/grade khác nhau + phase heuristic 30/50/20 tại [plans/reports/curriculum-architect-2026-03-18-split-validation.md](D:/project/cungcontuhoc/plans/reports/curriculum-architect-2026-03-18-split-validation.md:24), [plans/reports/curriculum-architect-2026-03-18-split-validation.md](D:/project/cungcontuhoc/plans/reports/curriculum-architect-2026-03-18-split-validation.md:49).

5. Friction đo lường: chưa đọc được hiệu quả A/B thật.
- Evidence: report CVR 30 ngày: toàn bộ variant là `unknown` tại [docs/handover/packages/2026-03-18-course-split-executive-package/03-evidence/courses-ab-cvr-report.md](D:/project/cungcontuhoc/docs/handover/packages/2026-03-18-course-split-executive-package/03-evidence/courses-ab-cvr-report.md:14), [docs/handover/packages/2026-03-18-course-split-executive-package/03-evidence/courses-ab-cvr-report.md](D:/project/cungcontuhoc/docs/handover/packages/2026-03-18-course-split-executive-package/03-evidence/courses-ab-cvr-report.md:19).
- Impact: khó ưu tiên copy/layout nào thực sự giảm friction.

### 2) Thông tin tối thiểu phải có để phụ huynh chọn đúng khóa

`Minimum decision card` nên có đúng 7 trường (hiển thị ở list + detail, cùng cấu trúc):

1. `Mục tiêu chính của khóa` (1 dòng outcome).
2. `Ai phù hợp` (độ tuổi/grade/level hiện tại).
3. `Điểm bắt đầu` (entry requirement đơn giản: biết/chưa biết gì).
4. `Cam kết tuần` (bài/tuần + phút/ngày).
5. `Mốc thấy tiến bộ` (tuần 1-2 thấy gì; tuần 4 thấy gì).
6. `Khối lượng + thời hạn` (số bài, thời gian truy cập).
7. `Giá + chính sách rủi ro` (giá cuối cùng, điều kiện hỗ trợ trước mua).

Mapping với dữ liệu hiện có:
- Đã có một phần: `bestFor/promise/outcomes/parentVisibleValue` trong content model [src/modules/courses/course-storefront-content.ts](D:/project/cungcontuhoc/src/modules/courses/course-storefront-content.ts:4).
- Chưa hiển thị đủ trên UI: list/detail chưa render outcomes + parentVisibleValue đầy đủ [src/app/(main)/courses/page.tsx](D:/project/cungcontuhoc/src/app/(main)/courses/page.tsx:114), [src/app/(main)/courses/[slug]/page.tsx](D:/project/cungcontuhoc/src/app/(main)/courses/[slug]/page.tsx:176).

### 3) Framework phân loại "mức sẵn sàng" để map phụ huynh vào đúng khóa

Đề xuất framework 2 chiều, đủ nhẹ để triển khai ngay ở UI:
- Trục 1 `Goal clarity` (phụ huynh có rõ mục tiêu học không).
- Trục 2 `Placement clarity` (phụ huynh có rõ trình độ hiện tại của con không).

Phân loại 4 mức readiness:

1. `R0 - Mơ hồ cả mục tiêu lẫn trình độ`
- Dấu hiệu: vào trang list, lướt nhiều card, chưa vào detail sâu.
- UI action: mở "quick chooser" 3 câu hỏi (môn học, độ tuổi/lớp, thời gian học/tuần).
- Default mapping: đẩy về SKU nhập môn/pilot ngắn hạn trước.

2. `R1 - Rõ mục tiêu, mơ hồ trình độ`
- Dấu hiệu: chọn được track (EN/CN/Abeka) nhưng phân vân level.
- UI action: mini placement (3-5 câu, <2 phút) ngay trong detail.
- Mapping: trả về `start level + lý do` + 1 phương án dự phòng thấp hơn 1 bậc.

3. `R2 - Rõ trình độ, mơ hồ cam kết`
- Dấu hiệu: biết level nhưng do dự mua vì sợ quá tải.
- UI action: hiển thị workload forecast cá nhân hóa (bài/tuần, phút/ngày, mốc tuần 2/4).
- Mapping: nếu quỹ thời gian thấp -> SKU ngắn + pace thấp; nếu đủ -> khóa chuẩn.

4. `R3 - Sẵn sàng mua`
- Dấu hiệu: xem detail sâu, đọc lesson preview, click CTA.
- UI action: checkout lane rút gọn + reassurance block (hỗ trợ sau mua, tiến độ theo tuần).
- Mapping: vào checkout khóa đề xuất chính; giữ 1 CTA phụ "cần tư vấn chọn level".

Rule map khóa (đơn giản, triển khai được ngay):
- Nếu chưa xác định level chắc chắn -> ưu tiên khóa/scope có nhãn `starter/intro/foundation`.
- Nếu đã có bằng chứng hoàn thành level trước -> đề xuất `builder/core` cùng track.
- Nếu thời gian tuần < ngưỡng của khóa chuẩn -> auto đề xuất phương án pace thấp hơn.

## Recommendations

### A) Quick wins (1 sprint, không đổi kiến trúc dữ liệu)
1. Trên `/courses`, thay KPI tổng catalog bằng `decision helper bar`: mục tiêu học, độ tuổi/lớp, thời gian/tuần.
2. Chuẩn hóa card thông tin theo "minimum decision card" 7 trường; ưu tiên render thêm `outcomes` và `parentVisibleValue` đã có sẵn.
3. Ở detail, thay hardcode `4-5 bài/tuần` bằng pacing theo course scope thực tế.
4. Trên CTA detail, thêm nhánh phụ cạnh mua: `Chưa chắc level? Làm bài xác định nhanh`.

### B) Mid-term (2-3 sprint)
1. Thêm mini placement widget (3-5 câu) và trả kết quả `đề xuất level + độ tin cậy`.
2. Xây `readiness state` (R0-R3) trong analytics event để đo conversion theo trạng thái, không chỉ theo pageview.
3. Chuẩn hóa naming ngoài UI theo outcome-centric policy nhất quán (điểm này đã được cảnh báo trong validation report).

### C) Measurement fixes (ưu tiên trước A/B copy mới)
1. Fix end-to-end capture `ab_courses_v` để không còn `unknown` trong checkout/purchase logs.
2. Chỉ chạy A/B copy/layout mới sau khi sample có phân tách variant hợp lệ.

## Unresolved questions
1. Trong production hiện tại, nguồn "entry level" tin cậy nhất đang nằm ở đâu (nếu chưa có placement chính thức)?
2. Có thể expose field nào ngay từ DB/API để hiển thị `độ tuổi/lớp phù hợp` mà không cần chờ migration schema?
3. Team muốn ưu tiên optimize conversion của `pilot SKU` hay của `bundle/full track` trong 1-2 sprint tới?
4. Ngưỡng workload nào (phút/ngày, bài/tuần) được chấp nhận làm chuẩn để auto-map R2 -> đề xuất pace thấp?

# Curriculum Split Validation - 2026-03-18

Scope: kiểm tra thực trạng course split mức triển khai sản phẩm, đối chiếu bundle/canonical split/pilot SKU.

## Executive summary
- Hiện tại hệ thống đang chạy mô hình 2 lớp: `bundle lớn` (3 nhóm) + `split nhỏ` (grade/level + pilot SKU theo tuần).
- Lớp phân loại kỹ thuật đã ổn định: storefront sync PASS 3/3 bundle, split integrity PASS cho cả full decomposition (28 scopes) và pilot decomposition (6 scopes).
- Lớp ý nghĩa giáo dục đã có khung tốt (foundation/core/mastery + nhịp tuần + tên hiển thị theo outcome), nhưng còn phụ thuộc nhiều vào heuristic cố định và rule đặt tên slug.
- Cần bàn giao rõ cho cấp quản lý: đây là kiến trúc "an toàn vận hành" đã chạy được, chưa phải kiến trúc "tối ưu sư phạm" cuối cùng.

## 1) Hiện đang chia theo những trục nào?

### Trục A - Danh mục sản phẩm cấp cao (bundle)
- 3 bundle chính: `abeka`, `little-fox-en`, `little-fox-cn`.
- Mỗi bundle có `entryCourseSlug`, `courseSlugRules`, `canonicalSplitCourseSlugPrefixes` để map nội dung con.
- Căn cứ: `src/modules/courses/course-bundles.ts:33`, `src/modules/courses/course-bundles.ts:49`, `src/modules/courses/course-bundles.ts:66`, `src/modules/courses/course-bundles.ts:56`, `src/modules/courses/course-bundles.ts:73`.

### Trục B - Canonical split vs legacy monolith
- Engine ưu tiên split-course canonical (prefix match). Nếu không có thì fallback non-legacy, cuối cùng mới dùng legacy monolith.
- Căn cứ: `src/modules/courses/course-bundle-service.ts:146`, `src/modules/courses/course-bundle-service.ts:151`, `src/modules/courses/course-bundle-service.ts:163`, `src/modules/courses/course-bundle-service.ts:194`.

### Trục C - Trục học tập trong bootstrap (academic progression)
- Pacing theo cấp độ: Abeka K4/K5 4 bài/tuần, G1+ 5 bài/tuần; LittleFox L1-2 5 tập/tuần, L3-5 4, L6+ 3.
- Phase logic full catalog đang dùng tỷ lệ cố định 30% foundation, 50% core, 20% mastery.
- Căn cứ: `docs/api/program-bootstrap/three-courses-program-summary.md:14`, `docs/api/program-bootstrap/three-courses-program-summary.md:15`, `docs/api/program-bootstrap/three-courses-program-summary.md:16`, `scripts/bootstrap-three-courses-program.mjs:34`, `scripts/bootstrap-three-courses-program.mjs:35`.

### Trục D - Pilot micro-SKU theo thời lượng và outcome
- Pilot 12 SKU (3 grade Abeka + 2 level LittleFox EN + 1 level LittleFox CN, mỗi scope tách starter/builder hoặc intro/foundation).
- Tách theo khoảng bài rõ ràng (`from/to`) và pace theo tuần, không overlap/out-of-range.
- Căn cứ: `src/modules/courses/pilot-sku-catalog.ts:9`, `src/modules/courses/pilot-sku-catalog.ts:10`, `src/modules/courses/pilot-sku-catalog.ts:34`, `src/modules/courses/pilot-sku-catalog.ts:39`, `plans/2026-03-17-education-agent-team/reports/split-integrity-summary.md:6`, `plans/2026-03-17-education-agent-team/reports/split-integrity-summary.md:12`.

### Trục E - Trục truyền thông phụ huynh (UX meaning layer)
- Bundle content đã có `parentProblem`, `promise`, `parentVisibleValue`, `courseUnitLabel`.
- Pilot naming map giữ nguyên dữ liệu học (`scopeId/from/to`) và chỉ đổi lớp hiển thị (`publicTitle/publicShortDescription`).
- Căn cứ: `src/modules/courses/course-storefront-content.ts:16`, `src/modules/courses/course-storefront-content.ts:18`, `src/modules/courses/course-storefront-content.ts:26`, `src/modules/courses/course-storefront-content.ts:31`, `plans/2026-03-17-education-agent-team/reports/pilot-public-naming-map.json:5`, `plans/2026-03-17-education-agent-team/reports/pilot-public-naming-map.json:12`.

## 2) Điểm mạnh / điểm yếu cho vận hành + UX phụ huynh

### Điểm mạnh
- Rule map bundle rõ, deterministic, hỗ trợ đồng thời split mới và legacy cũ.
- Storefront đã sync pass 3/3 bundle với tổng course/lesson đúng (Abeka 14/2380, LF EN 9/8718, LF CN 5/1983).
- Integrity automation đã chứng minh không hở/đè range trong decomposition và pilot.
- Có lớp ngôn ngữ phụ huynh (outcome-based copy) giúp giảm nhiễu kỹ thuật từ slug nội bộ.

Căn cứ: `plans/2026-03-17-education-agent-team/reports/course-storefront-sync-report.md:6`, `plans/2026-03-17-education-agent-team/reports/course-storefront-sync-report.md:13`, `plans/2026-03-17-education-agent-team/reports/course-storefront-sync-report.md:14`, `plans/2026-03-17-education-agent-team/reports/course-storefront-sync-report.md:15`, `plans/2026-03-17-education-agent-team/reports/split-integrity-summary.md:9`, `plans/2026-03-17-education-agent-team/reports/split-integrity-summary.md:15`.

### Điểm yếu
- Kiến trúc split đang phụ thuộc mạnh vào convention đặt slug/prefix. Sai naming có thể làm map sai bundle.
- Phase foundation/core/mastery đang là heuristic tỷ lệ cứng (30/50/20), chưa dựa trực tiếp vào mastery signal theo kỹ năng.
- Pilot mới phủ một phần catalog; UX hiện tại có nguy cơ song song hai ngôn ngữ định vị (catalog full-source vs micro-outcome) nếu không thống nhất tầng hiển thị.
- Giá hiển thị có thể lệch kỳ vọng nếu root-course price khác default bundle config.

Căn cứ: `src/modules/courses/course-bundle-service.ts:146`, `scripts/bootstrap-three-courses-program.mjs:34`, `scripts/bootstrap-three-courses-program.mjs:35`, `src/modules/courses/course-bundles.ts:40`, `src/modules/courses/course-bundles.ts:57`, `src/modules/courses/course-bundles.ts:74`, `src/modules/courses/course-bundle-service.ts:133`.

## 3) Bất nhất cần nêu trong tài liệu bàn giao

1. **Định vị giá**
- Config bundle đặt mặc định 500,000 VND, nhưng storefront sync report đang lấy expected price từ root courses và hiện thể hiện 0.
- Cần ghi rõ chính sách: nguồn giá chuẩn là đâu (bundle config hay root course DB).
- Căn cứ: `src/modules/courses/course-bundles.ts:40`, `src/modules/courses/course-bundles.ts:57`, `src/modules/courses/course-bundles.ts:74`, `plans/2026-03-17-education-agent-team/reports/course-storefront-sync-report.json:21`, `plans/2026-03-17-education-agent-team/reports/course-storefront-sync-report.json:44`, `plans/2026-03-17-education-agent-team/reports/course-storefront-sync-report.json:67`, `src/modules/courses/course-bundle-service.ts:133`.

2. **Định vị sản phẩm**
- Báo cáo decomposition đề xuất chiến lược micro-course rộng (tripwire/core/premium/subscription), nhưng triển khai sản phẩm hiện tại mới thể hiện rõ pilot SKU + 3 bundle.
- Cần chốt thông điệp cho cấp cao: đang ở giai đoạn pilot/productization, chưa rollout toàn catalog theo outcome.
- Căn cứ: `plans/2026-03-17-education-agent-team/reports/three-course-decomposition-and-product-matrix.md:81`, `plans/2026-03-17-education-agent-team/reports/three-course-decomposition-and-product-matrix.md:82`, `plans/2026-03-17-education-agent-team/reports/three-course-decomposition-and-product-matrix.md:83`, `plans/2026-03-17-education-agent-team/reports/three-course-decomposition-and-product-matrix.md:84`, `src/modules/courses/pilot-sku-catalog.ts:9`.

3. **Ngôn ngữ hiển thị**
- Có chênh giữa naming kỹ thuật/source-centric (Abeka, Little Fox EN/CN) và naming outcome-centric cho phụ huynh ở pilot.
- Cần một policy UX duy nhất: mọi mặt ngoài theo outcome, mặt trong giữ SKU/slug kỹ thuật.
- Căn cứ: `plans/2026-03-17-education-agent-team/reports/pilot-public-naming-map.json:12`, `plans/2026-03-17-education-agent-team/reports/pilot-public-naming-map.json:27`, `plans/2026-03-17-education-agent-team/reports/pilot-public-naming-map.json:123`.

## Kết luận bàn giao (đề xuất cho cấp cao)
- Quyết định chia hiện tại là hợp lý ở pha vận hành: an toàn dữ liệu, đo được, mở rộng được.
- Ý nghĩa giáo dục hiện tại: giảm tải nhận thức cho phụ huynh, tạo nhịp học tuần rõ, giữ được lộ trình dài hạn theo cấp độ.
- Điểm cần phê duyệt tiếp theo ở cấp cao: 
  - chuẩn hóa policy giá,
  - chuẩn hóa policy naming theo outcome,
  - roadmap chuyển phase heuristic sang mastery-based sequencing.

## Unresolved questions
1. Nguồn giá chính thức cho storefront production là bundle config hay root course DB?
2. Trong 1-2 release tới, mặt ngoài sẽ ưu tiên hiển thị bundle full-source hay pilot micro-course theo outcome?
3. Khi nào chuyển phase split từ tỷ lệ cứng (30/50/20) sang rule dựa trên dữ liệu học thật (completion/mastery/retention)?

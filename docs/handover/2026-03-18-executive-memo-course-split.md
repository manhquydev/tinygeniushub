# Executive Memo - Quyết định chia khóa học (gửi cấp cao)

Date: 2026-03-18  
Owner: Education Agent Team  
Purpose: xin phê duyệt hướng vận hành catalog và scale pilot dựa trên dữ liệu đã kiểm chứng.

## 1) Tóm tắt điều hành
- Mô hình hiện tại đã chạy ổn định theo 3 tầng: `3 khóa gốc` + `28 khóa split chính thức` + `12 pilot SKU` (draft).
- Cách chia hiện tại phù hợp cả thương mại và giáo dục: phụ huynh chọn dễ hơn, trẻ học đúng mức hơn, đội vận hành kiểm soát tốt hơn.
- Hệ thống kiểm soát kỹ thuật đạt chuẩn: storefront sync `PASS 3/3`, pilot split integrity `issues=0`.
- Tín hiệu thương mại có sớm: 30 ngày gần nhất `8` checkout start, `6` purchase success, CVR `75%`.
- Điểm nghẽn cần xử lý trước khi scale: biến thể A/B đang ghi `unknown`, làm giảm chất lượng kết luận thử nghiệm thông điệp.

## 2) Vì sao chia như vậy
## Business intent
- Giảm ma sát mua hàng: tách theo `Abeka / LF English / LF Chinese` giúp phụ huynh hiểu nhanh hướng học.
- Giảm rủi ro catalog quá rộng: giữ bundle lớn ổn định, thử nghiệm tăng trưởng qua SKU ngắn hạn.
- Dễ kiểm soát pricing/packaging: lớp thương mại và lớp học thuật tách vai rõ ràng.

## Educational intent
- Grade/level split giảm lệch trình và giảm quá tải nhận thức cho trẻ.
- Phase `foundation -> core -> mastery` giữ logic tiến bộ từ làm quen đến thành thạo.
- Micro-SKU 4-8 tuần tạo mốc ngắn để phụ huynh thấy tiến bộ sớm, hỗ trợ thói quen học đều.

## 3) Snapshot đã verify
- Total courses: `43`; published: `31`.
- Published gồm `3` root + `28` split:
- Abeka `14` grade courses.
- Little Fox EN `9` level courses.
- Little Fox CN `5` level courses.
- Pilot `12` SKU: đã map đúng phạm vi lesson, không overlap/out-of-range.
- Adoption hiện tại nghiêng về split catalog: enrollments split cao hơn root.

## 4) Rủi ro và kiểm soát
- Rủi ro đo lường: variant attribution `unknown`.
- Kiểm soát: fix capture `ab_courses_v` trong sprint gần nhất, chỉ chạy A/B mới sau khi fix.
- Rủi ro vận hành: song song root + split gây nhiễu nếu governance tên/giá không chặt.
- Kiểm soát: chốt một policy nguồn giá và naming policy thống nhất mặt ngoài.
- Rủi ro sư phạm khi scale nhanh: tăng completion ngắn hạn nhưng giảm retention thật.
- Kiểm soát: giữ gate scale theo completion + week-4 retention + progression quality.

## 5) Quyết định cần phê duyệt ngay
1. Duy trì mô hình `dual catalog` thêm 1-2 chu kỳ cohort hay chuyển `split-only` ở storefront.
2. Cho phép go-live 12 pilot SKU theo phase hay chờ thêm 1 vòng QA giáo dục.
3. Ưu tiên fix tracking attribution trước mọi A/B message mới.
4. Chốt bộ ngưỡng scale bắt buộc (đề xuất: completion >= 55%, tripwire->core >= 18%, CAC payback <= 2.5 tháng).

## 6) Kế hoạch thực thi 30/60/90 ngày
- 30 ngày: fix attribution, publish pilot có kiểm soát, bật dashboard tuần cho conversion + learning.
- 60 ngày: review theo từng track (Abeka/LFEN/LFCN), chuẩn hóa checkpoint theo phase.
- 90 ngày: quyết định chiến lược catalog dài hạn và chỉ scale SKU đạt ngưỡng.

## Unresolved questions
- Có chốt split-only storefront trong Q2/2026 không?
- Scale pilot theo kiểu tuần tự từng track hay mở đồng thời nhiều track?
- Ưu tiên điều hành là conversion ngắn hạn hay retention học tập sau tuần 4?

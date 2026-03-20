# Planner Report: Parent Course Clarity Plan

Date: 2026-03-19  
Work context: D:\project\cungcontuhoc  
Reports: D:\project\cungcontuhoc\plans\reports\  
Plans: D:\project\cungcontuhoc\plans\

## 1) Kế hoạch nghiên cứu (1 trang)

### Mục tiêu
- Giảm mơ hồ khi phụ huynh chọn khóa: biết khác nhau ở đâu, dành cho ai, nên mua gì.
- Tăng tốc độ quyết định mua đúng khóa (không cần chat hỏi thêm).

### Câu hỏi nghiên cứu chính
1. Phụ huynh đang thiếu thông tin nào để so sánh khóa?
2. Dấu hiệu nào giúp họ nhận ra “khóa này dành cho con mình” trong 10-20 giây?
3. Cấu trúc thông tin nào giúp chọn nhanh: theo độ tuổi, trình độ, mục tiêu, ngân sách?

### Giả thuyết ưu tiên
- H1: Nếu có block “Khóa này phù hợp với ai / không phù hợp với ai”, tỷ lệ click vào CTA tăng.
- H2: Nếu có bảng so sánh khóa ngay trang list, thời gian do dự giảm.
- H3: Nếu CTA kèm “Gợi ý khóa theo mục tiêu của con”, tỷ lệ mua nhầm giảm.

### Phương pháp nghiên cứu nhanh (5 ngày)
- D1: Desk audit trang hiện tại (`/courses`, `/courses/[slug]`, checkout) + map điểm mơ hồ.
- D2: 6-8 interview nhanh phụ huynh (15-20 phút/cuộc), tập trung câu hỏi quyết định mua.
- D3: First-click test (5 nhiệm vụ) với 8 người: tìm khóa phù hợp theo tình huống cụ thể.
- D4: Tổng hợp insight thành decision gaps + ưu tiên theo impact/effort.
- D5: Chốt IA + messaging + UI blocks + copy mẫu để vào sprint.

### Tiêu chí thành công (decision-focused)
- >=80% phụ huynh chọn đúng nhóm khóa trong <=90 giây ở bài test.
- >=70% trả lời đúng sự khác nhau giữa 2 khóa chính sau khi xem trang.
- Giảm câu hỏi inbox kiểu “khóa nào hợp con em?” trong tuần đầu sau rollout.

## Checklist triển khai nhanh
- [ ] Audit toàn bộ thông tin khóa hiện có, gom tất cả field đang hiển thị.
- [ ] Viết script phỏng vấn 8 câu hỏi ngắn, tập trung pain quyết định mua.
- [ ] Chạy 6-8 interview + 8 first-click test (ưu tiên phụ huynh mới).
- [ ] Tổng hợp thành 3-5 decision gaps lớn nhất.
- [ ] Vẽ lại IA cho trang list + detail + compare.
- [ ] Soạn messaging matrix theo phân khúc phụ huynh.
- [ ] Chốt danh sách UI blocks cần có + thứ tự ưu tiên P1/P2.
- [ ] Viết copy mẫu cho 3 block quan trọng nhất.
- [ ] Handoff cho design/dev với acceptance criteria rõ ràng.

## 2) Khung output cuối

### A. Information Architecture (IA)

#### Trang danh sách khóa (`/courses`)
1. Hero ngắn: mục tiêu học + niềm tin (1 dòng value).  
2. Bộ lọc quyết định: Độ tuổi, trình độ hiện tại, mục tiêu, ngân sách, thời lượng.  
3. Khối “So sánh nhanh” (sticky mini table): 3-4 khóa nổi bật theo nhu cầu phổ biến.  
4. Course cards chuẩn hóa field:
   - Dành cho ai (độ tuổi + điều kiện đầu vào)
   - Kết quả sau khóa (3 outcomes cụ thể)
   - Thời lượng + lịch học
   - Học phí + hình thức thanh toán
   - Mức độ hỗ trợ phụ huynh
   - CTA: “Xem chi tiết” + “So sánh”
5. Block “Chưa biết chọn khóa nào?” -> quiz gợi ý khóa.

#### Trang chi tiết khóa (`/courses/[slug]`)
1. Above-the-fold: tên khóa + dành cho ai + outcome chính + học phí + CTA.  
2. Khối “Phù hợp / Không phù hợp” (bắt buộc).  
3. Lộ trình học theo tuần/tháng (timeline ngắn, dễ quét).  
4. Bằng chứng hiệu quả: ví dụ tiến bộ, review phụ huynh, FAQ xử lý phản đối.  
5. So sánh với khóa liền kề (up/down-sell rõ).  
6. CTA cố định theo ngữ cảnh: mua ngay / học thử / tư vấn nhanh.

### B. Messaging Matrix (khung điền nội dung)
| Segment phụ huynh | Bối cảnh con | Pain chính | Thông điệp chính | Proof cần hiển thị | CTA |
|---|---|---|---|---|---|
| Mới bắt đầu | Con chưa có nền tảng | Sợ chọn sai level | “Bắt đầu đúng mức, không quá tải” | Điều kiện đầu vào + bài test level | Làm test level |
| Cần cải thiện điểm | Con đang hụt kiến thức | Muốn thấy kết quả đo được | “Lộ trình bù hổng theo tuần” | Mốc tiến bộ + bài kiểm tra định kỳ | Xem lộ trình |
| Muốn học dài hạn | Con có động lực tốt | Cần roadmap rõ + tiết kiệm | “Lộ trình 6-12 tháng, tối ưu chi phí” | So sánh gói + outcome theo giai đoạn | Chọn gói phù hợp |
| Bận rộn | Ít thời gian kèm con | Sợ không theo sát được | “Theo dõi tiến bộ nhanh, ít tốn thời gian” | Báo cáo tự động + tần suất cập nhật | Xem demo báo cáo |

### C. UI Blocks (ưu tiên thực thi)

#### P1 (phải có để giảm mơ hồ)
1. **Fit Block**: “Khóa này dành cho ai / không dành cho ai”.  
2. **Quick Compare Block**: bảng so sánh 3-4 khóa theo tiêu chí quyết định mua.  
3. **Outcome Block**: “Sau 4-8 tuần con đạt gì” (đo được).

#### P2 (tăng tốc quyết định)
4. **Pathway Block**: gợi ý khóa tiếp theo sau khi hoàn thành.  
5. **Parent Effort Block**: phụ huynh cần tham gia bao nhiêu phút/tuần.  
6. **Objection FAQ Block**: xử lý phản đối phổ biến (giá, thời gian, phù hợp level).

#### Acceptance criteria ngắn
- Mỗi block trả lời được 1 câu hỏi quyết định mua cụ thể.  
- Không block nào vượt quá 5 ý chính, ưu tiên scan trong 10-20 giây.  
- Toàn bộ trang detail trả lời đủ 5 câu: cho ai, khác gì, đạt gì, mất bao lâu, bao nhiêu tiền.

## Unresolved questions
- Hiện tại team có dữ liệu phân khúc phụ huynh nào sẵn (CRM, chat tags, purchase history)?
- Có thể triển khai quiz gợi ý khóa ở phase 1 hay chỉ dừng ở bảng so sánh?
- KPI chính khi rollout là CVR checkout, add-to-cart, hay lead tư vấn?
- Có ràng buộc pháp lý/compliance nào khi hiển thị “kết quả sau khóa” không?

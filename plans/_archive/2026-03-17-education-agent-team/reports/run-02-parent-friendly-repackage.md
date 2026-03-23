# Run 02 - Parent-Friendly Repackage (Agent Team)

Date: 2026-03-17  
Plan: `plans/2026-03-17-education-agent-team`

## Mục tiêu run 02
Chuyển từ cách hiển thị "tên nguồn học liệu" sang cách hiển thị "mục tiêu học tập phụ huynh hiểu ngay", nhưng vẫn giữ toàn vẹn dữ liệu đã tách và mapping 1-1.

---

## Agent 1 - `education_researcher` (Evidence framing)
### Kết luận áp dụng
1. Phụ huynh hiểu nhanh hơn khi tên khóa trả lời được 3 câu: học gì, học bao lâu, thấy tiến bộ gì.
2. Cấu trúc "đo được theo tuần" phù hợp với hành vi mua thử trước, mở rộng sau.
3. Tên khóa nên tránh thuật ngữ nội bộ (`intro`, `builder`, `level`) ở mặt ngoài; giữ mã nội bộ ở backend để tracking.

### Quy tắc đặt tên đề xuất
`[Kết quả dễ hiểu] + [Mức hiện tại của bé] + [Thời lượng]`

Ví dụ:
- "Khởi động đọc hiểu K4 - 4 tuần"
- "Nghe hiểu tiếng Anh qua truyện L1 - 6 tuần"
- "Làm quen tiếng Trung qua truyện L1 - 5 tuần"

---

## Agent 2 - `curriculum_product_architect` (Catalog redesign)
### Khung catalog mới (mặt ngoài)
1. Nhóm "Sẵn sàng học thuật" (nguồn: Abeka).
2. Nhóm "Nghe hiểu tiếng Anh qua truyện" (nguồn: Little Fox EN).
3. Nhóm "Làm quen tiếng Trung qua truyện" (nguồn: Little Fox CN).

### Cách tách theo chủ đề dễ hiểu
1. Khởi động: làm quen nhịp học, giảm kháng cự ban đầu.
2. Nền tảng: xây thói quen + độ bền kỹ năng.
3. Tăng cường: tăng độ khó có kiểm soát.
4. Thành thạo: củng cố trước khi lên mức tiếp theo.

### Mapping toàn vẹn dữ liệu
- Không đổi `slug` nội bộ hiện tại.
- Không đổi phạm vi `from/to` đã verify integrity.
- Chỉ thêm lớp hiển thị: `public_title`, `public_description`, `parent_value`.

---

## Agent 3 - `education_growth_marketer` (Presentation + copy)
### Card khóa học chuẩn cho phụ huynh
1. Tên khóa theo outcome.
2. Mô tả 1 câu: bé học gì, theo nhịp nào.
3. Chỉ số rõ: số bài, số tuần, mức hiện tại.
4. "Phụ huynh theo dõi được gì mỗi tuần" (3 bullet).
5. Giá và hình thức thanh toán.
6. CTA rõ: "Xem lộ trình", "Bắt đầu khóa này".

### Template mô tả ngắn (dùng trực tiếp)
`Khóa [Tên khóa] giúp bé [kết quả chính] trong [X tuần], học [Y bài/tuần]. Phụ huynh theo dõi tiến bộ qua [mốc theo dõi].`

### Template bullet "giá trị nhìn thấy"
1. Biết bé đang ở mức nào và còn bao nhiêu bài.
2. Có mốc hoàn thành theo tuần để kèm con không áp lực.
3. Có tiêu chí lên mức tiếp theo rõ ràng.

---

## Agent 4 - `learning_ops_analyst` (Execution control)
### Kế hoạch triển khai 2 pha
1. Pha 1 (pilot 12 SKU): đổi tên hiển thị + mô tả hiển thị.
2. Pha 2 (scale): nhân rộng naming framework cho toàn bộ 28 scope.

### Rule chống sai lệch dữ liệu
1. Mỗi `sku` chỉ có 1 bản ghi `public profile`.
2. `public profile` bắt buộc map về đúng `scopeId`, `from`, `to`.
3. CI check trước release: số SKU có profile = số SKU đang publish.
4. Bất kỳ rename nào cũng không làm thay đổi `slug` tracking.

### KPI theo dõi cho cách trình bày mới
1. CTR từ catalog -> detail.
2. Checkout start rate từ detail.
3. Checkout -> purchase CVR theo biến thể thông điệp.
4. Tỷ lệ phụ huynh quay lại xem tiến độ tuần 1.

---

## Đề xuất quyết định
1. Duyệt mô hình "đổi tên theo outcome" cho pilot 12 SKU ngay.
2. Giữ `slug` kỹ thuật hiện tại để không phá tracking và dữ liệu lịch sử.
3. Chạy A/B message ở mức copy, không chạy A/B ở mức cấu trúc dữ liệu.

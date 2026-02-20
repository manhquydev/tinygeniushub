# 12 — Risks, Assumptions & Open Questions

## 1) Assumptions (giả định đang dùng)
- Website-first, mobile-first (PWA friendly)
- Nội dung video đã sẵn sàng và có thể phát streaming
- Không có giáo viên; phụ huynh là người “kích hoạt” lesson
- Có thể tạo learning tools (quiz, offline card, report) độc lập với video

## 2) Rủi ro lớn nhất & cách giảm
### R1: Trẻ xem như giải trí → không tạo tiến bộ
Mitigation:
- Daily Journey ưu tiên, Library có trần
- Evidence tối thiểu bắt buộc (tick checklist + quiz)
- Review engine (D+1/D+3/D+7)

### R2: Phụ huynh không thấy giá trị để mua năm
Mitigation:
- Roadmap 1 trang + mốc theo tuần/tháng
- Weekly Report tự động + certificate theo milestone
- “Parent script” (3 câu hỏi + 1 hoạt động offline) giúp phụ huynh đồng hành dễ

### R3: Trải nghiệm web cho trẻ nhỏ bị “khó dùng”
Mitigation:
- Kid mode full-screen, icon lớn, hạn chế chữ
- Parent gate cho thao tác nhạy cảm (thanh toán/cài đặt)
- Tối ưu tốc độ tải (prefetch + CDN)

## 3) Quyết định đã chốt (v1)

### 3.1 Mỗi tài khoản tối đa bao nhiêu hồ sơ trẻ?
- **Mặc định: 3 Child Profiles / 1 Parent Account.**
- Lý do:
  - “3 hồ sơ trẻ” là mức rất phổ biến trong các sản phẩm học cho trẻ (ví dụ ABCmouse: 1 Parent + 3 Child).  
  - Phù hợp thực tế Việt Nam: gia đình có 1–2 con + có thể thêm 1 hồ sơ cho anh/chị/em hoặc bé do người chăm khác quản (mà không khuyến khích share giữa nhiều gia đình).
- Mở rộng:
  - Cho phép **mua thêm slot** hoặc **gói Family+ (tối đa 5)** khi đã có traction, hoặc mở theo cơ chế “yêu cầu thêm” (support).

### 3.2 Trial: 3 hay 7 ngày? mở 1 track hay 2 track?
- **Chốt: Trial 7 ngày (1 week) là mặc định.**
- Trial **mở cả 2 track (English + Math)** nhưng **theo Daily Journey** (mỗi ngày chỉ 1 lesson/track + review ngắn), Library bị giới hạn level.
- Lý do:
  - Các phân tích benchmark cho thấy trial ngắn (≤4 ngày) thường có median conversion thấp hơn trial dài hơn; nhóm 5–9 ngày thường “ổn định” hơn.
  - 7 ngày đủ tạo “thói quen tuần” + tạo **Weekly Report** có dữ liệu thật để phụ huynh tin và trả năm.
- Ghi chú vận hành:
  - Vẫn nên chạy **A/B test 3 vs 7** sau khi có traffic để tối ưu theo phễu thật.

### 3.3 Evidence bắt buộc tới mức nào?
- **Bắt buộc: tick checklist + (tự động) mini-quiz score** sau mỗi lesson.
- **Tuỳ chọn (opt-in, có parental gate):**
  - Ảnh: ưu tiên ảnh học liệu/hoạt động (khuyến nghị không chụp mặt bé).  
  - Audio: chỉ bật cho các nhiệm vụ “con đọc/nhắc lại” (English), và có tuỳ chọn “lưu” hoặc “tự xoá sau N ngày”.
- Lý do:
  - Checklist bắt buộc đủ nhẹ để không tạo friction nhưng vẫn tạo “bằng chứng tiến bộ”.
  - Ảnh/audio làm tăng niềm tin, nhưng kéo theo UX + lưu trữ + nhạy cảm dữ liệu ⇒ nên để phụ huynh chủ động bật khi thấy cần.

---

## 4) Các quyết định đã chốt (để vào PRD kỹ thuật)
1) **Mở rộng hồ sơ**: chọn **Family+ plan** (Standard=3, Family+=5). V1 không bán add-on slot để giảm phức tạp checkout.
2) **Portfolio retention**: mặc định **90 ngày**, cho phép phụ huynh **opt-in tối đa 365 ngày** (theo plan) + luôn có Export/Delete.
3) **Weekly Report**: triển khai **cả in-app + email** (email có link vào dashboard), có opt-in per child.

### Open questions mới (đã chốt trong PRD kỹ thuật)

1) **Email weekly report**: mặc định **gộp 1 email/parent/tuần** (nếu nhiều bé sẽ có section theo từng bé).  
   - Lý do: giảm spam, phù hợp thói quen “một email tóm tắt”, vẫn đủ proof.  
   - Cho phép tuỳ chọn nâng cao: bật “1 email/child” nếu phụ huynh muốn.

2) **Family+ caregiver accounts**:  
   - Standard: **2 caregivers** (view-only dashboard)  
   - Family+: **4 caregivers** (view-only)  
   - Chỉ “Primary Parent” được thay đổi thanh toán/quyền riêng tư/xoá dữ liệu.

3) **Export portfolio**:  
   - V1: export theo **tháng** (ZIP) / theo từng bé (tối ưu UX + chi phí).  
   - “Export toàn bộ” chỉ là tuỳ chọn nâng cao (có cảnh báo thời gian + gửi link tải về email).



## 5) References (để tham chiếu khi viết policy/PRD)
- WHO & AAP: định hướng screen time + co-view/co-play
- Cimigo: safe controlled digital tools; parenting segmentation; trust-led behaviour


# 06 — UX Flows & Information Architecture (Website-first)

## 1) IA (cấu trúc trang) tối thiểu
### Public
- Home (định vị + lợi ích + lộ trình mẫu)
- Roadmap (English/Math/Habit)
- Pricing (trial 7 ngày + yearly + family+)
- Affiliate/Referral (giới thiệu)
- FAQ / HDSD (đồng hành)
- Blog/Resources (trust content) — optional

### Authenticated (Parent)
- Parent Dashboard (overview)
- Child Profiles (add/switch) — **tối đa 3** (mở rộng 5 theo plan)
- Reports (weekly/monthly)
- Portfolio (ảnh/audio) — opt-in
- Settings (screen time, notifications, data controls)

### Authenticated (Kid mode)
- Today’s Mission
- Player (video) + Mini-game
- Rewards (badge/sticker)
- Exit (parent gate)

### Admin/CMS
- Content: track/level/unit/week/day/lesson
- Gating: trial_open flags
- Users: parent/child
- Affiliate: stats/payout requests

---

## 2) Core flows (luồng cốt lõi)

### 2.1 Onboarding (Parent)
1) Sign up / login
2) Create Child Profile:
   - nickname + age band + avatar
3) Placement nhẹ (2–5 phút)
4) Show “Roadmap preview” (đang ở level nào + mốc 4 tuần tới)
5) Start Today’s Mission

### 2.2 Daily Journey (Kid)
- Màn hình 1: “Hôm nay học gì?” (2 track: English + Math)
- Màn hình 2: Player + checkpoint
- Màn hình 3: Mini-game (2–5 phút)
- Màn hình 4: Offline Activity Card (5–10 phút)
- Màn hình 5: “Con đã xong!” (badge)  
  → chuyển sang Parent Check-in (tick checklist)

### 2.3 Parent Check-in (Evidence tối thiểu)
- **Bắt buộc**: tick checklist (10–30s) + xem quiz score
- **Tuỳ chọn (opt-in)**:
  - chụp ảnh hoạt động (khuyến nghị không chụp mặt bé)
  - ghi âm 10–30s (English)
- **Parent gate** trước khi bật camera/mic
- **Retention UX** (khi upload ảnh/audio):
  - hiển thị “sẽ tự xoá sau 90 ngày” (mặc định)
  - cho phép phụ huynh đổi sang “giữ tối đa 365 ngày” (opt-in, theo plan)
### 2.4 Weekly Report (in-app + email)
- **In-app (source of truth)**:
  - Reports page + dashboard card (tuần hiện tại)
  - drill-down: minutes, lessons, skills, recommendations
- **Email digest (kéo phụ huynh quay lại)**:
  - gửi 1 email/tuần/child (hoặc gộp theo parent nếu nhiều bé)
  - nút “Xem chi tiết” → deep link vào Parent Dashboard
  - cho phụ huynh tuỳ chọn bật/tắt email cho từng bé
- Trial:
  - Day 6/7: hiển thị preview report + milestone + CTA mua năm
- Paid:
  - report tuần tự động + gợi ý tuần sau
  - “Report archive” theo tuần

### 2.5 Multiple children & giới hạn hồ sơ (3 → 5)
- Parent dashboard có “switcher” rõ ràng
- Kid mode luôn vào đúng child profile (từ shortcut/QR/URL)
- Khi chạm **trần 3 hồ sơ**:
  - khoá nút “Add child”
  - hiển thị modal giải thích + CTA “Nâng cấp Family+ (5 hồ sơ)”
- Không cho 2 bé học cùng lúc trên 1 profile (tránh lẫn progress)

### 2.6 Portfolio (ảnh/audio) — opt-in
- Mặc định lưu **90 ngày** (rolling)
- Tuỳ chọn “giữ tối đa 365 ngày” (opt-in, theo plan)
- Có nút:
  - Export/Download theo tuần/tháng
  - Delete (từng item / toàn bộ)
- Share Progress Card:
  - mặc định OFF
  - chỉ share “chỉ số tiến bộ” (không share ảnh/audio nếu phụ huynh không chọn)
## 3) Nguyên tắc UX cho trẻ <6 (web)
- **Kid mode**: full-screen, không lộ menu phức tạp
- **Parent gate**: thao tác trả tiền, đổi plan, bật camera/mic, xem dashboard phải có gate (giữ nút 2s / phép toán đơn giản)
- **Không infinite scroll**: library có “trần”, ưu tiên Today’s Mission
- **Voice-first**: prompt bằng audio (nếu có) hoặc icon lớn
- **Latency low**: prefetch video/asset cho lesson hôm nay

---

## 4) Nút “đánh trúng phụ huynh Việt” trong UX
- Roadmap progress bar (1 trang là hiểu)
- Weekly report (1 phút đọc) + milestone/certificate
- Screen time report theo tuần
- “Hướng dẫn 60s cho người lớn” trước mỗi unit/week (để ông/bà cũng làm được)

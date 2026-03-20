# 07 — Subscription, Funnel & Pricing (Trial → Yearly)

> **Chốt v1.2 (website-first, trẻ <6, không có giáo viên):** Bán **gói năm** là chính (đơn giản quyết định, giảm churn). Trial dùng để tạo **thói quen 1 tuần + bằng chứng tiến bộ + báo cáo tuần**.

---

## 1) Mục tiêu funnel
- Entry “dễ thử” (neo giá **~10k/tháng**, **thanh toán theo năm**).
- Trial phải tạo được:
  1) **Thói quen** (quay lại ≥ 3 ngày)
  2) **Bằng chứng** (tick checklist + quiz score)
  3) **Weekly Report** (một bản tóm tắt tuần)
- Monetization chính: **Yearly Standard / Yearly Family+**.

---

## 2) Plan & entitlement (để gắn vào hệ thống kỹ thuật)

### 2.1 Standard (Yearly)
- Tối đa **3** hồ sơ trẻ
- Tối đa **2** caregiver accounts (bố/mẹ/ông/bà) ở mức **view-only** dashboard
- Mở toàn bộ 2 track: **English + Math**
- Báo cáo: Weekly report (in-app + email)
- Portfolio retention: **90 ngày** (rolling)

### 2.2 Family+ (Yearly)
- Tối đa **5** hồ sơ trẻ
- Tối đa **4** caregiver accounts (view-only)
- Mở toàn bộ 2 track: **English + Math**
- Báo cáo: Weekly report (in-app + email) + báo cáo gộp theo gia đình
- Portfolio retention: **365 ngày** (opt-in), mặc định vẫn 90 ngày nếu phụ huynh không bật

> **Không bán add-on slot ở v1** để tránh phức tạp billing/support. Khi scale có thể thêm “mua thêm slot” như option nâng cao.

---

## 3) Trial rules (v1.2)
- **Trial mặc định: 7 ngày**
- **Không yêu cầu phương thức thanh toán khi bắt đầu trial** (ưu tiên trust/ít rào cản).
- Trial mở **cả 2 track**, nhưng theo “Daily Journey” để không ngợp:
  - Mỗi ngày: 1 lesson English + 1 lesson Math (hoặc “chế độ nhẹ”: chọn 1 track/ngày)
  - Explore/Library bị giới hạn level (chỉ 1–2 level đầu)
- End-of-trial:
  - Khi hết trial: khóa nội dung premium, chỉ xem dashboard + “tiến độ đã có” + CTA nâng cấp.

---

## 4) Subscription rules (upgrade / downgrade / renewal / cancel)

### 4.1 Auto-renew & renewal
- Mặc định: **auto-renew ON** (Yearly).
- Gửi nhắc gia hạn:
  - **7 ngày trước** ngày gia hạn
  - **1 ngày trước** ngày gia hạn
- Nếu thay đổi giá: thông báo **≥30 ngày trước** kỳ gia hạn tiếp theo (áp dụng cho renewal).

### 4.2 Cancel
- Cancel bất kỳ lúc nào.
- Quyền truy cập premium **giữ đến hết kỳ** đã thanh toán (không cắt ngay).
- Nếu cancel trong trial: không bị trừ tiền.

### 4.3 Refund (để tăng trust)
- **Money-back guarantee 7 ngày** kể từ thời điểm thanh toán **lần đầu** (Standard hoặc Family+).
- Điều kiện vận hành (đề xuất để chống abuse, có thể bật/tắt):
  - Mỗi account chỉ 1 lần refund trong 12 tháng.
  - Refund không áp dụng cho gói mua qua chương trình hỗ trợ đặc biệt (nếu có).

### 4.4 Upgrade (Standard → Family+)
- Upgrade có hiệu lực **ngay lập tức** (mở thêm hồ sơ + tăng caregiver limit + retention).
- Tính phí: **pro-rated** theo thời gian còn lại của kỳ hiện tại.
  - `Charge = (Price_FamilyPlus_Year - Price_Standard_Year) * (days_remaining / 365)`
- Nếu đang trial: upgrade sẽ kết thúc trial và bắt đầu kỳ trả phí ngay.

### 4.5 Downgrade (Family+ → Standard)
- Downgrade có hiệu lực **từ kỳ gia hạn tiếp theo** (không hoàn tiền phần còn lại).
- Nếu tài khoản đang có >3 hồ sơ trẻ:
  - Yêu cầu “archive/lock” hồ sơ vượt quá 3 trước ngày gia hạn (UX mềm: cho chọn 3 hồ sơ giữ active).

### 4.6 Payment failure & grace period
- Khi renewal charge thất bại:
  - Grace **7 ngày** (giữ quyền truy cập), gửi nhắc ngày 1/3/6.
  - Hết grace: chuyển về trạng thái “Expired” (khóa học) nhưng giữ dữ liệu tiến độ.

---

## 5) Coupon / Referral / Affiliate pricing rules
- Coupon mặc định chỉ áp dụng cho **năm đầu**.
- Không cho stack nhiều coupon.
- Referral (share) có thể thưởng:
  - giảm giá năm đầu **hoặc** tặng thêm ngày dùng (không thay đổi kỳ gia hạn năm).

---

## 6) Pricing page content principles (tóm tắt)
- Luôn hiển thị:
  - “Chỉ từ **10k/tháng** (thanh toán theo năm)”
  - “Trial 7 ngày”
  - “Báo cáo tiến bộ mỗi tuần”
  - “Giới hạn thời gian màn hình + hoạt động offline”
  - “Money-back 7 ngày”
- Tránh:
  - Copy dài, thuật ngữ kỹ thuật
  - Nhiều tuỳ chọn giá (chỉ 2 plan)

---

## 7) Pricing variables (để dev cấu hình)
- `PRICE_STANDARD_YEAR`
- `PRICE_FAMILYPLUS_YEAR`
- `TRIAL_DAYS = 7`
- `GRACE_DAYS = 7`
- `MONEY_BACK_DAYS = 7`

---

## 8) Analytics & experiments (tối thiểu)
- Track:
  - Trial start → Day1 activation → Day3 retention → Trial complete → Purchase
  - Conversion theo mode học: 1 track/day vs 2 track/day
- A/B sau khi có traffic:
  - Trial 3 vs 7 (optional)
  - Require payment method upfront vs not


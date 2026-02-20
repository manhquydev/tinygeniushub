# 13 — PRD: Pricing Page & Subscription UX (Website)

**Owner:** Product  
**Platform:** Web (mobile-first)  
**Audience:** Phụ huynh VN (mẹ/bố; có thể ông/bà caregiver)  
**Version:** v1.2 (2026-01-21)

---

## 1) Problem statement
Phụ huynh xem giá nhưng không mua vì:
- Không thấy **lộ trình** / không tin “con tiến bộ thật”
- Sợ “tốn tiền vô ích”, sợ “bị trừ tiền tự động”
- Không rõ mình cần gói nào cho 1–2 bé
- Khó hình dung “mỗi ngày học ra sao”

Pricing page phải giải quyết 4 rào cản trên bằng: **clarity + trust + proof + low-friction trial**.

---

## 2) Goals / Success metrics
### Goals
1) Tăng tỷ lệ **Start trial**
2) Tăng tỷ lệ **Purchase yearly** (Standard/Family+)
3) Giảm support tickets về “billing, cancel, renewal”

### Metrics
- Pricing page → Start trial (CVR)
- Start trial → Purchase (CVR)
- Family+ attach rate
- Refund rate (7-day)
- Billing-related tickets / 1.000 users

---

## 3) Page structure (mobile-first)
### Section A — Hero
- Headline: “Lộ trình học 10–20 phút/ngày cho bé (không cần giáo viên)”
- Sub: “Báo cáo tiến bộ mỗi tuần • Hoạt động offline • Kiểm soát thời gian màn hình”
- CTA1: “Dùng thử 7 ngày”
- CTA2 (secondary): “Xem lộ trình & báo cáo mẫu”

### Section B — Social proof
- 2–3 testimonial ngắn (ưu tiên phụ huynh Việt, không cần dài)
- “Cam kết hoàn tiền 7 ngày”

### Section C — Plan cards (2 cards)
**Standard**
- “3 hồ sơ bé • 2 caregiver”
- “English + Math”
- “Báo cáo tuần (in-app + email)”
- Giá: hiển thị **giá năm** + “~10k/tháng” (monthly equivalent)
- CTA: “Chọn Standard”

**Family+**
- “5 hồ sơ bé • 4 caregiver”
- “Portfolio giữ tới 365 ngày (opt-in)”
- Giá: hiển thị giá năm + monthly equivalent
- CTA: “Chọn Family+”

### Section D — What you get (value bullets)
- “Hôm nay học gì?” (Daily Journey)
- “Báo cáo tuần” (ảnh minh hoạ)
- “Milestones & Certificates”
- “Giới hạn màn hình + hoạt động offline”

### Section E — How trial works
- 3 bước:
  1) Tạo hồ sơ bé
  2) Học theo Daily Journey
  3) Hết 7 ngày: nâng cấp để tiếp tục
- Copy rõ: “Không cần nhập thanh toán khi bắt đầu trial” (nếu áp dụng)

### Section F — FAQ (billing-first)
- Trial có tự trừ tiền không?
- Nâng cấp/huỷ gói thế nào?
- Nhà có 2 bé nên chọn gói nào?
- Ông/bà có xem báo cáo được không?
- Hoàn tiền 7 ngày ra sao?
- Hết hạn gói có mất dữ liệu không?

### Section G — Footer CTA
- CTA: “Bắt đầu dùng thử 7 ngày”
- Link policy: Terms, Refund policy, Privacy

---

## 4) Subscription UX rules (để dev implement)
### 4.1 States
- `TRIALING` → `ACTIVE_STANDARD|ACTIVE_FAMILYPLUS` → `CANCELED_AT_PERIOD_END` → `EXPIRED` → `GRACE` (nếu payment fail)

### 4.2 Cancel flow (Parent-only)
- Settings → Subscription → Cancel
- Confirm modal: “Bạn vẫn dùng đến ngày …”
- Email confirmation

### 4.3 Upgrade flow (Standard → Family+)
- Trigger:
  - Pricing page
  - Khi tạo hồ sơ thứ 4
- Confirm + show pro-rate charge
- Upgrade effective immediately

### 4.4 Downgrade flow
- Schedule at next renewal
- Nếu >3 hồ sơ: yêu cầu chọn 3 hồ sơ active trước ngày renewal

### 4.5 Renewal & dunning
- Renewal reminder (email + in-app)
- Payment fail:
  - grace 7 ngày
  - notify ngày 1/3/6
  - hết grace: expired (khóa học), giữ dữ liệu

### 4.6 Refund flow
- Support form: “Yêu cầu hoàn tiền”
- Auto check: within 7 ngày + not refunded in 12 tháng
- Refund processed → set subscription `REFUNDED` + access revoked

---

## 5) Localization & copy style (VN parent)
- Ngắn, cụ thể, tránh jargon
- Tập trung: “lộ trình – báo cáo – thói quen – kiểm soát màn hình – hoàn tiền”
- “Không có giáo viên” nói theo hướng tích cực:
  - “Bé học theo lộ trình được thiết kế sẵn • phụ huynh chỉ cần 3 phút đồng hành”

---

## 6) Edge cases
- 1 parent có nhiều bé: weekly report mặc định **gộp 1 email/parent** (mỗi bé 1 section)
- Timezone: Asia/Bangkok
- Session: Kid mode không cho truy cập pricing/billing (parent gate)


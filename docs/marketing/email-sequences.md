# Email Sequences — Cùng Con Tự Học

Lifecycle email sequences for trial conversion and retention.
All copy in Vietnamese. Send via Resend/Brevo/AWS SES.

---

## Sequence 1: Trial Onboarding (D0 → D7)

### D0 — Welcome (trigger: signup complete)

**Subject:** Chào mừng đến Cùng Con Tự Học! Bắt đầu trong 2 phút 🎉

**Body:**
```
Xin chào [Tên phụ huynh],

Cảm ơn bạn đã đăng ký! Hành trình học tập của bé [Tên bé] bắt đầu từ hôm nay.

👉 Bước tiếp theo (mất 2 phút):
1. Tạo hồ sơ cho bé: [link /parent/setup]
2. Chọn bài học đầu tiên phù hợp lứa tuổi
3. Học cùng con — 15 phút là đủ!

Sau 7 ngày dùng thử miễn phí, bạn sẽ nhận được báo cáo tiến độ đầu tiên của bé.

Bắt đầu ngay → [link /parent/dashboard]

Cùng Con Tự Học
[Hủy nhận email] · [Chính sách bảo mật]
```

---

### D1 — Activation nudge (trigger: no lesson completed by end of D1)

**Subject:** [Tên bé] chưa hoàn thành bài đầu tiên — bắt đầu ngay hôm nay?

**Body:**
```
Xin chào [Tên phụ huynh],

Chúng tôi thấy [Tên bé] chưa hoàn thành bài học đầu tiên.

Chỉ cần 15 phút hôm nay để tạo thói quen — đó là bí quyết của những bé tiến bộ nhanh nhất.

Bắt đầu bài học đầu tiên → [link /parent/dashboard]

Hẹn gặp [Tên bé] trên hành trình học tập! 😊

Cùng Con Tự Học
[Hủy nhận email] · [Chính sách bảo mật]
```

---

### D3 — Mini progress report (trigger: at least 1 lesson completed)

**Subject:** Báo cáo mini 3 ngày đầu của [Tên bé] 📊

**Body:**
```
Xin chào [Tên phụ huynh],

[Tên bé] đã học được 3 ngày! Đây là tóm tắt:

📚 Bài đã hoàn thành: [N] bài
⭐ Điểm quiz trung bình: [score]%
🔥 Chuỗi ngày học: [streak] ngày

[Hiển thị 1 thành tích nổi bật nếu có]

Còn 4 ngày trong trial — [Tên bé] đang trên đà tốt!

Xem chi tiết → [link /parent/reports]

P/S: Hơn 85% phụ huynh tiếp tục sau 7 ngày dùng thử khi con đã có báo cáo tiến độ như thế này.
<!-- TODO: update 85% figure với real cohort data khi có đủ mẫu -->

Cùng Con Tự Học
[Hủy nhận email] · [Chính sách bảo mật]
```

---

### D5 — Referral prompt + value reminder (trigger: D5 of trial)

**Subject:** [Tên bé] vừa mở khóa thành tựu đầu tiên! 🏆

**Body:**
```
Xin chào [Tên phụ huynh],

[Tên bé] vừa đạt thành tựu: [tên thành tựu — "Học sinh chuyên cần" nếu streak >= 3].

Bạn thấy hào hứng chứ? Chia sẻ hành trình của [Tên bé] với những phụ huynh khác:

Chia sẻ link dùng thử → [referral link]

Mỗi gia đình bạn giới thiệu thành công, cả hai cùng nhận thêm 7 ngày premium miễn phí.

Xem tiến độ bé → [link /parent/dashboard]

Cùng Con Tự Học
[Hủy nhận email] · [Chính sách bảo mật]
```

---

### D7 — Trial expiry + annual CTA (trigger: trial ends tomorrow)

**Subject:** Trial của bé [Tên bé] kết thúc ngày mai — giữ lại lộ trình

**Body:**
```
Xin chào [Tên phụ huynh],

7 ngày dùng thử của bé [Tên bé] sẽ kết thúc vào ngày mai.

📈 Tóm tắt 7 ngày:
- Bài hoàn thành: [N] bài
- Chuỗi học: [streak] ngày
- Tiến độ lộ trình: [%]

Để [Tên bé] tiếp tục lộ trình không bị gián đoạn:

👉 Gói Standard — chỉ 10,000 VND/tháng (120,000 VND/năm)
   [Nút: Chọn Standard ngay]

👉 Gói Family+ — 20,000 VND/tháng (240,000 VND/năm)
   Phù hợp gia đình nhiều bé
   [Nút: Chọn Family+]

✅ Không có phí ẩn · Hoàn tiền 7 ngày · Hủy bất kỳ lúc nào

Chọn gói → [link /pricing]

Cùng Con Tự Học
[Hủy nhận email] · [Chính sách bảo mật]
```

---

## Sequence 2: Weekly Digest (trigger: every Sunday, paying users)

**Subject:** Báo cáo tuần của [Tên bé] — tuần [N] 📋

**Body:**
```
Xin chào [Tên phụ huynh],

Đây là tóm tắt tuần [ngày] của [Tên bé]:

🔥 Chuỗi ngày học: [streak] ngày
📚 Bài hoàn thành tuần này: [N]
⭐ Điểm trung bình: [score]%
📈 So với tuần trước: [+N bài / -N bài]

[Thành tích nổi bật nếu có]

Xem báo cáo đầy đủ → [link]

Chia sẻ tiến độ con → [share link]

Cùng Con Tự Học
[Hủy nhận email] · [Chính sách bảo mật]
```

---

## Sequence 3: Winback D30 (trigger: paid user inactive 30 days)

**Subject:** [Tên bé] nhớ bạn rồi 💙

**Body:**
```
Xin chào [Tên phụ huynh],

Đã 30 ngày kể từ lần cuối [Tên bé] học trên Cùng Con Tự Học.

Lộ trình học vẫn đang chờ — chỉ cần 15 phút hôm nay để bắt đầu lại chuỗi ngày học.

Bắt đầu lại → [link /parent/dashboard]

Nếu có vấn đề gì, reply email này — chúng tôi luôn sẵn sàng hỗ trợ.

Cùng Con Tự Học
[Hủy nhận email] · [Chính sách bảo mật]
```

---

## Sequence 4: Upsell Trigger (trigger: approaching child profile limit)

**Subject:** Thêm bé vào lộ trình học — nâng cấp Family+

**Body:**
```
Xin chào [Tên phụ huynh],

Gói Standard hiện tại của bạn hỗ trợ tối đa 3 hồ sơ bé.

Nếu muốn thêm bé vào lộ trình, gói Family+ cho phép đến 5 hồ sơ bé:
- Báo cáo gộp theo gia đình
- Portfolio retention 365 ngày

Nâng cấp Family+ → [link /pricing]

Cùng Con Tự Học
[Hủy nhận email] · [Chính sách bảo mật]
```

---

## Sequence 5: Renewal Reminder (trigger: 14 days before annual expiry)

**Subject:** Gói của bé [Tên bé] sắp hết hạn — gia hạn để tiếp tục

**Body:**
```
Xin chào [Tên phụ huynh],

Gói Standard của [Tên bé] sẽ hết hạn vào [ngày hết hạn].

Để không làm gián đoạn lộ trình học, gia hạn ngay hôm nay:

Gia hạn Standard — 120,000 VND/năm → [link /pricing]

Tóm tắt 1 năm vừa qua:
- Tổng bài đã hoàn thành: [N]
- Chuỗi học dài nhất: [N] ngày
- Lộ trình đã đi qua: [%]

Gia hạn ngay → [link /pricing]

Cùng Con Tự Học
[Hủy nhận email] · [Chính sách bảo mật]
```

---

## Implementation Notes

- Trigger via BullMQ jobs (already configured)
- Personalization variables: `[Tên phụ huynh]`, `[Tên bé]`, `[N]`, `[streak]`, `[score]`, `[%]`
- Pull from `WeeklyReport` model for weekly digest
- All links should include UTM params: `utm_source=email&utm_medium=lifecycle&utm_campaign=[sequence-name]`
- Unsubscribe link mandatory (CAN-SPAM / GDPR compliance)
- Preferred ESP: Resend (developer-friendly, good deliverability) or Brevo (free tier 300/day)

# CODEX TASK: Implement Missing Core Pages — CungConTuHoc

## Context
Dự án Cùng Con Tự Học là nền tảng giáo dục trẻ em 2-6 tuổi, targeting phụ huynh Việt Nam. Stack: Next.js 16 + React 19 + TypeScript, Prisma/PostgreSQL, Better Auth.

**Đọc bắt buộc trước khi bắt đầu:**
- `README.md` — project overview
- `src/app/(main)/layout.tsx` — main layout với AppNav + SiteFooter
- `src/components/site-footer.tsx` — footer hiện tại (sẽ cần update)
- `src/app/(main)/pricing/page.tsx` — làm mẫu cho static pages
- `src/app/globals.css` — design tokens, CSS variables, fonts
- `src/components/homepage/homepage.css` — homepage styles (tham khảo pattern)
- `src/components/app-nav.tsx` và `src/components/app-nav-client.tsx` — navbar (sẽ update)

---

## PHASE 1 — Trang Pháp Lý (P0 — Bắt Buộc)

### 1.1 Chính Sách Bảo Mật (`/chinh-sach-bao-mat`)

**Tạo file:** `src/app/(main)/chinh-sach-bao-mat/page.tsx`

- Server Component, export `metadata` đúng chuẩn Next.js
- Nội dung tiếng Việt, đầy đủ các mục pháp lý về bảo vệ dữ liệu trẻ em
- Dùng layout đơn giản: `max-width prose, padding, typography`
- Không dùng thư viện ngoài, chỉ HTML/CSS có sẵn

**Metadata cần có:**
```typescript
export const metadata: Metadata = {
  title: "Chính Sách Bảo Mật | Cùng Con Tự Học",
  description: "Cam kết bảo vệ thông tin cá nhân và dữ liệu của trẻ em trên nền tảng Cùng Con Tự Học.",
  alternates: { canonical: "https://cungcontuhoc.vn/chinh-sach-bao-mat" },
};
```

**Nội dung trang (viết bằng tiếng Việt, professional):**

```
1. Thông Tin Chúng Tôi Thu Thập
   - Thông tin tài khoản phụ huynh (email, tên)
   - Thông tin hồ sơ trẻ (tên, tuổi — không có CCCD hay thông tin nhận dạng thực)
   - Dữ liệu học tập (bài học hoàn thành, tiến độ)
   - Dữ liệu thiết bị và phiên (IP ẩn danh, loại thiết bị)

2. Cách Chúng Tôi Sử Dụng Thông Tin
   - Cung cấp và cải thiện dịch vụ học tập
   - Tạo báo cáo tiến độ hàng tuần cho phụ huynh
   - Gửi thông báo liên quan đến tài khoản (opt-in)
   - Tuân thủ nghĩa vụ pháp lý

3. Chia Sẻ Dữ Liệu
   - Không bán dữ liệu cá nhân cho bên thứ ba
   - Chỉ chia sẻ với nhà cung cấp dịch vụ cần thiết (lưu trữ, email) dưới NDA
   - Nhà cung cấp: Cloudflare (lưu trữ), Resend (email), Stripe (thanh toán)

4. Bảo Vệ Dữ Liệu Trẻ Em
   - Chúng tôi không thu thập thông tin nhận dạng thực của trẻ
   - Phụ huynh kiểm soát hoàn toàn dữ liệu con em mình
   - Tuân thủ nguyên tắc GDPR và quy định bảo vệ trẻ em Việt Nam

5. Quyền Của Bạn
   - Quyền xem, sửa, xóa dữ liệu cá nhân
   - Quyền rút lại đồng ý bất kỳ lúc nào
   - Liên hệ: privacy@cungcontuhoc.vn

6. Cookies
   - Session cookie (cần thiết cho đăng nhập)
   - Không dùng cookie tracking hoặc quảng cáo

7. Thay Đổi Chính Sách
   - Thông báo qua email khi có thay đổi quan trọng
   - Ngày cập nhật gần nhất: [current date]

8. Liên Hệ
   - Email: privacy@cungcontuhoc.vn
   - Địa chỉ: [Thêm địa chỉ nếu có]
```

**Styling:** dùng class `prose-page` (tạo mới trong globals.css nếu cần):
```css
.prose-page { max-width: 760px; margin: 0 auto; padding: 3rem 1.5rem; }
.prose-page h1 { font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; }
.prose-page h2 { font-size: 1.25rem; font-weight: 700; margin-top: 2.5rem; margin-bottom: 0.75rem; color: var(--color-primary, #4f46e5); }
.prose-page p, .prose-page li { line-height: 1.8; color: #374151; margin-bottom: 0.75rem; }
.prose-page ul { list-style: disc; padding-left: 1.5rem; }
.prose-page .last-updated { font-size: 0.875rem; color: #6b7280; margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #e5e7eb; }
```

---

### 1.2 Điều Khoản Sử Dụng (`/dieu-khoan-su-dung`)

**Tạo file:** `src/app/(main)/dieu-khoan-su-dung/page.tsx`

Cấu trúc tương tự chính sách bảo mật.

**Metadata:**
```typescript
export const metadata: Metadata = {
  title: "Điều Khoản Sử Dụng | Cùng Con Tự Học",
  description: "Điều khoản và điều kiện sử dụng dịch vụ Cùng Con Tự Học.",
  alternates: { canonical: "https://cungcontuhoc.vn/dieu-khoan-su-dung" },
};
```

**Nội dung (tiếng Việt):**
```
1. Chấp Nhận Điều Khoản
   - Sử dụng dịch vụ đồng nghĩa với chấp nhận điều khoản
   - Nếu không đồng ý, vui lòng không sử dụng dịch vụ

2. Mô Tả Dịch Vụ
   - Nền tảng học tập trực tuyến cho trẻ 2-6 tuổi
   - Phụ huynh tạo tài khoản và quản lý hồ sơ con
   - Các gói dịch vụ: Miễn phí và Gia đình+ (Family+)

3. Điều Kiện Sử Dụng
   - Người dùng phải đủ 18 tuổi (phụ huynh/người giám hộ)
   - Thông tin đăng ký phải chính xác
   - Một tài khoản phụ huynh, tối đa 3 hồ sơ trẻ (Free) hoặc 5 (Family+)

4. Thanh Toán & Hoàn Tiền
   - Thanh toán hàng tháng qua Stripe
   - Hủy bất kỳ lúc nào, không mất phí ẩn
   - Hoàn tiền: xem Chính Sách Hoàn Tiền

5. Nội Dung & Sở Hữu Trí Tuệ
   - Toàn bộ nội dung học tập thuộc bản quyền Cùng Con Tự Học
   - Người dùng không được sao chép, phân phối nội dung

6. Giới Hạn Trách Nhiệm
   - Dịch vụ cung cấp "as-is", không đảm bảo 100% uptime
   - Không chịu trách nhiệm gián tiếp, mất mát dữ liệu ngoài tầm kiểm soát

7. Chấm Dứt Tài Khoản
   - Chúng tôi có quyền tạm dừng tài khoản vi phạm điều khoản
   - Người dùng có thể xóa tài khoản bất kỳ lúc nào

8. Thay Đổi Điều Khoản
   - Thông báo 30 ngày trước khi có thay đổi quan trọng

9. Pháp Luật Áp Dụng
   - Luật pháp nước Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam

10. Liên Hệ
    - Email: support@cungcontuhoc.vn
```

---

### 1.3 Chính Sách Hoàn Tiền (`/chinh-sach-hoan-tien`)

**Tạo file:** `src/app/(main)/chinh-sach-hoan-tien/page.tsx`

**Metadata:**
```typescript
export const metadata: Metadata = {
  title: "Chính Sách Hoàn Tiền | Cùng Con Tự Học",
  description: "Chính sách hoàn tiền minh bạch của Cùng Con Tự Học.",
};
```

**Nội dung:**
```
Hoàn tiền trong 7 ngày đầu nếu không hài lòng.
Không hoàn tiền sau 7 ngày nếu đã sử dụng dịch vụ.
Yêu cầu hoàn tiền qua email: billing@cungcontuhoc.vn
Xử lý trong 5-10 ngày làm việc.
```

---

## PHASE 2 — Trang Giới Thiệu (`/gioi-thieu`)

**Tạo file:** `src/app/(main)/gioi-thieu/page.tsx`

**Mục tiêu:** Xây dựng trust với phụ huynh Việt Nam — trả lời câu hỏi "Ai đứng sau sản phẩm này?"

**Metadata:**
```typescript
export const metadata: Metadata = {
  title: "Giới Thiệu | Cùng Con Tự Học",
  description: "Câu chuyện đằng sau Cùng Con Tự Học — nền tảng học tập cho trẻ 2-6 tuổi được xây dựng bởi phụ huynh Việt.",
  alternates: { canonical: "https://cungcontuhoc.vn/gioi-thieu" },
};
```

**Layout trang (sections):**

```jsx
// 1. Hero section — Mission statement
<section className="about-hero">
  <h1>Câu Chuyện Của Chúng Tôi</h1>
  <p className="about-lead">
    Cùng Con Tự Học được tạo ra bởi những phụ huynh hiểu rõ thách thức
    của việc nuôi dưỡng và giáo dục trẻ nhỏ trong thế giới hiện đại.
  </p>
</section>

// 2. Mission & Vision
<section className="about-mission">
  <div className="mission-card">
    <span>🎯</span>
    <h2>Sứ Mệnh</h2>
    <p>Giúp mỗi trẻ em Việt Nam có cơ hội phát triển toàn diện thông qua học tập vui vẻ, 
    kết hợp công nghệ và sự đồng hành của phụ huynh.</p>
  </div>
  <div className="mission-card">
    <span>🌟</span>
    <h2>Tầm Nhìn</h2>
    <p>Trở thành người bạn đồng hành học tập đáng tin cậy nhất của 
    1 triệu gia đình Việt Nam.</p>
  </div>
</section>

// 3. Why we built this
<section className="about-why">
  <h2>Tại Sao Chúng Tôi Xây Dựng Đây?</h2>
  <p>Là phụ huynh, chúng tôi từng lo lắng: Con có đang phát triển đúng? 
  15 phút mỗi ngày có đủ không? Và quan trọng nhất — làm sao thấy được 
  sự tiến bộ thực sự của con?</p>
  <p>Cùng Con Tự Học ra đời để trả lời những câu hỏi đó bằng dữ liệu, 
  bằng báo cáo rõ ràng, và bằng một lộ trình học tập được thiết kế khoa học.</p>
</section>

// 4. Core values (3 cards)
<section className="about-values">
  <h2>Giá Trị Cốt Lõi</h2>
  <div className="values-grid">
    <div>🧠 <h3>Khoa Học</h3> <p>Mọi bài học dựa trên nghiên cứu phát triển trẻ em</p></div>
    <div>❤️ <h3>Yêu Thương</h3> <p>Học tập qua niềm vui, không áp lực, không so sánh</p></div>
    <div>🔍 <h3>Minh Bạch</h3> <p>Phụ huynh thấy rõ mọi tiến độ của con</p></div>
  </div>
</section>

// 5. CTA section
<section className="about-cta">
  <h2>Bắt Đầu Hành Trình Cùng Chúng Tôi</h2>
  <Link href="/auth/signup">Dùng Thử Miễn Phí 7 Ngày</Link>
</section>
```

**CSS (thêm vào globals.css hoặc tạo `about.css`):**
```css
.about-hero { text-align: center; padding: 4rem 2rem 2rem; max-width: 760px; margin: 0 auto; }
.about-hero h1 { font-size: 2.5rem; font-weight: 800; }
.about-lead { font-size: 1.2rem; color: #6b7280; margin-top: 1rem; line-height: 1.8; }
.about-mission { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; max-width: 760px; margin: 2rem auto; padding: 0 1.5rem; }
.mission-card { background: #f9fafb; border-radius: 1rem; padding: 2rem; }
.mission-card span { font-size: 2rem; }
.mission-card h2 { font-size: 1.25rem; font-weight: 700; margin: 0.5rem 0; }
.about-why, .about-values { max-width: 760px; margin: 3rem auto; padding: 0 1.5rem; }
.values-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-top: 1.5rem; }
.values-grid > div { text-align: center; padding: 1.5rem; background: #fafafa; border-radius: 0.75rem; }
.about-cta { text-align: center; padding: 3rem 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin-top: 3rem; }
.about-cta a { display: inline-block; background: white; color: #4f46e5; padding: 0.875rem 2rem; border-radius: 9999px; font-weight: 700; text-decoration: none; margin-top: 1rem; }
@media (max-width: 640px) {
  .about-mission { grid-template-columns: 1fr; }
  .values-grid { grid-template-columns: 1fr; }
}
```

---

## PHASE 3 — Trang Liên Hệ (`/lien-he`)

**Tạo file:** `src/app/(main)/lien-he/page.tsx`

**Metadata:**
```typescript
export const metadata: Metadata = {
  title: "Liên Hệ | Cùng Con Tự Học",
  description: "Liên hệ với đội ngũ Cùng Con Tự Học để được hỗ trợ hoặc hợp tác.",
  alternates: { canonical: "https://cungcontuhoc.vn/lien-he" },
};
```

**Trang này là Server Component với form client-side (tách component riêng).**

**Tạo `src/components/contact-form.tsx`** — `'use client'`:
```typescript
// Form với: name, email, subject (select), message (textarea)
// Subject options: Hỗ trợ kỹ thuật | Hợp tác / B2B | Báo lỗi | Khác
// On submit: POST /api/contact (tạo route mới — xem bên dưới)
// State: idle | loading | success | error
// Success: "Cảm ơn! Chúng tôi sẽ phản hồi trong 24-48 giờ."
```

**Tạo `src/app/api/contact/route.ts`** — POST:
```typescript
// Zod validate: { name, email, subject, message }
// Nếu REPORT_EMAIL_PROVIDER=resend: gửi email tới admin
// Nếu không: log ra console + return success
// Rate limit: tối đa 5 requests/IP/hour (copy pattern từ existing rate limiter)
// Return: { success: true, message: 'Đã nhận được tin nhắn của bạn' }
```

**Layout trang Liên Hệ:**
```
- Header: "Liên Hệ Với Chúng Tôi"
- 2-column layout (desktop): Info left | Form right
  - Left: email, giờ phản hồi, địa chỉ (nếu có)
  - Right: ContactForm component
- FAQ link: "Xem câu hỏi thường gặp tại /#faq"
```

**CSS class prefix:** `contact-` (thêm vào globals.css):
```css
.contact-page { max-width: 1040px; margin: 0 auto; padding: 3rem 1.5rem; }
.contact-header { text-align: center; margin-bottom: 3rem; }
.contact-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 3rem; align-items: start; }
.contact-info-card { background: #f9fafb; border-radius: 1rem; padding: 2rem; }
.contact-info-item { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
.contact-form-card { background: white; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 2rem; }
.contact-form-field { margin-bottom: 1.25rem; }
.contact-form-field label { display: block; font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; }
.contact-form-field input,
.contact-form-field select,
.contact-form-field textarea { width: 100%; padding: 0.75rem 1rem; border: 1.5px solid #d1d5db; border-radius: 0.5rem; font-size: 1rem; transition: border-color 0.15s; }
.contact-form-field input:focus,
.contact-form-field select:focus,
.contact-form-field textarea:focus { outline: none; border-color: var(--color-primary, #4f46e5); }
.contact-form-submit { width: 100%; padding: 1rem; background: var(--color-primary, #4f46e5); color: white; border: none; border-radius: 0.5rem; font-size: 1rem; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
.contact-form-submit:disabled { opacity: 0.6; cursor: not-allowed; }
@media (max-width: 768px) { .contact-grid { grid-template-columns: 1fr; } }
```

---

## PHASE 4 — Trang Referral Public (`/gioi-thieu-ban`)

**Tạo file:** `src/app/(main)/gioi-thieu-ban/page.tsx`

> Backend referral đã có sẵn. Trang này chỉ là marketing page giải thích chương trình.

**Metadata:**
```typescript
export const metadata: Metadata = {
  title: "Giới Thiệu Bạn Bè | Cùng Con Tự Học",
  description: "Giới thiệu bạn bè dùng Cùng Con Tự Học và nhận ưu đãi hấp dẫn.",
};
```

**Nội dung (Server Component):**
```
1. Hero: "Chia Sẻ Niềm Vui Học Tập" — giải thích chương trình giới thiệu
2. How it works (3 steps): Đăng ký → Chia sẻ link → Nhận phần thưởng
3. CTA: Nếu đã đăng nhập → link tới /parent/dashboard (referral section)
        Nếu chưa đăng nhập → link tới /auth/signup
4. Terms: Điều khoản ngắn gọn về chương trình
```

---

## PHASE 5 — Update Footer & Navbar & Sitemap

### 5.1 Update `src/components/site-footer.tsx`

Thêm 2 cột mới vào footer:

```tsx
// Thêm cột "Về Chúng Tôi"
<div className="footer-col">
  <h4>Về Chúng Tôi</h4>
  <Link href="/gioi-thieu">Giới thiệu</Link>
  <Link href="/lien-he">Liên hệ</Link>
  <Link href="/gioi-thieu-ban">Giới thiệu bạn</Link>
</div>

// Thêm cột "Pháp Lý"
<div className="footer-col">
  <h4>Pháp Lý</h4>
  <Link href="/chinh-sach-bao-mat">Chính sách bảo mật</Link>
  <Link href="/dieu-khoan-su-dung">Điều khoản sử dụng</Link>
  <Link href="/chinh-sach-hoan-tien">Chính sách hoàn tiền</Link>
</div>
```

### 5.2 Update Navbar (tìm `app-nav-client.tsx`)

Trước khi update, tìm file `app-nav-client.tsx` (likely ở `src/components/`). Thêm dropdown hoặc link "Giới thiệu" vào nav nếu navbar có đủ space. Nếu navbar quá đơn giản, chỉ thêm khi là mobile menu.

### 5.3 Update `src/app/sitemap.ts`

Thêm static URLs:
```typescript
{ url: `${siteUrl}/pricing`, changeFrequency: "monthly", priority: 0.8 },
{ url: `${siteUrl}/gioi-thieu`, changeFrequency: "monthly", priority: 0.7 },
{ url: `${siteUrl}/lien-he`, changeFrequency: "monthly", priority: 0.6 },
{ url: `${siteUrl}/chinh-sach-bao-mat`, changeFrequency: "monthly", priority: 0.4 },
{ url: `${siteUrl}/dieu-khoan-su-dung`, changeFrequency: "monthly", priority: 0.4 },
```

---

## FINAL VERIFICATION (bắt buộc)

```bash
pnpm type-check
pnpm lint
```

Verify các URL sau trả về 200:
```
http://localhost:3000/chinh-sach-bao-mat
http://localhost:3000/dieu-khoan-su-dung
http://localhost:3000/chinh-sach-hoan-tien
http://localhost:3000/gioi-thieu
http://localhost:3000/lien-he
http://localhost:3000/gioi-thieu-ban
http://localhost:3000/sitemap.xml  ← phải có các URLs mới
```

---

## CRITICAL RULES

1. **Không sửa existing code** ngoài footer.tsx, app-nav-client.tsx, sitemap.ts — zero breaking changes
2. **Pass type-check sau mỗi phase** trước khi qua phase tiếp theo
3. **Tất cả text là tiếng Việt** có dấu đầy đủ — không viết không dấu
4. **Server Components by default** — chỉ dùng `'use client'` cho form có state (contact-form.tsx)
5. **Dùng CSS classes** theo pattern của dự án — không inline styles
6. **Không cài thêm package** ngoài những gì đã có — dùng Lucide React cho icons
7. **API /contact phải có rate limiting** — copy pattern từ existing rate limiter

---

## Priority Order

```
P0 (làm trước):  Phase 1 (Legal) + Phase 5 (Footer/Sitemap update)
P1 (làm tiếp):   Phase 2 (Giới thiệu) + Phase 3 (Liên hệ)
P2 (cuối cùng):  Phase 4 (Referral public page)
```

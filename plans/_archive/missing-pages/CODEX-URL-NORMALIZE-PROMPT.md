# CODEX TASK: Chuẩn Hóa URL — Đổi Sang Tiếng Anh

## Phân Tích SEO (Lý Do Đổi)

**Vấn đề:** URL hiện tại không nhất quán — các trang cũ dùng tiếng Anh (`/blog`, `/pricing`, `/auth/login`), còn các trang mới dùng tiếng Việt (`/gioi-thieu`, `/lien-he`, ...).

**Phán quyết của chuyên gia SEO:** Đổi sang tiếng Anh vì:
1. **Consistency** là yếu tố quan trọng nhất — URL mixed sẽ bị Google đánh giá thấp
2. **Encoding safe** — URL tiếng Việt không dấu (`gioi-thieu`) vừa không rõ nghĩa với quốc tế, vừa không phải tiếng Việt chuẩn; URL tiếng Anh rõ ràng và không bị encode khi share
3. **Link equity** — URL tiếng Anh dễ được backlink từ cộng đồng quốc tế
4. **301 redirect** — cần có để tránh mất traffic nếu đã index

---

## Bảng Mapping — URL Cũ → URL Mới

| URL tiếng Việt (cũ) | URL tiếng Anh (mới) |
|---------------------|---------------------|
| `/gioi-thieu` | `/about` |
| `/lien-he` | `/contact` |
| `/gioi-thieu-ban` | `/referral` |
| `/chinh-sach-bao-mat` | `/privacy` |
| `/dieu-khoan-su-dung` | `/terms` |
| `/chinh-sach-hoan-tien` | `/refund-policy` |

---

## Phạm Vi Thay Đổi

Đọc các file sau trước khi bắt đầu:
- `src/components/site-footer.tsx` — có links dùng href cũ
- `src/app/sitemap.ts` — có hardcoded URLs cũ
- `src/app/(main)/chinh-sach-bao-mat/page.tsx` — thư mục cần rename + canonical URL
- `src/app/(main)/dieu-khoan-su-dung/page.tsx`
- `src/app/(main)/chinh-sach-hoan-tien/page.tsx`
- `src/app/(main)/gioi-thieu/page.tsx`
- `src/app/(main)/lien-he/page.tsx`
- `src/app/(main)/gioi-thieu-ban/page.tsx`
- `next.config.ts` — sẽ thêm redirects

---

## PHASE 1 — Rename Thư Mục Routes

Đổi tên các thư mục trong `src/app/(main)/`:

```
chinh-sach-bao-mat/ → privacy/
dieu-khoan-su-dung/ → terms/
chinh-sach-hoan-tien/ → refund-policy/
gioi-thieu/ → about/
lien-he/ → contact/
gioi-thieu-ban/ → referral/
```

Dùng lệnh git mv để giữ history (nếu repo đã track):
```bash
git mv "src/app/(main)/chinh-sach-bao-mat" "src/app/(main)/privacy"
git mv "src/app/(main)/dieu-khoan-su-dung" "src/app/(main)/terms"
git mv "src/app/(main)/chinh-sach-hoan-tien" "src/app/(main)/refund-policy"
git mv "src/app/(main)/gioi-thieu" "src/app/(main)/about"
git mv "src/app/(main)/lien-he" "src/app/(main)/contact"
git mv "src/app/(main)/gioi-thieu-ban" "src/app/(main)/referral"
```

Nếu git mv không hoạt động (do special chars trong tên), dùng cách thủ công:
1. Tạo thư mục mới với tên tiếng Anh
2. Copy toàn bộ file vào thư mục mới
3. Xóa thư mục cũ

---

## PHASE 2 — Update `metadata.alternates.canonical` Trong Mỗi page.tsx

Sau khi rename thư mục, update canonical URL trong từng file:

**`src/app/(main)/privacy/page.tsx`:**
```typescript
export const metadata: Metadata = {
  title: "Chính Sách Bảo Mật | Cùng Con Tự Học",
  description: "Cam kết bảo vệ thông tin cá nhân và dữ liệu của trẻ em trên nền tảng Cùng Con Tự Học.",
  alternates: { canonical: "https://cungcontuhoc.vn/privacy" },
};
```

**`src/app/(main)/terms/page.tsx`:**
```typescript
export const metadata: Metadata = {
  title: "Điều Khoản Sử Dụng | Cùng Con Tự Học",
  description: "Điều khoản và điều kiện sử dụng dịch vụ Cùng Con Tự Học.",
  alternates: { canonical: "https://cungcontuhoc.vn/terms" },
};
```

**`src/app/(main)/refund-policy/page.tsx`:**
```typescript
export const metadata: Metadata = {
  title: "Chính Sách Hoàn Tiền | Cùng Con Tự Học",
  description: "Chính sách hoàn tiền minh bạch của Cùng Con Tự Học.",
  alternates: { canonical: "https://cungcontuhoc.vn/refund-policy" },
};
```

**`src/app/(main)/about/page.tsx`:**
```typescript
export const metadata: Metadata = {
  title: "Giới Thiệu | Cùng Con Tự Học",
  description: "Câu chuyện đằng sau Cùng Con Tự Học — nền tảng học tập cho trẻ 2-6 tuổi.",
  alternates: { canonical: "https://cungcontuhoc.vn/about" },
};
```

**`src/app/(main)/contact/page.tsx`:**
```typescript
export const metadata: Metadata = {
  title: "Liên Hệ | Cùng Con Tự Học",
  description: "Liên hệ với đội ngũ Cùng Con Tự Học để được hỗ trợ.",
  alternates: { canonical: "https://cungcontuhoc.vn/contact" },
};
```

**`src/app/(main)/referral/page.tsx`:**
```typescript
export const metadata: Metadata = {
  title: "Giới Thiệu Bạn Bè | Cùng Con Tự Học",
  description: "Giới thiệu bạn bè dùng Cùng Con Tự Học và nhận ưu đãi.",
  alternates: { canonical: "https://cungcontuhoc.vn/referral" },
};
```

---

## PHASE 3 — Update `src/components/site-footer.tsx`

Thay thế tất cả href cũ:

```typescript
// Cột "Về chúng tôi"
<Link href="/about">Giới thiệu</Link>
<Link href="/contact">Liên hệ</Link>
<Link href="/referral">Giới thiệu bạn</Link>

// Cột "Pháp lý"
<Link href="/privacy">Chính sách bảo mật</Link>
<Link href="/terms">Điều khoản sử dụng</Link>
<Link href="/refund-policy">Chính sách hoàn tiền</Link>
```

Xóa biến `privacyHref` đã dùng string obfuscation — không cần nữa, replace bằng literal `/privacy`.

---

## PHASE 4 — Update `src/app/sitemap.ts`

Xóa biến `privacyPath` obfuscated. Thay toàn bộ URLs:

```typescript
{ url: `${siteUrl}/pricing`, changeFrequency: "monthly", priority: 0.8 },
{ url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.7 },
{ url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.6 },
{ url: `${siteUrl}/referral`, changeFrequency: "monthly", priority: 0.6 },
{ url: `${siteUrl}/privacy`, changeFrequency: "monthly", priority: 0.4 },
{ url: `${siteUrl}/terms`, changeFrequency: "monthly", priority: 0.4 },
{ url: `${siteUrl}/refund-policy`, changeFrequency: "monthly", priority: 0.4 },
```

---

## PHASE 5 — Thêm 301 Redirects vào `next.config.ts`

Mở file `next.config.ts`. Tìm phần `async redirects()` hoặc thêm mới vào object `nextConfig`:

```typescript
async redirects() {
  return [
    { source: '/gioi-thieu', destination: '/about', permanent: true },
    { source: '/lien-he', destination: '/contact', permanent: true },
    { source: '/gioi-thieu-ban', destination: '/referral', permanent: true },
    // Dùng encoded form cho URLs có ký tự đặc biệt
    { source: '/chinh-sach-bao-mat', destination: '/privacy', permanent: true },
    { source: '/dieu-khoan-su-dung', destination: '/terms', permanent: true },
    { source: '/chinh-sach-hoan-tien', destination: '/refund-policy', permanent: true },
  ];
},
```

> Lý do: 301 permanent redirect bảo vệ SEO nếu Google đã crawl URL cũ.

---

## PHASE 6 — Tìm Và Sửa Tất Cả Internal Links Còn Sót

Chạy lệnh grep để tìm bất kỳ hardcoded URL cũ nào còn sót trong codebase:

```bash
grep -r "gioi-thieu\|lien-he\|chinh-sach\|dieu-khoan" src/ --include="*.tsx" --include="*.ts" -l
```

Với mỗi file tìm được, replace URL cũ → URL mới tương ứng.

---

## FINAL VERIFICATION (bắt buộc)

```bash
pnpm type-check
pnpm lint
```

Verify các URL sau đều trả về 200:
```
http://localhost:3000/about
http://localhost:3000/contact
http://localhost:3000/referral
http://localhost:3000/privacy
http://localhost:3000/terms
http://localhost:3000/refund-policy
```

Verify 301 redirects hoạt động (phải redirect sang URL mới):
```
http://localhost:3000/gioi-thieu         → 301 → /about
http://localhost:3000/lien-he            → 301 → /contact
http://localhost:3000/chinh-sach-bao-mat → 301 → /privacy
```

Verify sitemap:
```
http://localhost:3000/sitemap.xml  → phải có /about, /contact, /privacy, /terms, /refund-policy, /referral
```

---

## CRITICAL RULES

1. **Không sửa gì ngoài phạm vi trên** — không touch blog, auth, pricing, parent, admin, kid-app
2. **Pass type-check sau mỗi phase** trước khi qua phase tiếp
3. **301 redirect là bắt buộc** — không xóa URL cũ mà không có redirect
4. **Xóa hết string obfuscation** (`privacyHref`, `privacyPath`) — replace bằng literal `/privacy`
5. **Không đổi nội dung trang** — chỉ đổi URL và canonical metadata

---

## Priority Order

```
Phase 1 + 2 + 3 + 4 (làm cùng nhau):  Rename folders + update hrefs + sitemap
Phase 5 (bắt buộc):                     301 redirects trong next.config.ts
Phase 6 (cuối):                          Grep & fix remaining references
```

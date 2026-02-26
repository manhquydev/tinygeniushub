# CODEX PROMPT — Sprint QA-FIX-01: Giải Quyết 15 Issues Từ QA Report
**Nguồn gốc:** `plans/QA-REPORT.md` (76 checks — 58 PASS / 15 FAIL / 3 BLOCKED)  
**Date:** 2026-02-24  
**Role:** Senior Developer executing Project Lead's action plan  
**Scope:** Fix tất cả HIGH + MEDIUM severity issues. LOW issues ghi rõ để review sau.

> ⛔ Không sửa database, không push git, không cài thêm npm package lớn nếu không cần thiết.

---

## 🔴 PRIORITY 1 — HIGH SEVERITY (Bắt buộc fix trong sprint này)

### ISSUE-H1: SEO — Duplicate Title Suffix & Missing OG Image & Missing Canonical

**Vấn đề phát hiện:**
- Title pattern bị double suffix: `"... | Cùng Con Tự Học | Cùng Con Tự Học"` trên một số trang
- Homepage thiếu `og:image` trong metadata
- `/pricing` và `/blog` thiếu `<link rel="canonical">`

**File cần kiểm tra và fix:**

#### Bước 1: Kiểm tra root layout template
Đọc `src/app/(main)/layout.tsx` — nếu layout này có khai báo `title.template`, kiểm tra xem các page con có tự thêm suffix không. Nếu page con dùng `title: "Tên trang | Cùng Con Tự Học"` mà layout đã có template `"%s | Cùng Con Tự Học"` → double suffix.

**Fix:** Các page con chỉ cần `title: "Tên trang"` (không thêm suffix), để layout template xử lý.

#### Bước 2: Thêm og:image cho homepage
Đọc `src/app/(main)/page.tsx` (hoặc root `src/app/layout.tsx`). Thêm vào metadata:
```ts
openGraph: {
  images: [
    {
      url: "/og-image.png", // hoặc đường dẫn đúng tới OG image hiện có
      width: 1200,
      height: 630,
      alt: "Cùng Con Tự Học — Learning Journey cho trẻ 2-6 tuổi",
    },
  ],
},
```
Kiểm tra xem file `public/og-image.png` hoặc `opengraph-image.tsx` có tồn tại không (`src/app/opengraph-image.tsx` đã có). Dùng URL tương ứng.

#### Bước 3: Thêm canonical cho /pricing và /blog
Trong `src/app/(main)/pricing/page.tsx`:
```ts
export const metadata: Metadata = {
  // existing fields...
  alternates: {
    canonical: "/pricing",
  },
};
```

Trong `src/app/(main)/blog/page.tsx`:
```ts
export const metadata: Metadata = {
  // existing fields...
  alternates: {
    canonical: "/blog",
  },
};
```

**Verification sau fix:**
```bash
curl -s http://localhost:3000/pricing | grep -i "canonical\|og:image"
curl -s http://localhost:3000/blog | grep -i "canonical"
curl -s http://localhost:3000 | grep -i "og:image"
```

---

### ISSUE-H2: Mobile UX — Navbar Collapse & Tap Targets

**Vấn đề phát hiện:**
- Tại viewport 375px: không phát hiện hamburger menu / mobile nav collapse
- Nhiều interactive elements có height 20-32px (yêu cầu tối thiểu 44px trên mobile)

**File cần kiểm tra:**
```bash
# Tìm Navbar component:
find src -name "Navbar*" -o -name "navbar*" -o -name "Header*" | grep -v node_modules
```

**Fix Navbar:**
1. Đọc Navbar component hiện tại
2. Kiểm tra xem có `hidden md:flex` hoặc tương đương không → nếu có menu ẩn trên mobile mà không có hamburger, thêm hamburger toggle
3. Nếu hamburger đã có nhưng không hoạt động → debug state management

**Fix tap targets — tìm elements nhỏ:**
```bash
grep -rn "h-8\|h-9\|min-h-8\|min-h-9\|py-1 \|py-1\.5 " src/components --include="*.tsx" | grep -v "//\|icon\|dot\|badge\|pill" | head -20
```
Với các nav links và buttons có `py-1` hoặc height < 44px trên mobile, thêm `min-h-[44px]` hoặc padding appropriate.

**Chú ý:** Không phá layout desktop. Chỉ thêm mobile-specific min-height:
```tsx
// Trước:
className="px-3 py-1.5 text-sm..."
// Sau:
className="px-3 py-1.5 min-h-[44px] flex items-center text-sm..."
```

---

### ISSUE-H3: i18n — Vietnamese Encoding Corruption (Mojibake)

**Vấn đề:** Tester phát hiện mojibake/encoding corruption trong các trang about, blog SEO metadata.

**Bước 1: Tìm các file có encoding corruption:**
```bash
# Tìm các chuỗi tiếng Việt bị corrupt (mẫu phổ biến của UTF-8 đọc sai):
grep -rn "á»\|Ä\|Æ°\|ĩ\|á»™\|Ä'" src/modules src/app --include="*.ts" --include="*.tsx" | grep -v ".d.ts\|node_modules" | head -30
```

**Bước 2: Kiểm tra file blog SEO:**
```bash
cat src/modules/blog/blog-seo.ts | head -50
```
Nếu file có encoding sai, cần resave với UTF-8 encoding. Dùng:
```bash
# Check encoding:
file -i src/modules/blog/blog-seo.ts
# Hoặc:
python3 -c "
with open('src/modules/blog/blog-seo.ts', 'rb') as f:
    content = f.read()
    try:
        content.decode('utf-8')
        print('UTF-8 OK')
    except UnicodeDecodeError as e:
        print(f'Encoding error at byte {e.start}: {e.reason}')
"
```

**Bước 3: Fix encoding in-place nếu có mojibake:**
Mở file bị ảnh hưởng, tìm các string bị corrupt, replace bằng Unicode tiếng Việt đúng. Ví dụ phổ biến:
- `báo cáo` bị thành `b\u00e1o c\u00e1o` → giữ nguyên (đây là escape đúng)
- `bÃ o cÃ¡o` → đây là mojibake thực sự, cần fix về `báo cáo`

---

## 🟡 PRIORITY 2 — MEDIUM SEVERITY

### ISSUE-M1: Accessibility — Lighthouse 3 Failed Audits

**Vấn đề:**
1. `aria-prohibited-attr` — ARIA attribute không hợp lệ trên element
2. `color-contrast` — màu text/bg tương phản chưa đủ 4.5:1
3. `heading-order` — heading levels bị skip (ví dụ: H2 → H4)

**Fix `aria-prohibited-attr`:**
```bash
# Tìm aria-label trên elements không nên có:
grep -rn 'aria-label\|aria-hidden\|role=' src/components --include="*.tsx" | grep -v "//\|icon\|button\|svg\|img\|input\|nav\|menu\|dialog" | head -20
```
Các `<div>` hay `<span>` thông thường không nên có `role="img"` hoặc `aria-label` trừ khi có mục đích cụ thể.

**Fix `heading-order`:**
```bash
# Tìm heading tags trong footer và layout:
grep -rn "<h[1-6]" src/app/\(main\)/layout.tsx src/components --include="*.tsx" | head -20
```
Tìm nơi heading bị nhảy level (ví dụ: H2 → H4 không có H3 ở giữa). Fix bằng cách đổi sang level đúng hoặc dùng class để style thay vì heading semantics.

**Fix `color-contrast`:**
- Chạy Lighthouse để xác định chính xác elements nào fail
- Thường gặp: text màu `slate-400` trên bg trắng tại small text sizes
- Fix: tăng lên `slate-600` hoặc đậm hơn

### ISSUE-M2: Contact Form — Message Max Length Không Enforce

**Vấn đề:** Submit message > 500 chars → API trả 200 (không validate)

**Fix:**
1. Tìm `src/app/api/contact/route.ts`
2. Tìm schema validation (zod hoặc manual)
3. Thêm max length:
```ts
// Nếu dùng Zod:
const schema = z.object({
  email: z.string().email(),
  message: z.string().min(10).max(500), // thêm max(500)
  // ...
});

// Nếu dùng manual:
if (body.message.length > 500) {
  return NextResponse.json(
    { error: "Tin nhắn không được vượt quá 500 ký tự." },
    { status: 400 }
  );
}
```

4. Cũng thêm `maxLength={500}` và counter vào form UI:
```tsx
// Trong contact form component:
<textarea
  maxLength={500}
  // ...
/>
<p className="text-xs text-slate-500 text-right">{message.length}/500</p>
```

### ISSUE-M3: Route Documentation — /auth/register vs /auth/signup

**Vấn đề:** QA spec dùng `/auth/register` nhưng thực tế là `/auth/signup`. Document để tránh confusion.

**Fix:** Tạo hoặc cập nhật `plans/ROUTE-MAP.md`:
```markdown
# Route Map — Cùng Con Tự Học

## Auth Routes
- /auth/login — Đăng nhập
- /auth/signup — Đăng ký (KHÔNG phải /auth/register)
- /auth/forgot-password — Quên mật khẩu (nếu có)

## API Routes
- /api/billing/checkout — Billing (KHÔNG phải /api/billing)
- /api/admin/[resource] — Admin API (xem src/app/api/admin/)
```

---

## 🟢 PRIORITY 3 — LOW SEVERITY (Ghi nhận, fix nếu có thời gian)

### ISSUE-L1: Admin Blog — Thiếu Dấu Tiếng Việt

**Vấn đề:** `"Quan ly bai viet"` và `"Bai viet xem nhieu nhat"` trong admin blog page.

**Fix:**
```bash
# Tìm file:
find src/app/\(main\)/admin -name "*.tsx" | xargs grep -l "bai viet\|quan ly\|Quan ly\|Bai viet" 2>/dev/null
```
Sửa text thành `"Quản lý bài viết"` và `"Bài viết xem nhiều nhất"`.

### ISSUE-L2: Test Files Dọn Dẹp

**Vấn đề:** `src/app/test-global-error/` vẫn còn trong repo (tạo ra khi test).

**Fix:**
```bash
rm -rf src/app/test-global-error
rm -rf src/app/'(main)'/test-error
```

### ISSUE-L3: Large File — admin/service.ts (1551 lines)

**Vấn đề:** `src/modules/admin/service.ts` 1551 lines — khó maintain.
**Action:** Ghi chú để Tech Lead review và split thành sub-services trong sprint sau. Không sửa trong sprint này.

---

## ✅ Checklist Verification Sau Fix

```
SEO:
□ curl http://localhost:3000 | grep "og:image" → phải có
□ curl http://localhost:3000/pricing | grep "canonical" → phải có
□ curl http://localhost:3000/blog | grep "canonical" → phải có
□ Title pages không bị double suffix

Mobile UX:
□ Mở Chrome DevTools 375px: hamburger menu visible
□ Tab qua nav links: tất cả click targets ≥ 44px height

i18n Encoding:
□ python3 encoding check → UTF-8 OK trên tất cả files đã kiểm tra
□ curl http://localhost:3000/about | grep -i "mojibake-pattern" → empty

Accessibility:
□ Lighthouse accessibility ≥ 93/100 (từ 91 ban đầu)
□ Heading không skip level

Contact Form:
□ POST /api/contact với message 501 chars → 400 Bad Request
□ Form UI có counter "XXX/500"

Admin i18n:
□ Admin blog page có "Quản lý bài viết" không phải "Quan ly bai viet"

Cleanup:
□ src/app/test-global-error/ đã bị xóa

Final:
□ pnpm type-check → 0 errors
□ pnpm check:i18n → 0 missing/unused keys
□ pnpm dev → không có error mới
```

---

## 📝 Output File

Sau khi hoàn thành, cập nhật `plans/QA-REPORT.md`:
- Đổi status các issues đã fix từ `FAIL` → `FIXED ✅`
- Ghi actual kết quả verification
- Thêm section `## Fix Log` với danh sách files đã chỉnh sửa

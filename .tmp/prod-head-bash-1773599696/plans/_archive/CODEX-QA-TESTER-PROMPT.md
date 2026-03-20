# CODEX PROMPT — QA Testing: Cùng Con Tự Học
**Version:** 1.0  
**Date:** 2026-02-24  
**Role:** Senior QA Engineer  
**Scope:** Toàn bộ ứng dụng Next.js 16 App Router — `cungcontuhoc`

---

## 🎯 Mục Tiêu

Thực hiện kiểm thử toàn diện ứng dụng theo 7 domain của QA chuyên nghiệp 2025:
1. **Functional Testing** — kiểm tra chức năng
2. **UI/UX Testing** — giao diện, luồng người dùng
3. **i18n/L10n Testing** — văn bản tiếng Việt
4. **API Testing** — endpoint integrity
5. **Security Testing** — authentication, authorization, input
6. **SEO Testing** — metadata, sitemap, robots
7. **Accessibility Testing** — keyboard nav, semantic HTML

**Output yêu cầu:** File báo cáo `QA-REPORT.md` trong thư mục `plans/`

---

## 📋 DOMAIN 1 — Functional Testing

### 1.1 Navigation & Routing
Kiểm tra từng route sau và ghi kết quả `PASS/FAIL + ghi chú`:

```bash
# List routes cần test:
/ (homepage)
/about
/pricing
/blog
/blog/[slug] (lấy 1 bài viết thực từ DB để test)
/auth/login
/auth/register
/contact
/privacy
/terms
/refund-policy
/referral
/setup
/not-a-real-page-404-test
/maintenance
/offline
```

Với mỗi route:
- HTTP status code = 200 (hoặc đúng với redirect)
- Không có JavaScript `console.error` nào xuất hiện
- Title tag đúng format: `"[Tên Trang] | Cùng Con Tự Học"`
- Không có broken link trong navbar/footer

### 1.2 Form Validation — Contact Form (`/contact`)
```
Test cases:
□ Submit form trống → phải show validation error
□ Submit email sai format (abc@) → phải reject  
□ Submit text quá dài (>500 chars) → phải giới hạn hoặc reject
□ Submit đầy đủ hợp lệ → phải show success message
□ XSS test: nhập <script>alert(1)</script> → phải sanitize
```

### 1.3 Auth Flow
```
Test cases:
□ Truy cập /parent/* khi chưa đăng nhập → redirect về /auth/login
□ Truy cập /admin/* khi chưa đăng nhập → redirect/403
□ Truy cập /admin/* với account thường (non-admin) → 403 hoặc redirect
□ Đăng nhập với sai mật khẩu → show error message đúng
□ Đăng nhập đúng → redirect đúng (về dashboard)
□ Truy cập /setup khi đã setup xong → redirect đúng
```

### 1.4 Blog System
```
Test cases:
□ Trang /blog có hiển thị danh sách bài không?
□ Click 1 bài → /blog/[slug] load đúng nội dung?
□ Bài viết có pagination không? Test page 2 nếu có
□ Blog có social share buttons không? Click thử
□ /rss.xml trả về valid RSS feed (XML content-type)?
□ Sitemap có chứa các URL blog không?
```

### 1.5 Referral & Invite
```
Test cases:
□ /referral có hiển thị referral link không?
□ /accept-invite?token=INVALID → behavior đúng (error, không crash)
□ /accept-invite (không có token) → redirect về / đúng?
```

---

## 📋 DOMAIN 2 — UI/UX Testing

### 2.1 Responsive Design (sử dụng Playwright hoặc browser DevTools)
Kiểm tra ở 3 breakpoint cho 3 trang quan trọng nhất (`/`, `/pricing`, `/blog`):

| Breakpoint | Width | Tên |
|---|---|---|
| Mobile | 375px | iPhone SE |
| Tablet | 768px | iPad |
| Desktop | 1440px | Standard |

Với mỗi breakpoint, kiểm tra:
- Navbar collapse đúng (hamburger menu trên mobile)
- Text không bị tràn ra ngoài container
- Images không bị stretch/distort
- Buttons có tap target ≥ 44px (mobile)
- Không có horizontal scroll bar

### 2.2 Visual Consistency Check
```
□ Font thống nhất trong toàn app? (Be Vietnam Pro)
□ Primary brand color (#14b8a6 ~ teal) xuất hiện đúng
□ Không có flash of unstyled content (FOUC) khi load
□ Mascot Cú Con animated ở đúng trang và đúng state
□ Footer có đầy đủ links? Footer links còn dẫn đúng không?
```

### 2.3 Error State UI
```
□ /not-a-real-page → 404 page đẹp có hiện không?  
□ /test-error → Segment error page (main) hiện đúng không?
□ /maintenance → Maintenance page đúng không?
□ /offline → Offline page đúng không?
□ Dev tools: disable network → trang có graceful fail không?
```

---

## 📋 DOMAIN 3 — i18n / Localization Testing

### 3.1 Văn Bản Tiếng Việt — Rà Soát Toàn Bộ
Chạy lệnh tìm kiếm hard-coded English text trong UI:

```bash
# Tìm các chuỗi tiếng Anh trong component files (không phải comment/code)
grep -rn '"[A-Z][a-z]* [a-z]' src/app --include="*.tsx" | grep -v "className\|import\|type\|interface\|const\|http\|css\|font\|color\|border\|px\|em\|rem\|#\|//" | grep -v "src/app/api" | head -50
```

Kiểm tra kiểm tra thủ công các trang này cho tiếng Anh lẫn tiếng Việt không phù hợp:
```
Trang cần check:
□ / (homepage)
□ /pricing — có label tiếng Anh nào không? (Plan names, feature list)
□ /about
□ /blog
□ /auth/login và /auth/register
□ /parent/* (dashboard, reports, settings)
□ /admin/* 
□ Error pages: 404, global-error, maintenance
```

### 3.2 Special Characters & Diacritics
```bash
# Tìm text thiếu dấu tiếng Việt phổ biến (heuristic)
grep -rn 'Phu huynh\|hoc sinh\|bai viet\|trang chu\|dat mua\|dang nhap\|dang ky' src/app --include="*.tsx" | grep -v "//"
```

### 3.3 String Length Testing
Kiểm tra xem UI có bị vỡ layout với text dài không (tiếng Việt thường dài hơn tiếng Anh 30-40%):
```
□ Buttons: text có bị truncate ở mobile?
□ Card titles: có bị cut với tiêu đề bài blog dài?
□ Nav items: có bị overflow ở 768px không?
```

---

## 📋 DOMAIN 4 — API Testing

### 4.1 Health Check
```bash
# Basic health endpoint:
curl -s http://localhost:3000/api/health | jq .
# Expected: {"status": "ok"} hoặc tương đương
```

### 4.2 Authentication Endpoint Security
```bash
# Test 1: Unauthenticated access to protected API
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/admin/users
# Expected: 401 hoặc 403 (KHÔNG phải 200)

curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/reports/weekly
# Expected: 401 hoặc 403

curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/children
# Expected: 401 hoặc 403

curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/billing
# Expected: 401 hoặc 403
```

### 4.3 Public API Endpoints
```bash
# Test blog public endpoints:
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/blog/posts
# Expected: 200

curl -s "http://localhost:3000/api/health" | python3 -m json.tool
# Expected: valid JSON, status 200
```

### 4.4 Input Validation Testing
```bash
# Test malformed requests:
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"email": "not-an-email", "message": ""}' \
  -s -w "\n%{http_code}"
# Expected: 400 Bad Request với error message

# SQL Injection attempt (test input sanitization):
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "message": "'; DROP TABLE users; --"}' \
  -s -w "\n%{http_code}"
# Expected: 200 OK (xử lý bình thường) hoặc 400. KHÔNG phải 500.

# XSS payload in API:
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"email": "test@test.com", "message": "<script>alert(1)</script>"}' \
  -s -w "\n%{http_code}"
# Expected: 200 OK nhưng response body phải sanitize hoặc escape
```

### 4.5 HTTP Methods Validation
```bash
# Test wrong HTTP method:
curl -X DELETE http://localhost:3000/api/contact -s -w "%{http_code}"
# Expected: 405 Method Not Allowed

curl -X PUT http://localhost:3000/api/health -s -w "%{http_code}"
# Expected: 405 Method Not Allowed
```

### 4.6 RSS Feed Validation
```bash
curl -s http://localhost:3000/rss.xml | head -20
# Expected: <?xml version="1.0" ... với <rss version="2.0">
```

---

## 📋 DOMAIN 5 — Security Testing

### 5.1 HTTPS & Headers Check
```bash
# Kiểm tra security headers (với curl trên localhost):
curl -s -I http://localhost:3000/ | grep -i "x-frame\|x-content-type\|x-xss\|content-security\|strict-transport"
# Ghi chú: localhost dev không có HTTPS headers; chỉ note thiếu để fix trên production
```

### 5.2 Middleware Maintenance Check
```bash
# Verify maintenance redirect đúng:
NEXT_PUBLIC_MAINTENANCE_MODE=true patterns kiểm tra trong code middleware:
1. /api/* → không bị redirect (phải next())
2. /_next/* → không bị redirect  
3. /* → redirect đến /maintenance
4. /maintenance → không bị redirect loop
```

Đọc file `src/middleware.ts` và xác nhận:
```
□ Có guard `pathname !== "/maintenance"` không?
□ Có exclude `/api` prefix không?
□ Có exclude `/_next` không?
□ Có exclude static files (pathname.includes(".")) không?
```

### 5.3 Protected Routes Audit
Dùng lệnh grep để tìm tất cả server-side auth check:
```bash
# Tìm auth guards trong server components/API routes:
grep -rn "getSession\|auth()\|requireAuth\|unauthorized\|redirect.*login" src/app --include="*.ts" --include="*.tsx" | grep -v "//\|node_modules" | head -40
```

Danh sách routes cần có auth guard (kiểm tra từng file):
```
□ src/app/(main)/parent/*/page.tsx — có auth guard?
□ src/app/(main)/admin/*/page.tsx — có auth guard + admin role check?
□ src/app/(main)/setup/page.tsx — có auth guard?
□ src/app/api/admin/**/*.ts — có auth + role check?
□ src/app/api/billing/**/*.ts — có auth check?
□ src/app/api/reports/**/*.ts — có auth check?
```

### 5.4 Environment Variables Exposure Check
```bash
# Kiểm tra NEXT_PUBLIC_ vars nào đang expose:
grep -rn "NEXT_PUBLIC_" src/ --include="*.ts" --include="*.tsx" | grep -v ".d.ts" | grep -v node_modules | grep -oP 'NEXT_PUBLIC_[A-Z_]+' | sort -u

# CRITICAL: Kiểm tra có secret key nào bị expose qua NEXT_PUBLIC_ không:
# Liệt kê tất cả NEXT_PUBLIC_ vars, các vars này phải là safe to expose:
# OK: NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_MAINTENANCE_MODE, NEXT_PUBLIC_STRIPE_PK
# NOT OK: NEXT_PUBLIC_DATABASE_URL, NEXT_PUBLIC_SECRET_KEY
```

---

## 📋 DOMAIN 6 — SEO Testing

### 6.1 Metadata Audit
```bash
# Kiểm tra metadata cho từng page quan trọng:
curl -s http://localhost:3000 | grep -i "<title>\|<meta name=\"description\"\|<meta property=\"og:"
curl -s http://localhost:3000/pricing | grep -i "<title>\|<meta name=\"description\""
curl -s http://localhost:3000/blog | grep -i "<title>\|<meta name=\"description\""
```

Tiêu chí pass:
```
□ <title> không phải "Cùng Con Tự Học | Cùng Con Tự Học" (duplicate)
□ <meta description> có trên mọi page, không blank
□ og:title, og:description, og:image có trên homepage
□ og:image là URL hợp lệ
```

### 6.2 Robots.txt & Sitemap
```bash
curl -s http://localhost:3000/robots.txt
# Expected: có User-agent, có Sitemap: URL

curl -s http://localhost:3000/sitemap.xml | head -30
# Expected: valid XML với <urlset>, chứa ít nhất 5 URLs
```

### 6.3 Heading Structure Audit
Với mỗi trang dưới, dùng curl lấy HTML rồi grep h1:
```bash
for path in "/" "/pricing" "/blog" "/about"; do
  echo "=== $path ==="
  curl -s "http://localhost:3000$path" | grep -oi "<h1[^>]*>.*</h1>" | head -3
done
```

Tiêu chí:
```
□ Mỗi trang chỉ có đúng 1 thẻ <h1>
□ H1 không được để trống
□ H2, H3 phải theo hierarchy (không nhảy từ H1 → H4)
```

### 6.4 Canonical & Lang Check
```bash
curl -s http://localhost:3000 | grep -i 'lang=\|canonical\|rel="canonical"'
# Expected: <html lang="vi"> và có canonical URL
```

---

## 📋 DOMAIN 7 — Accessibility Testing

### 7.1 Keyboard Navigation
Script test keyboard accessibility (chạy trong browser console tại từng trang):
```javascript
// Dán vào browser console để kiểm tra focus trap:
const focusableElements = document.querySelectorAll(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);
console.log(`Total focusable elements: ${focusableElements.length}`);
// Expected: > 0 trên mọi trang có interactive elements
```

Kiểm tra thủ công (dùng Tab key trên browser):
```
□ Homepage (/) — Tab qua navbar, hero buttons, cards
□ /blog — Tab qua blog cards, pagination
□ /auth/login — Tab qua form fields, submit button
□ Focus outline visible (không bị CSS reset)
```

### 7.2 Color Contrast Check (tự động)
Chạy Lighthouse audit và ghi lại score:
```bash
# Nếu có Lighthouse CLI:
npx lighthouse http://localhost:3000 --only-categories=accessibility --output=json --quiet 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
score = data['categories']['accessibility']['score'] * 100
print(f'Accessibility score: {score}/100')
items = data['audits']
failures = [k for k,v in items.items() if v.get('score') == 0 and v.get('details')]
print(f'Failed audits: {len(failures)}')
for f in failures[:10]:
    print(f'  - {f}')
"
```

### 7.3 Semantic HTML Audit
```bash
# Kiểm tra HTML structure:
curl -s http://localhost:3000 | grep -oi '<main\|<nav\|<header\|<footer\|<article\|<section\|<aside' | sort | uniq -c
# Expected: có main, nav, header, footer

# Kiểm tra images có alt text không:
curl -s http://localhost:3000 | grep -oi '<img[^>]*>' | grep -v 'alt=' | wc -l
# Expected: 0 (mọi img phải có alt)

curl -s http://localhost:3000 | grep -oi '<img[^>]*>' | grep 'alt=""' | wc -l  
# Nếu > 0: check xem img decorative hay content — decorative thì alt="" là OK
```

### 7.4 ARIA Labels Check
```bash
curl -s http://localhost:3000 | grep -oi 'aria-label="[^"]*"' | head -20
# Expected: có aria-label cho icon buttons, form inputs không có visible label
```

---

## 📋 BONUS — Performance & Technical Debt

### Kiểm Tra TypeScript Errors
```bash
cd d:/project/cungcontuhoc
pnpm type-check 2>&1 | tail -30
# Expected: "No errors" hoặc 0 error
```

### Kiểm Tra i18n Keys
```bash
pnpm check:i18n 2>&1 | tail -20
# Expected: No missing or unused keys
```

### Kiểm Tra Test Files Còn Sót
```bash
find src/app -name "test-*" -type d
# Expected: CHỈ THẤY test-error và test-global-error (tạm thời)
# Nếu thấy folder khác → ghi vào báo cáo để xóa
```

### Large File Detection
```bash
find src -name "*.tsx" -o -name "*.ts" | xargs wc -l 2>/dev/null | sort -rn | head -15
# Files > 500 lines nên được review để split
```

---

## 📝 Output: Viết `plans/QA-REPORT.md`

Sau khi hoàn thành tất cả test trên, viết file báo cáo với format:

```markdown
# QA Report — Cùng Con Tự Học
**Date:** [date]
**Tester:** Codex QA Agent  
**Environment:** localhost:3000 (development)

## Executive Summary
[Tổng quan: X/Y tests pass, N issues phát hiện]

## Domain 1: Functional Testing
| Test | Status | Notes |
|---|---|---|
| / loads 200 | PASS/FAIL | ... |
...

## Domain 2: UI/UX
...

## Domain 3: i18n
...

## Domain 4: API Security
...

## Domain 5: Security
...

## Domain 6: SEO
...

## Domain 7: Accessibility
...

## Issues Found — Severity Matrix
| Issue | Severity | Domain | Steps to Reproduce |
|---|---|---|---|
| [Issue 1] | CRITICAL/HIGH/MED/LOW | ... | ... |

## Recommendations
[Danh sách hành động ưu tiên]
```

---

## ❌ Những việc KHÔNG làm
- Không sửa bất kỳ source file nào
- Không thay đổi database hoặc seed data
- Không commit hay push code
- Không expose hoặc log secrets ra file báo cáo
- Không gọi API ngoài (Stripe, database, email) — chỉ test localhost

## ✅ Definition of Done
- File `plans/QA-REPORT.md` đã được tạo
- Mọi command test đã chạy và ghi kết quả thực tế (không phỏng đoán)
- Mọi `FAIL` có ghi rõ expected vs actual
- Issues phân loại đúng severity: CRITICAL / HIGH / MEDIUM / LOW

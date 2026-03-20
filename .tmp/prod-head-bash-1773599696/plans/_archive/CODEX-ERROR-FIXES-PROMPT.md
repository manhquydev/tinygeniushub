# CODEX PROMPT — Error Pages: Bug Fixes & Missing Pages
**Version:** 1.0  
**Date:** 2026-02-24  
**Priority:** HIGH  
**Context:** Sau khi visual review hệ thống error pages đã triển khai, phát hiện 4 bug UI và 1 trang còn thiếu.

---

## 🔴 TASK 1 — Fix: Cú Mẹ bị cắt ở 404 Not Found Page

### File: `src/app/not-found.tsx`

### Vấn đề:
Khi Cú Mẹ (Big Owl) animate vào từ cạnh phải, container được khai báo là `right-0` nhưng Cú Mẹ size=240px chỉ dịch sang trái `x: -40`. Điều này khiến phần thân bên phải của mascot bị **clip bởi viewport edge** — user nhìn thấy Cú Mẹ bị cắt cụt ở cạnh màn hình.

### Root Cause:
```tsx
// HIỆN TẠI (lỗi):
className="absolute right-0 top-[44%] -translate-y-1/2"
initial={{ x: 280, opacity: 0, scale: 0.5 }}
animate={{ x: -40, opacity: 1, scale: 1 }}
```
Với `right-0` và mascot 240px, khi `x = -40` thì phần lớn mascot tràn ra khỏi viewport bên phải.

### Fix yêu cầu:
Tìm đoạn code tại dòng ~280-298 trong `not-found.tsx`, thay giá trị `x` trong `animate` cho Cú Mẹ:

```tsx
// SAU KHI FIX:
animate={{ x: -220, opacity: 1, scale: 1 }}
```

**Lưu ý:**
- Giữ nguyên `initial={{ x: 280, opacity: 0, scale: 0.5 }}`
- Giữ nguyên `exit={{ x: 280, opacity: 0 }}`
- Không thay đổi bất kỳ prop nào khác
- Không thêm `overflow-hidden` vào parent container

---

## 🟡 TASK 2 — Upgrade: Segment Error UI

### File: `src/app/(main)/error.tsx`

### Vấn đề phát hiện qua visual review:
1. Mascot quá nhỏ (170px) trong card lớn — thiếu trọng lượng visual
2. Card xuất hiện đột ngột — không có animation khi error boundary kích hoạt
3. Shadow card quá nhẹ — flat trên nền pastel

### Fix yêu cầu:

#### 2a. Tăng size mascot: `size={170}` → `size={200}`

#### 2b. Thay transition của `m.div` wrapping mascot:
```tsx
// HIỆN TẠI:
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3, ease: "easeOut" }}

// SAU KHI FIX:
initial={{ opacity: 0, scale: 0.92, y: 16 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.8 }}
```

#### 2c. Tăng shadow section card:
```tsx
// HIỆN TẠI: shadow-[0_20px_44px_rgba(15,23,42,0.08)]
// SAU KHI FIX: shadow-[0_24px_60px_rgba(15,23,42,0.13)]
```

**Không thay đổi:** text, button handler, logic `reset()`, `router.back()`, `isDevelopment`.

---

## 🟡 TASK 3 — Upgrade: Maintenance Page

### File: `src/app/maintenance/page.tsx`

### Vấn đề phát hiện:
1. Mascot duo quá nhỏ (260px) trên canvas 100vh — canvas trống rỗng
2. Không có social/contact links — user không biết theo dõi update ở đâu

### Fix yêu cầu:

#### 3a. Tăng size mascot duo: `size={260}` → `size={310}`

#### 3b. Thêm 2 social links sau phần dots animation
Thêm block sau closing `</div>` của dots (`aria-label="Đang tải"`):

```tsx
<div className="mt-6 flex flex-wrap items-center justify-center gap-3">
  <a
    href="https://facebook.com/cungcontuhoc"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 rounded-full border border-slate-200/25 bg-slate-900/45 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:-translate-y-0.5 hover:bg-slate-900/65"
  >
    <svg aria-hidden className="h-4 w-4 fill-current" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12.073h2.54V9.86c0-2.508 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12.073h2.773l-.443 2.89h-2.33v6.988C20.343 21.201 24 17.064 24 12.073z" />
    </svg>
    Facebook
  </a>
  <a
    href="https://zalo.me/cungcontuhoc"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-2 rounded-full border border-sky-200/30 bg-sky-900/40 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:-translate-y-0.5 hover:bg-sky-900/60"
  >
    <svg aria-hidden className="h-4 w-4 fill-current" viewBox="0 0 24 24">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.226 17.617l-.008.024-.014.024a1.17 1.17 0 01-.232.296l-.022.018-.025.015-.033.016h-.002l-.023.007-.027.006a.998.998 0 01-.242.029h-.005a1 1 0 01-.465-.114l-2.286-1.243a10.15 10.15 0 01-3.973-3.975l-1.243-2.286a1 1 0 01.672-1.449h.002l.024-.003.027-.001.024.001h.003l.025.004.024.006.023.008.022.01.021.011.02.013.019.015.018.016.016.018.015.02.013.02.008.016.009.025.006.022.004.024.001.024v.005c0 .088-.018.174-.053.254l-.538 1.28.538-1.28z" />
    </svg>
    Zalo
  </a>
</div>
```

**Ghi chú quan trọng:** File `maintenance/page.tsx` là **Server Component** — không thêm `"use client"`, không thêm hook, không thêm event handler JS. Chỉ dùng HTML thuần + Tailwind + Mascot.

---

## 🟢 TASK 4 — Upgrade: Loading State

### File: `src/app/loading.tsx`

### Vấn đề:
Loading overlay quá kín đáo. User có thể không nhận ra app đang tải.

### Fix yêu cầu:
Thêm thin progress bar animation ở top của màn hình. Giữ nguyên mascot overlay corner.

**Bước 1:** Thay toàn bộ nội dung `src/app/loading.tsx` bằng:
```tsx
import { GlobalLoader } from "@/components/global-loader";
import { Mascot } from "@/components/mascot";

export default function GlobalLoading() {
  return (
    <div className="fixed inset-0 z-50">
      {/* Thin progress bar top */}
      <div
        className="fixed left-0 top-0 z-[240] h-[3px] w-full overflow-hidden"
        aria-hidden
      >
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400"
          style={{ animation: "loadingBar 1.4s cubic-bezier(0.65,0,0.35,1) infinite" }}
        />
      </div>

      <GlobalLoader />

      {/* Mascot corner overlay */}
      <div className="pointer-events-none fixed inset-0 z-[230] flex items-end justify-end p-4 sm:p-6">
        <div className="flex items-center gap-3 rounded-2xl border border-sky-200/35 bg-slate-950/82 px-3 py-2 text-cyan-100 shadow-[0_14px_28px_rgba(2,6,23,0.45)]">
          <Mascot variant="small" state="sleepy" gazeDirection="center" size={88} motionLevel="minimal" />
          <p className="animate-pulse text-sm font-semibold">Đang tải...</p>
        </div>
      </div>
    </div>
  );
}
```

**Bước 2:** Append vào cuối file `src/app/globals.css` (sau dòng cuối cùng):
```css
/* Loading page progress bar */
@keyframes loadingBar {
  0%   { transform: translateX(-100%); width: 40%; }
  50%  { width: 70%; }
  100% { transform: translateX(200%); width: 40%; }
}
```

---

## 🟢 TASK 5 — New Page: Offline Fallback

### Files cần tạo mới:
1. `src/app/offline/page.tsx`
2. `public/sw.js`
3. Sửa `src/app/layout.tsx`

### 5a. Tạo `src/app/offline/page.tsx`:
```tsx
import type { Metadata } from "next";
import { Mascot } from "@/components/mascot";

export const metadata: Metadata = {
  title: "Mất kết nối | Cùng Con Tự Học",
};

const STAR_FIELD = [
  { top: "8%",  left: "12%", size: 2, opacity: 0.7,  delay: 0.1, duration: 3.2 },
  { top: "15%", left: "35%", size: 3, opacity: 0.88, delay: 0.7, duration: 2.7 },
  { top: "22%", left: "71%", size: 2, opacity: 0.65, delay: 1.3, duration: 3.5 },
  { top: "31%", left: "87%", size: 3, opacity: 0.9,  delay: 0.4, duration: 2.9 },
  { top: "44%", left: "19%", size: 2, opacity: 0.73, delay: 1.8, duration: 3.7 },
  { top: "52%", left: "53%", size: 3, opacity: 0.83, delay: 0.6, duration: 2.8 },
  { top: "61%", left: "78%", size: 2, opacity: 0.64, delay: 2.2, duration: 3.3 },
  { top: "74%", left: "26%", size: 2, opacity: 0.76, delay: 1.6, duration: 3.1 },
  { top: "85%", left: "47%", size: 3, opacity: 0.88, delay: 0.9, duration: 2.6 },
  { top: "91%", left: "65%", size: 2, opacity: 0.6,  delay: 1.4, duration: 3.8 },
] as const;

export default function OfflinePage() {
  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#050d1a] text-slate-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(20,184,166,0.28)_0%,transparent_36%),radial-gradient(circle_at_88%_10%,rgba(56,189,248,0.2)_0%,transparent_34%),radial-gradient(circle_at_50%_92%,rgba(99,102,241,0.28)_0%,transparent_44%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-[12%] top-[8%] h-20 w-20 rounded-full bg-white/90 blur-[2px]"
        style={{ boxShadow: "0 0 60px 20px rgba(253,224,71,0.22)" }}
      />
      <div aria-hidden className="not-found-fog not-found-fog-a" />
      <div aria-hidden className="not-found-fog not-found-fog-b" />

      {STAR_FIELD.map((star, index) => (
        <span
          key={`offline-star-${index}`}
          aria-hidden
          className="pointer-events-none absolute rounded-full bg-white"
          style={{
            top: star.top, left: star.left,
            width: star.size, height: star.size,
            opacity: star.opacity,
            boxShadow: "0 0 14px rgba(248,250,252,0.8)",
            animation: `notFoundTwinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <Mascot
          variant="small"
          state="thinking"
          gazeDirection="center"
          size={200}
          motionLevel="full"
          className="drop-shadow-[0_20px_48px_rgba(14,165,233,0.28)]"
        />
        <h1 className="max-w-[22ch] text-balance text-3xl font-black leading-tight tracking-[-0.02em] text-white sm:text-5xl">
          Không có kết nối mạng...
        </h1>
        <p className="max-w-[44ch] text-pretty text-base leading-relaxed text-slate-200/90 sm:text-lg">
          Cú Con không thể kết nối lúc này. Kiểm tra Wi-Fi hoặc 4G rồi thử lại nhé!
        </p>
        <a
          href="/"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-emerald-200/45 bg-gradient-to-r from-teal-500 to-cyan-500 px-6 text-sm font-black text-white shadow-[0_16px_32px_rgba(20,184,166,0.3)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100/90 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050d1a]"
        >
          Thử lại
        </a>
      </section>
    </main>
  );
}
```

### 5b. Tạo `public/sw.js`:
```js
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("offline-cache-v1").then((cache) => cache.add(OFFLINE_URL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.open("offline-cache-v1").then((cache) => cache.match(OFFLINE_URL))
      )
    );
  }
});
```

### 5c. Sửa `src/app/layout.tsx`:
Trong `RootLayout`, thêm `<script>` tag trước closing `</body>`:
```tsx
<script
  dangerouslySetInnerHTML={{
    __html: `if('serviceWorker'in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(e){console.warn('[SW]',e)})})}`
  }}
/>
```

---

## ❌ Việc KHÔNG làm
- Không thay đổi logic nghiệp vụ bất kỳ file nào
- Không thêm npm dependency mới
- Không dùng `<style jsx>` hay `useAnimationControls`
- Không thêm `"use client"` vào Server Components (maintenance, offline, layout)

---

## ✅ Checklist Verification

```
TASK 1 — 404 Fix:
□ Cú Mẹ hiển thị đầy đủ không bị cắt viewport cạnh phải
□ Animation vào từ phải vẫn smooth

TASK 2 — Segment Error Upgrade:
□ Mascot size 200px
□ Spring animation khi mount (stiffness 320, damping 28)
□ Shadow card đậm hơn

TASK 3 — Maintenance Upgrade:
□ Mascot duo size 310px
□ 2 link FB + Zalo xuất hiện sau dots
□ Vẫn là Server Component

TASK 4 — Loading Upgrade:
□ Progress bar mỏng chạy ở top
□ Keyframe loadingBar trong globals.css
□ Mascot corner vẫn hiển thị

TASK 5 — Offline Page:
□ src/app/offline/page.tsx tồn tại
□ public/sw.js tồn tại
□ ServiceWorker đăng ký trong layout.tsx
□ localhost:3000/offline render đúng

Sau khi làm xong:
□ pnpm type-check không lỗi mới
□ pnpm dev chạy bình thường
```

# CODEX PROMPT: Hệ Thống Error Pages — Cùng Con Tự Học

> **Vai trò:** Tech Lead · **Ưu tiên:** High · **Ngày:** 2026-02-24

---

## Audit Hiện Trạng

| Trang | File | Trạng thái |
|---|---|---|
| 404 Not Found | `src/app/not-found.tsx` | DONE (vừa cập nhật) |
| Loading skeleton | `src/app/loading.tsx` | Chỉ delegate GlobalLoader — chưa đủ |
| Global Error (5xx) | `src/app/global-error.tsx` | THIEU |
| Route Segment Error | `src/app/(main)/error.tsx` | THIEU |
| Maintenance Mode | (bất kỳ file nào) | THIEU |

**Kết luận:** Dự án thiếu toàn bộ tầng error boundary. Nếu server crash, database timeout, deploy dở, user thấy màn hình trắng. Đây là lỗ hổng UX nghiêm trọng cho sản phẩm hướng phụ huynh.

---

## Scope — 4 Tasks

### TASK 1: `src/app/global-error.tsx` — Server Crash

`global-error.tsx` bắt lỗi root layout. PHẢI render html+body tự mình vì root layout không mount. Dùng "use client".

**Yêu cầu:**
- Màn hình tối cinematic như not-found.tsx (bg `#050d1a`, stars, moon, fog)
- Mascot `variant="big"` state `"sad"` — Cú Mẹ buồn vì hệ thống gặp sự cố
- Heading: "Ôi! Có sự cố kỹ thuật rồi..."
- Subtext: "Nhóm kỹ thuật đã được thông báo. Vui lòng thử lại sau ít phút."
- Button "Tải lại trang" → `window.location.reload()`
- Button "Về trang chủ" → `window.location.href = "/"`
- `useEffect` log `error.digest` vào console
- KHÔNG import server-only code. Chỉ dùng: motion/react, Mascot
- File BẮT BUỘC bắt đầu bằng `"use client";`
- File BẮT BUỘC có `<html lang="vi">` và `<body>` tag

```tsx
"use client";
import { useEffect } from "react";
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error.digest, error);
  }, [error]);
  // ... render
}
```

---

### TASK 2: `src/app/(main)/error.tsx` — Segment Errors

Bắt lỗi trong route group (main). Layout (main) vẫn mount — có navbar/footer. Dùng "use client".

**Yêu cầu:**
- Nền SÁNG (không dark) vì navbar (main) màu trắng — dùng `bg-white` hoặc `bg-slate-50`
- Mascot `variant="small"` state `"sad"` — Cú Con buồn
- Heading: "Trang này gặp sự cố rồi..."
- Subtext: "Thử lại hoặc quay về trang trước nhé!"
- Button "Thử lại" → `reset()` (Next.js prop)
- Button "Quay lại" → `router.back()`
- Hiện `error.digest` nhỏ italic muted CHỈ KHI `process.env.NODE_ENV === "development"`
- `useEffect(() => console.error(error), [error])`

```tsx
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function MainError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
```

---

### TASK 3: `src/app/loading.tsx` — Nâng Cấp

Hiện tại chỉ có:
```tsx
import { GlobalLoader } from "@/components/global-loader";
export default function GlobalLoading() { return <GlobalLoader />; }
```

Yêu cầu: Xem `src/components/global-loader/` để hiểu current implementation trước khi sửa. Thêm mascot nhỏ `variant="small"` state `"sleepy"` ở góc dưới phải với text "Đang tải..." pulse animation. Giữ GlobalLoader làm nền. Dùng `fixed inset-0 z-50`.

---

### TASK 4: Maintenance Mode

**File A — `src/middleware.ts`** (tạo mới nếu chưa có, thêm vào nếu đã có):

```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const maintenance = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true";
  const { pathname } = request.nextUrl;
  if (maintenance && pathname !== "/maintenance") {
    if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

**File B — `src/app/maintenance/page.tsx`** (tạo mới):
- Không cần "use client" — static page
- Màn hình tối cinematic như not-found.tsx
- Mascot `variant="duo"` state playful — Cú Mẹ và Cú Con đang sơn sửa
- Heading: "Đang nâng cấp hệ thống"
- Subtext: "Cú Mẹ và Cú Con đang sơn sửa nhà. Quay lại sau nhé!"
- 3 animated dots loading
- metadata export: `title: "Bảo trì | Cùng Con Tự Học"`

---

## Design Rules — KHÔNG ĐƯỢC VI PHẠM

1. KHÔNG `<style jsx>` — CSS đặt trong `globals.css`
2. KHÔNG `useAnimationControls` kết hợp với string `calc()` trong animate prop
3. KHÔNG import server-only code vào global-error.tsx
4. Reuse CSS classes từ `globals.css`:
   - `.not-found-fog`, `.not-found-fog-a`, `.not-found-fog-b`
   - keyframes: `notFoundTwinkle`, `notFoundFogDrift`, `notFoundShimmer`
5. Tất cả text phải tiếng Việt có dấu — check bằng `pnpm check:i18n`

## Animation Stack

```tsx
import { LazyMotion, domAnimation } from "motion/react";
import * as m from "motion/react-m";
// Wrap root với <LazyMotion features={domAnimation}>
```

## Mascot API

```tsx
import { Mascot } from "@/components/mascot";
// variant: "big" | "small" | "duo"
// state: "idle"|"happy"|"thinking"|"sad"|"sleepy"|"playful"|"proud"|"love"
// gazeDirection: "left" | "center" | "right"
// motionLevel: "minimal" | "full"
// size: number (px)
```

## Background Pattern (dark screens)

```tsx
// Gradient overlay
<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(20,184,166,0.3)_0%,transparent_36%),radial-gradient(circle_at_88%_10%,rgba(56,189,248,0.24)_0%,transparent_34%),radial-gradient(circle_at_50%_92%,rgba(99,102,241,0.32)_0%,transparent_44%)]" />

// Moon
<m.div className="pointer-events-none absolute right-[12%] top-[8%] h-20 w-20 rounded-full bg-white/90 blur-[2px]"
  style={{ boxShadow: "0 0 60px 20px rgba(253,224,71,0.25)" }}
  animate={{ scale: [1, 1.06, 1], opacity: [0.88, 1, 0.88] }}
  transition={{ duration: 6.2, ease: "easeInOut", repeat: Infinity }} />

// Fog (từ globals.css)
<div className="not-found-fog not-found-fog-a" />
<div className="not-found-fog not-found-fog-b" />
```

---

## Verification

```bash
pnpm type-check   # MUST pass zero errors
pnpm check:i18n  # MUST pass
```

Manual test:
1. Global error: thêm `throw new Error("test")` vào root layout tạm thời → thấy global-error.tsx
2. Segment error: thêm `throw new Error("test")` vào `src/app/(main)/page.tsx` → thấy main/error.tsx, navbar vẫn hiển thị
3. Maintenance: thêm `NEXT_PUBLIC_MAINTENANCE_MODE=true` vào `.env.local`, restart dev → mọi URL redirect /maintenance

---

## Files cần tạo/sửa

| File | Action |
|---|---|
| `src/app/global-error.tsx` | CREATE — Critical |
| `src/app/(main)/error.tsx` | CREATE — Critical |
| `src/app/loading.tsx` | MODIFY — Medium |
| `src/middleware.ts` | CREATE — Medium |
| `src/app/maintenance/page.tsx` | CREATE — Medium |

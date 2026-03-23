---
title: "Fix admin sidebar collapsible icon mode"
description: "Fix header/footer overflow, remove duplicate trigger, add cookie hydration and pointer-events fix for icon-collapsed sidebar"
status: pending
priority: P1
effort: 1.5h
branch: main
tags: [admin, sidebar, ui, bugfix]
created: 2026-03-18
---

# Admin Sidebar Collapsible Icon Mode Fix

## Research Reports
- [Sidebar internals](../reports/researcher-1-260318-sidebar-collapsible-internals.md)
- [Header/Footer patterns](../reports/researcher-2-260318-sidebar-header-footer-patterns.md)
- [Trigger UX patterns](../reports/researcher-3-260318-sidebar-trigger-ux-patterns.md)

## Phase Overview

| # | Fix | File | Status |
|---|-----|------|--------|
| 1 | SidebarHeader: hide text + remove duplicate trigger | `admin-shell-nav.tsx` | [ ] |
| 2 | SidebarFooter: hide text, fix icon size, add a11y | `admin-shell-nav.tsx` | [ ] |
| 3 | SidebarGroupLabel: pointer-events fix | `ui/sidebar.tsx` | [ ] |
| 4 | Cookie hydration: prevent flash on load | `admin/layout.tsx` | [ ] |
| 5 | Optional: add SidebarRail | `admin-shell-nav.tsx` | [ ] |
| 6 | TypeScript compile check | — | [ ] |

---

## Phase 1: SidebarHeader Fix

**File:** `src/components/admin-shell-nav.tsx` lines 198-211

### Before
```tsx
<SidebarHeader className="px-4 py-3 border-b border-[#1e293b]">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shrink-0">
      <ShieldAlert size={16} className="text-white" />
    </div>
    <div>
      <p className="text-sm font-semibold text-[#f8fafc]">CCTH Admin</p>
      <p className="text-xs text-[#94a3b8]">
        {isSuperAdmin ? "Super Admin" : "Staff Admin"}
      </p>
    </div>
  </div>
  <SidebarTrigger className="ml-auto text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b]" />
</SidebarHeader>
```

### After
```tsx
<SidebarHeader className="px-4 py-3 border-b border-[#1e293b] group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center shrink-0" aria-label="CCTH Admin">
      <ShieldAlert size={16} className="text-white" />
    </div>
    <div className="group-data-[collapsible=icon]:hidden">
      <p className="text-sm font-semibold text-[#f8fafc]">CCTH Admin</p>
      <p className="text-xs text-[#94a3b8]">
        {isSuperAdmin ? "Super Admin" : "Staff Admin"}
      </p>
    </div>
  </div>
</SidebarHeader>
```

### Changes
1. Add `group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2` to `SidebarHeader` — tightens padding when collapsed
2. Add `group-data-[collapsible=icon]:hidden` to text wrapper div — hides "CCTH Admin" + role label
3. Add `aria-label="CCTH Admin"` to icon container div — accessibility for icon-only state
4. **Remove** the `<SidebarTrigger>` entirely — duplicate of the one in `layout.tsx` header (anti-pattern per official docs)

### Import cleanup
Remove `SidebarTrigger` from the import in `admin-shell-nav.tsx` (line 40) since it's no longer used there.

---

## Phase 2: SidebarFooter Fix

**File:** `src/components/admin-shell-nav.tsx` lines 249-259

### Before
```tsx
<SidebarFooter className="px-4 py-3 border-t border-[#1e293b]">
  <form action="/api/admin/auth/logout" method="post">
    <button
      type="submit"
      className="flex items-center gap-2 text-sm text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b] rounded-md px-2 py-1.5 w-full transition-colors"
    >
      <LogOut size={14} />
      <span>Đăng xuất</span>
    </button>
  </form>
</SidebarFooter>
```

### After
```tsx
<SidebarFooter className="px-4 py-3 border-t border-[#1e293b] group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2">
  <form action="/api/admin/auth/logout" method="post">
    <button
      type="submit"
      className="flex items-center gap-2 text-sm text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b] rounded-md px-2 py-1.5 w-full transition-colors group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center"
      title="Đăng xuất"
      aria-label="Đăng xuất"
    >
      <LogOut size={16} className="shrink-0" />
      <span className="group-data-[collapsible=icon]:hidden">Đăng xuất</span>
    </button>
  </form>
</SidebarFooter>
```

### Changes
1. Add `group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-2` to `SidebarFooter` — tighter padding
2. Add `group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center` to button — center icon when collapsed
3. Add `title="Đăng xuất"` and `aria-label="Đăng xuất"` — tooltip + accessibility
4. Change `LogOut size={14}` to `size={16}` + add `className="shrink-0"` — consistent with menu icons
5. Wrap text in `<span className="group-data-[collapsible=icon]:hidden">` — hide text in icon mode

---

## Phase 3: SidebarGroupLabel Pointer-Events Fix

**File:** `src/components/ui/sidebar.tsx` line 453

### Before
```tsx
"group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
```

### After
```tsx
"group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none",
```

### Rationale
Known shadcn/ui bug (GitHub #8037). Labels use `-mt-8` + `opacity-0` to hide visually but remain in DOM and capture mouse events, blocking icon clicks beneath them.

---

## Phase 4: Server-Side Cookie Hydration

**File:** `src/app/(main)/admin/layout.tsx`

### Before
```tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
// ... other imports

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();
  if (!session?.user) {
    redirect("/admin/login");
  }
  // ...
  return (
    <SidebarProvider>
      {/* ... */}
    </SidebarProvider>
  );
}
```

### After
```tsx
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
// ... other imports

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();
  if (!session?.user) {
    redirect("/admin/login");
  }

  const cookieStore = await cookies();
  const sidebarOpen = cookieStore.get("sidebar_state")?.value !== "false";

  // ...
  return (
    <SidebarProvider defaultOpen={sidebarOpen}>
      {/* ... */}
    </SidebarProvider>
  );
}
```

### Changes
1. Import `cookies` from `next/headers`
2. Read `sidebar_state` cookie server-side
3. Default to `true` (open) when cookie absent — `!== "false"` logic
4. Pass `defaultOpen={sidebarOpen}` to `SidebarProvider`

### Why
Prevents brief state flash on page load. Without this, sidebar always renders expanded first, then collapses client-side after hydration.

---

## Phase 5: Optional — Add SidebarRail

**File:** `src/components/admin-shell-nav.tsx`

Add `SidebarRail` import and place before closing `</Sidebar>` tag:

```tsx
import {
  // ... existing imports ...
  SidebarRail,
} from "@/components/ui/sidebar";

// Inside the component, just before </Sidebar>:
<SidebarRail />
```

This provides a subtle edge-rail toggle for desktop users (thin line on sidebar edge, visible on hover). Already exported from `ui/sidebar.tsx`.

---

## Phase 6: Compile Verification

After all changes, run:
```bash
npx tsc --noEmit
```

Confirm zero errors. If any, fix before committing.

---

## Implementation Steps (Exact Order)

1. Open `src/components/admin-shell-nav.tsx`
   - Replace SidebarHeader block (Phase 1 after)
   - Replace SidebarFooter block (Phase 2 after)
   - Remove `SidebarTrigger` from import statement
   - Add `SidebarRail` to import (Phase 5)
   - Add `<SidebarRail />` before `</Sidebar>`
2. Open `src/components/ui/sidebar.tsx`
   - Line 453: append `group-data-[collapsible=icon]:pointer-events-none` (Phase 3)
3. Open `src/app/(main)/admin/layout.tsx`
   - Add `cookies` import
   - Add cookie read + `defaultOpen` prop (Phase 4)
4. Run `npx tsc --noEmit` to verify
5. Visual test: toggle sidebar collapse in browser, confirm:
   - Header shows only icon when collapsed
   - Footer shows only icon when collapsed
   - Group labels don't block clicks
   - Page reload preserves sidebar state (no flash)
   - SidebarRail visible on hover at sidebar edge

## Success Criteria

- [ ] SidebarHeader: only teal icon visible in collapsed mode, no text overflow
- [ ] No duplicate SidebarTrigger — only one in layout.tsx header
- [ ] SidebarFooter: only LogOut icon visible in collapsed mode, no text overflow
- [ ] SidebarGroupLabel: invisible labels don't block mouse clicks on icons
- [ ] Cookie hydration: sidebar state persists across page reloads without flash
- [ ] SidebarRail: subtle toggle on sidebar edge works
- [ ] `aria-label` present on icon-only elements
- [ ] TypeScript compiles with zero errors
- [ ] No visual regressions in expanded mode

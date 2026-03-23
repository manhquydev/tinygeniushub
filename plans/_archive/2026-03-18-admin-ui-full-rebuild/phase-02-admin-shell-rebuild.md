# Phase 2: Admin Shell Rebuild

## Context Links
- [Research — Sidebar pattern](../reports/researcher-2026-03-18-admin-ui-rebuild.md) — SidebarProvider, AppSidebar, dark sidebar CSS vars
- Current layout: `src/app/(main)/admin/layout.tsx` (60 lines)
- Current nav: `src/components/admin-shell-nav.tsx` (278 lines)
- Nav data: `src/components/admin/admin-module-catalog.ts` (NAV_GROUPS definition)

## Overview
- **Priority:** P0 (shell wraps all admin pages)
- **Status:** pending
- **Effort:** 5h
- **Description:** Replace custom admin shell (sidebar + topbar + layout wrapper) with shadcn Sidebar component. Dark sidebar (#0f1117) + light content area (#f8fafc). Mobile: shadcn Sheet-based sidebar.

## Key Insights
- Current sidebar uses NAV_GROUPS with role-based filtering — preserve same data structure
- shadcn Sidebar uses SidebarProvider > AppSidebar pattern with SidebarHeader/Content/Footer
- Current layout has 3 parts: mobile nav (horizontal scroll), desktop sidebar (fixed 270px), topbar + main content
- Keep framer-motion for sidebar collapse animation (icon-only mode)
- Sidebar must support collapsible submenu (Blog has 6 children)

## Requirements
### Functional
- Dark sidebar with brand logo, nav groups, logout button
- Collapsible sidebar (full → icon-only mode) with framer-motion transition
- Mobile: shadcn Sheet overlay sidebar (replaces horizontal scroll nav)
- Active route highlighting with pathname matching
- Role-based nav filtering (Super Admin vs Staff Admin)
- Blog submenu with expand/collapse

### Non-functional
- Sidebar width: 270px expanded, 60px collapsed
- Smooth collapse animation (200ms)
- Accessible: aria-label, keyboard nav

## Architecture
```
layout.tsx
  └── SidebarProvider
        ├── AppSidebar (dark bg)
        │   ├── SidebarHeader (brand)
        │   ├── SidebarContent (nav groups)
        │   │   └── SidebarGroup × N
        │   │       ├── SidebarGroupLabel
        │   │       └── SidebarMenu
        │   │           └── SidebarMenuItem
        │   │               ├── SidebarMenuButton (leaf)
        │   │               └── Collapsible (parent w/ children)
        │   └── SidebarFooter (logout + user info)
        └── SidebarInset (light content area)
            ├── Topbar (breadcrumb + user chip)
            └── <main>{children}</main>
```

## Related Code Files
### Modify
- `src/app/(main)/admin/layout.tsx` — replace with SidebarProvider + AppSidebar pattern
- `src/components/admin-shell-nav.tsx` — full rewrite using shadcn Sidebar primitives

### Create
- None (rebuild in-place)

### Delete
- Remove old admin-shell CSS classes from globals.css (after shell rebuild verified)

### shadcn Components to Install
```bash
npx shadcn@canary add sidebar sheet collapsible breadcrumb avatar dropdown-menu
```

## Implementation Steps

1. **Install shadcn sidebar + deps**
   ```bash
   npx shadcn@canary add sidebar sheet collapsible breadcrumb avatar dropdown-menu
   ```

2. **Rewrite admin-shell-nav.tsx**
   - Keep NAV_GROUPS data structure (same items, icons, hrefs, role filtering)
   - Replace custom CSS classes with shadcn Sidebar primitives
   - Use `SidebarMenu` / `SidebarMenuItem` / `SidebarMenuButton` for nav items
   - Use `Collapsible` + `SidebarMenuSub` for Blog children
   - Apply dark theme via inline style or CSS vars on sidebar root: `style={{ backgroundColor: 'var(--admin-sidebar-bg)' }}`
   - Keep `isPathActive()` and `hasActiveChild()` utility functions
   - Keep `isVisible()` role filter
   - Add `SidebarTrigger` button for collapse toggle
   - Logout in SidebarFooter

3. **Rewrite layout.tsx**
   - Wrap in `SidebarProvider`
   - Replace `<aside>` with `<AppSidebar>` (the rewritten admin-shell-nav)
   - Replace topbar div with `SidebarInset` header containing breadcrumb + user info
   - Remove hardcoded `md:ml-[270px]` — SidebarProvider handles layout
   - Keep `getAdminSession()` server-side auth check + redirect

4. **Style dark sidebar**
   - Override shadcn sidebar CSS vars in globals.css:
     ```css
     [data-slot="sidebar"] {
       --sidebar-background: var(--admin-sidebar-bg);
       --sidebar-foreground: var(--admin-sidebar-fg);
       --sidebar-accent: var(--admin-sidebar-accent);
       --sidebar-accent-foreground: var(--admin-sidebar-accent-fg);
     }
     ```

5. **Mobile sidebar**
   - shadcn Sidebar auto-renders as Sheet on mobile (built-in behavior)
   - Remove old `admin-mobile-nav` horizontal scroll component
   - Add hamburger `SidebarTrigger` in mobile topbar

6. **Verify and delete old CSS**
   - Confirm all admin pages render with new shell
   - Remove old shell CSS classes: `admin-shell-*`, `admin-nav-*`, `admin-mobile-nav-*`, `admin-logout-*`

7. **Build check**
   ```bash
   pnpm type-check && pnpm build
   ```

## Todo List
- [ ] Install shadcn sidebar, sheet, collapsible, breadcrumb, avatar, dropdown-menu
- [ ] Rewrite admin-shell-nav.tsx with shadcn Sidebar primitives
- [ ] Rewrite layout.tsx with SidebarProvider pattern
- [ ] Apply dark sidebar CSS vars
- [ ] Verify mobile Sheet sidebar works
- [ ] Verify Blog submenu collapsible works
- [ ] Verify role-based filtering (Super Admin vs Staff)
- [ ] Remove old admin-shell CSS from globals.css
- [ ] Build passes, all admin pages accessible

## Success Criteria
- Sidebar renders dark (#0f1117 bg) with light text
- Content area renders light (#f8fafc bg)
- Sidebar collapse toggle works (full ↔ icon-only)
- Mobile shows hamburger trigger → Sheet overlay sidebar
- Blog submenu expands/collapses
- All 22 admin page routes load without error
- Role-based items hidden for Staff Admin

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| SidebarProvider layout conflicts | Medium | High | Test all pages after shell swap |
| Mobile Sheet not triggering | Low | Medium | Verify breakpoint matches existing md: |
| Route highlighting regression | Low | Medium | Reuse existing isPathActive logic |

## Next Steps
- Phase 3: Build shared admin component library (stat cards, tables, badges)

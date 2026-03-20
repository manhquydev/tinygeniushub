# Scout Report: Admin Layout Files & CSS Classes

**Date:** 2026-03-18  
**Task:** Find all admin layout files, sidebar/nav components, and CSS/Tailwind positioning classes  
**Status:** Complete

---

## Core Admin Layout Files

### Main Layout Files
1. **D:\project\cungcontuhoc\src\app\(main)\admin\layout.tsx**
   - Root admin layout wrapper
   - Uses `SidebarProvider` for state management
   - Contains sticky header with `z-10` positioning
   - Main content area with `flex-1 p-3 md:p-6`

2. **D:\project\cungcontuhoc\src\components\admin-shell-nav.tsx**
   - Sidebar navigation component
   - Uses `Sidebar` with `collapsible="icon"` mode
   - Contains header, content, footer sections
   - Supports role-based visibility (SUPER_ADMIN vs staff admin)

### Layout Composition Components
3. **D:\project\cungcontuhoc\src\components\ui\sidebar.tsx**
   - Core sidebar provider & utilities
   - Exports: `SidebarProvider`, `SidebarInset`, `SidebarTrigger`, `SidebarContent`, etc.
   - Manages sidebar state via cookies (`SIDEBAR_COOKIE_NAME = "sidebar_state"`)
   - Responsive widths: `SIDEBAR_WIDTH = 16rem`, `SIDEBAR_WIDTH_ICON = 3rem`

4. **D:\project\cungcontuhoc\src\components\admin\ui\admin-page-header.tsx**
   - Page-level header component
   - Uses `relative` positioning with `absolute inset-x-0 top-0` gradient accent
   - Styled with border, rounded corners, and card styling

---

## Layout Positioning & CSS Classes

### Key Layout Classes Found

#### Header (Sticky)
```
sticky top-0 z-10 md:h-14 md:gap-3 md:px-4
flex h-12 items-center gap-2 px-3 border-b
border-[var(--admin-card-border)] bg-[var(--admin-header-bg)]
```
**File:** `src/app/(main)/admin/layout.tsx:35`

#### Main Content Wrapper
```
flex-1 p-3 md:p-6
```
**File:** `src/app/(main)/admin/layout.tsx:58`

#### SidebarInset (Content Area)
```
style={{ backgroundColor: "var(--admin-content-bg)" }}
```
**File:** `src/app/(main)/admin/layout.tsx:34`

#### Page Header Accent
```
absolute inset-x-0 top-0 h-0.5 
bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-500
```
**File:** `src/components/admin/ui/admin-page-header.tsx:30`

#### Overflow Handling
```
overflow-hidden (on card containers)
overflow-y-auto (on scrollable sidebars)
overflow-x-auto (on tables)
```
**Files:** Multiple (admin components, tables)

#### Relative Positioning (Search Icons)
```
relative
absolute left-2.5 top-1/2 -translate-y-1/2
```
**Files:** `src/components/admin/users-management/admin-users-list-pane.tsx:55-56`

#### Z-Index Stack
- `z-10`: Header (sticky top)
- Default sidebar z-index (from Radix UI Sidebar component)

---

## Sidebar Component Structure

### AdminShellNav Composition
```tsx
<Sidebar collapsible="icon">
  <SidebarHeader/>        // Logo & branding
  <SidebarContent/>       // Navigation groups
  <SidebarFooter/>        // Logout button
  <SidebarRail/>          // Mobile trigger rail
</Sidebar>
```

### Sidebar Styling Variables
```css
--sidebar: var(--admin-sidebar-bg)
--sidebar-foreground: var(--admin-sidebar-fg)
--sidebar-accent: var(--admin-sidebar-accent)
--sidebar-accent-foreground: var(--admin-sidebar-accent-fg)
--sidebar-border: #1e293b
```
**File:** `src/components/admin-shell-nav.tsx:190-195`

---

## Navigation Structure

### Admin Nav Groups
1. **Tổng quan** (Overview)
   - Dashboard (`/admin/overview`)

2. **Dữ liệu** (Data)
   - Analytics (`/admin/analytics`)
   - Users (`/admin/users`)
   - Courses (`/admin/courses`)
   - Organizations (`/admin/organizations` - super admin only)

3. **Vận hành** (Operations)
   - Operations (`/admin/operations`)
   - Gift Codes (`/admin/gift-codes`)
   - Content (`/admin/content`)
   - Site Settings (`/admin/site-settings`)
   - Blog (expandable with sub-items)

4. **Hệ thống** (System - super admin only)
   - Staff Management (`/admin/staff`)
   - Security (`/admin/security`)
   - Logs (`/admin/log`)

---

## Common Admin Components (UI Building Blocks)

**Location:** `src/components/admin/ui/`
- `admin-page-header.tsx` - Page title + description + actions
- `admin-section-card.tsx` - Content cards
- `admin-stat-card.tsx` - Statistics display
- `admin-data-table.tsx` - Data tables
- `admin-empty-state.tsx` - Empty state UI
- `admin-loading-skeleton.tsx` - Loading placeholders
- `admin-status-badge.tsx` - Status indicators

**Location:** `src/components/admin/`
- `video-tus-uploader.tsx` - File upload component
- `admin-module-health-grid.tsx` - Module health monitoring

---

## Admin Pages/Routes

**Location:** `src/app/(main)/admin/`

### Top-level Pages
- `page.tsx` (redirect to overview)
- `overview/page.tsx` - Dashboard
- `analytics/page.tsx` - Analytics dashboard
- `users/page.tsx` - User management
- `courses/page.tsx` - Course list
- `organizations/page.tsx` - Organization management
- `gift-codes/page.tsx` - Gift code management
- `content/page.tsx` - Content management
- `site-settings/page.tsx` - Site configuration
- `staff/page.tsx` - Staff management
- `security/page.tsx` - Security settings
- `log/page.tsx` - Activity logs

### Blog Section
- `blog/page.tsx` - Blog overview
- `blog/posts/page.tsx` - Post management
- `blog/posts/[id]/edit/page.tsx` - Post editor
- `blog/posts/new/page.tsx` - New post
- `blog/categories/page.tsx` - Categories
- `blog/authors/page.tsx` - Authors
- `blog/newsletter/page.tsx` - Newsletter settings
- `blog/analytics/page.tsx` - Blog analytics
- `blog/comments/page.tsx` - Comments moderation

### Courses Detail
- `courses/[id]/page.tsx` - Course detail view
- `courses/[id]/admin-course-detail-client.tsx` - Course editor (client)

---

## CSS Utility Patterns

### Responsive Classes (Detected)
```
md:h-14        // Medium breakpoint height
md:gap-3       // Medium spacing
md:px-4        // Medium padding
md:p-6         // Medium padding all
group-data-[collapsible=icon]:*  // Icon mode variants
```

### Color Variables (Admin Theme)
```css
--admin-header-bg
--admin-card-bg
--admin-card-border
--admin-sidebar-bg
--admin-sidebar-fg
--admin-sidebar-accent
--admin-sidebar-accent-fg
--admin-text-primary
--admin-text-secondary
--admin-text-muted
--admin-content-bg
```

### Common Tailwind Classes
- Borders: `border-b`, `border-r-0`, `rounded-xl`, `rounded-3xl`
- Spacing: `px-3`, `py-3`, `px-2`, `gap-2`, `gap-3`
- Colors: `bg-teal-600`, `text-teal-400`, `text-[#94a3b8]`
- Layout: `flex`, `items-center`, `justify-center`, `shrink-0`
- Text: `text-sm`, `text-xs`, `font-semibold`, `font-medium`

---

## Key Integration Points

### Session & Auth
- Uses `getAdminSession()` from `@/modules/admin/admin-auth-service`
- Role-based rendering (SUPER_ADMIN vs staff)
- Logout endpoint: `/api/admin/auth/logout`

### State Management
- Sidebar state via cookie (`SIDEBAR_COOKIE_NAME`)
- Client-side navigation with `usePathname()`
- Active route detection via href matching

### Responsive Design
- Mobile sheet view for sidebar (via useIsMobile hook)
- Tablet/desktop expanded sidebar
- Icon-only collapsed mode

---

## Summary

**Total Files Found:** 27  
**Core Layout Files:** 3  
**UI Component Files:** 15+  
**Page/Route Files:** 24  

**Key CSS Positioning:**
- Sticky header with `sticky top-0 z-10`
- Flex-based main layout
- Overflow handling on scrollable areas
- Absolute positioning for accent elements
- Responsive padding/spacing

**Sidebar State:**
- Cookie-based persistence
- Collapsible icon mode
- Role-based menu filtering
- Gradient accent borders on cards

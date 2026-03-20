# Admin Interface Structure Scout Report

Date: 2026-03-18

## ADMIN PAGES & ROUTES

### Core Admin Pages
- /admin/overview
- /admin/analytics
- /admin/users
- /admin/courses
- /admin/content
- /admin/operations
- /admin/gift-codes
- /admin/blog (with sub-routes)
- /admin/organizations (SUPER_ADMIN)
- /admin/staff (SUPER_ADMIN)
- /admin/security (SUPER_ADMIN)
- /admin/log (SUPER_ADMIN)
- /admin/site-settings

## ADMIN COMPONENTS INVENTORY

### UI Components (src/components/admin/ui/)
- admin-section-card.tsx
- admin-stat-card.tsx
- admin-page-header.tsx
- admin-data-table.tsx
- admin-empty-state.tsx
- admin-loading-skeleton.tsx
- admin-status-badge.tsx

### Core Components
- admin-shell-nav.tsx (Main sidebar)
- admin-stats-header.tsx (Top stats)
- admin-module-health-grid.tsx (Module status grid)
- admin-module-catalog.ts (Module definitions)
- video-tus-uploader.tsx

### Feature Sections
- admin/operations/ (3 files)
- admin/users-management/ (6 files)
- admin/content/ (15 files)
- admin/site-settings/ (1 file)

## NAVIGATION STRUCTURE

Sidebar groups:
1. Tổng quan (Overview) - 1 item
2. Dữ liệu (Data) - 4 items
3. Vận hành (Operations) - 5 items + Blog collapsible
4. Hệ thống (System) - 3 items [SUPER_ADMIN]

## MODULE HEALTH STATUS

Complete (7): Overview, Analytics, Users, Content, Blog, Staff, Audit Log
Partial (5): Courses, Operations, Gift Codes, Organizations, Security
Gap (2): Impersonation, Skills Mapping

## API ROUTES

Total: 60+ endpoints organized by domain
- Authentication (5 routes)
- Overview & Analytics (3 routes)
- Content Management (6 routes)
- Courses (5 routes)
- Users (6 routes)
- Operations (6 routes)
- Blog (6 routes)
- Skills & Misc (15+ routes)

## CHARTS & DATA VISUALIZATION

Existing:
- src/components/weekly-progress-chart.tsx
- src/components/analytics/learning-trajectory-chart.tsx
- src/components/ui/chart.tsx
- Recharts v2.15.4 library available

Current visualizations in admin:
- Module health grid (card-based)
- Status badges (subscriptions, webhooks)
- Stat cards with trends
- Streak distribution (custom CSS bars)
- Data tables

## FILE PATHS

### Core Admin Layout
D:/project/cungcontuhoc/src/app/(main)/admin/layout.tsx
D:/project/cungcontuhoc/src/app/(main)/admin/page.tsx

### Admin Pages
D:/project/cungcontuhoc/src/app/(main)/admin/overview/page.tsx
D:/project/cungcontuhoc/src/app/(main)/admin/analytics/page.tsx
D:/project/cungcontuhoc/src/app/(main)/admin/users/page.tsx
D:/project/cungcontuhoc/src/app/(main)/admin/courses/page.tsx
D:/project/cungcontuhoc/src/app/(main)/admin/content/page.tsx
D:/project/cungcontuhoc/src/app/(main)/admin/operations/page.tsx
D:/project/cungcontuhoc/src/app/(main)/admin/gift-codes/page.tsx
D:/project/cungcontuhoc/src/app/(main)/admin/blog/page.tsx
D:/project/cungcontuhoc/src/app/(main)/admin/organizations/page.tsx
D:/project/cungcontuhoc/src/app/(main)/admin/staff/page.tsx
D:/project/cungcontuhoc/src/app/(main)/admin/security/page.tsx
D:/project/cungcontuhoc/src/app/(main)/admin/log/page.tsx
D:/project/cungcontuhoc/src/app/(main)/admin/site-settings/page.tsx

### Navigation & Module Catalog
D:/project/cungcontuhoc/src/components/admin-shell-nav.tsx
D:/project/cungcontuhoc/src/components/admin-stats-header.tsx
D:/project/cungcontuhoc/src/components/admin/admin-module-catalog.ts

### UI Components
D:/project/cungcontuhoc/src/components/admin/ui/admin-section-card.tsx
D:/project/cungcontuhoc/src/components/admin/ui/admin-stat-card.tsx
D:/project/cungcontuhoc/src/components/admin/ui/admin-page-header.tsx
D:/project/cungcontuhoc/src/components/admin/ui/admin-data-table.tsx
D:/project/cungcontuhoc/src/components/admin/ui/admin-empty-state.tsx
D:/project/cungcontuhoc/src/components/admin/ui/admin-loading-skeleton.tsx
D:/project/cungcontuhoc/src/components/admin/ui/admin-status-badge.tsx

### Chart Components
D:/project/cungcontuhoc/src/components/weekly-progress-chart.tsx
D:/project/cungcontuhoc/src/components/analytics/learning-trajectory-chart.tsx
D:/project/cungcontuhoc/src/components/ui/chart.tsx

## KEY FINDINGS

1. Module Completeness: 7 complete, 5 partial, 2 gap (API exists but no UI)
2. Role-Based Access: Staff sees 9 modules, Super Admin sees all 14
3. Navigation: Hierarchical sidebar with collapsible blog section
4. Visualization: Recharts available but underutilized (mostly stat cards)
5. Architecture: Force-dynamic rendering for auth, sidebar state via cookies, dark mode via CSS vars

## UNRESOLVED QUESTIONS

- Are Impersonation and Skills Mapping intentionally gap modules or pending UI?
- What specific features make some modules "partial" instead of "complete"?
- Are there planned enhancements for advanced data visualization?
- Why is Recharts underutilized in admin dashboards?


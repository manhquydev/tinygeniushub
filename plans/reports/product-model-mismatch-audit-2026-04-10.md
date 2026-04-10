# Product Model Mismatch Audit (2026-04-10)

Goal: detect UI/flow still showing package/subscription model after pivot to course-purchase model.

## P0 (fix next)

1. `src/app/(main)/admin/overview/page.tsx`
   - Shows "Trạng thái gói đăng ký", "Chưa có dữ liệu gói đăng ký".
   - Uses `overview.subscriptionsByStatus` as first-class KPI.

2. `src/components/admin-stats-header.tsx`
   - KPI "Gói đang hoạt động".
   - Active count calculated from subscription statuses (`TRIALING`, `ACTIVE_*`, `GRACE`, ...).

3. `src/components/admin/admin-module-catalog.ts`
   - Users module description includes `subscription`.

4. `src/components/admin/users-management/*`
   - Detail/list/actions still centered around subscription lifecycle.
   - Key files: `admin-user-detail-pane.tsx`, `admin-users-list-pane.tsx`, `use-admin-user-detail-controller.ts`.

5. `src/modules/admin/admin-overview-service.ts` + `src/modules/admin/admin-revenue-service.ts`
   - Core metrics still from `subscription` table and plan enums.
   - Needs migration to course-order KPI model.

## P1 (after P0)

1. `src/app/(main)/admin/analytics/page.tsx`
   - Snapshot type still includes `subscriptionsByStatus`.
   - Export block and KPI naming still plan/subscription oriented in parts.

2. `src/components/admin/analytics/revenue-dashboard.tsx`
   - Label text patched to neutral, but data source still plan-grouped legacy.

3. `src/app/(kid-app)/kid/garden/[zone]/page.tsx`
   - Passes `subscriptionStatus` to garden lesson selector.

4. `src/components/mascot/narrative-map.ts`
   - Narrative branch tied to `subscriptionStatus` and "trial" semantics.

5. Legacy API surface still package model:
   - `src/app/api/webhooks/package-subscription/route.ts`
   - `src/app/api/abeka/packages/*`

## P2 (copy/legal/content cleanup)

1. `src/app/(main)/terms/page.tsx`
   - Copy still "gói dịch vụ trả phí".

2. `src/app/(main)/refund-policy/page.tsx`
   - Copy still "mua gói/khóa học".

3. `src/app/(main)/gift-code/page.tsx`
   - Metadata still "khóa học hoặc gói dịch vụ".

4. Homepage marketing copy still mentions Family+/package in some blocks.
   - `src/components/homepage/section-testimonials.tsx`
   - `src/components/homepage/unified-scroll-journey.tsx`

## Already adjusted in this batch

1. `/admin/analytics` now degrades gracefully when one analytics source fails (no full 500).
2. Parent single-profile UX tightened:
   - `src/components/children-manager.tsx`
   - `src/app/(main)/parent/children/page.tsx`
   - `src/components/parent/dashboard-shortcuts-section.tsx`
   - `src/components/parent/dashboard-children-section.tsx`
   - `src/app/(main)/parent/dashboard/page.tsx`

## Suggested rollout order

1. P0 admin KPI/model rewrite (must align reporting with course orders).
2. P1 dependency cleanup (garden + mascot + analytics schema).
3. P2 public/legal copy sweep.

## Unresolved questions

1. Keep any legacy subscription KPI hidden behind internal debug view, or remove completely from admin UI now?
2. For garden access, switch immediately to course-entitlement checks only, or keep hybrid fallback during migration window?

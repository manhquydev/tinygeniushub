# Admin Module Decomposition

## M1 - Access + shell
- Scope: admin auth flow, session guard, top-level navigation, layout shell.
- Files:
  - `src/app/(admin-login)/admin/login/page.tsx`
  - `src/components/admin-login-form.tsx`
  - `src/app/(main)/admin/layout.tsx`
  - `src/components/admin-shell-nav.tsx`

## M2 - Overview + analytics
- Scope: KPI cards, retention, learning analytics, summary views.
- Files:
  - `src/app/(main)/admin/overview/page.tsx`
  - `src/app/(main)/admin/analytics/page.tsx`
  - `src/modules/admin/admin-analytics-service.ts`

## M3 - Users + subscription ops
- Scope: user search/filter, detail pane, notes, actions, subscription mutation.
- Files:
  - `src/components/admin-users-management.tsx` (split target)
  - `src/modules/admin/admin-users-management-service.ts`
  - `src/modules/admin/admin-user-service.ts`
  - `src/app/api/admin/users/**`

## M4 - Learning content ops
- Scope: tracks/levels/units/lessons/activities, trial toggles, media upload.
- Files:
  - `src/components/admin-content-panel.tsx` (split target)
  - `src/components/admin/video-tus-uploader.tsx`
  - `src/modules/admin/content-service.ts`
  - `src/app/api/admin/content/**`
  - `src/app/api/admin/videos/**`

## M5 - Commercial ops
- Scope: payments, webhooks, coupons, gift-codes, export, reconcile.
- Files:
  - `src/components/admin-operations-panel.tsx` (split target)
  - `src/components/admin-coupon-panel.tsx`
  - `src/components/admin-gift-code-panel.tsx`
  - `src/modules/admin/admin-billing-service.ts`
  - `src/app/api/admin/payments/**`
  - `src/app/api/admin/webhooks/route.ts`
  - `src/app/api/admin/export/**`

## M6 - Security + governance
- Scope: rate-limits config, edge export, feature flags, staff, action logs.
- Files:
  - `src/app/(main)/admin/security/page.tsx`
  - `src/components/admin-security-panel.tsx`
  - `src/components/admin-feature-flags-panel.tsx`
  - `src/components/admin-staff-panel.tsx`
  - `src/components/admin-action-log-panel.tsx`
  - `src/app/api/admin/security/**`
  - `src/app/api/admin/feature-flags/**`
  - `src/app/api/admin/staff/**`
  - `src/app/api/admin/log/route.ts`

## M7 - Blog CMS
- Scope: posts, categories, authors, comments moderation, newsletter, analytics.
- Files:
  - `src/app/(main)/admin/blog/**`
  - `src/components/admin-blog-*.tsx`
  - `src/modules/admin/admin-blog-service.ts`
  - `src/app/api/admin/blog/**`

## M8 - B2B orgs
- Scope: organizations and members management.
- Files:
  - `src/app/(main)/admin/organizations/page.tsx`
  - `src/components/admin-organizations-panel.tsx`
  - `src/app/api/admin/organizations/**`

## This session priority
1. M1 shell redesign.
2. M2/M5/M6 page layout harmonization.
3. Patch styling contract for M5 + M8 legacy components.
4. Start structural split prep for M3/M4/M5 monoliths.

## Unresolved questions
- None.

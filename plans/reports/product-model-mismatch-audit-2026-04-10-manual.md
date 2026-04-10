# Product Model Mismatch Audit - 2026-04-10 (Manual)

## Scope
- Parent-facing pages first, then admin/marketing copy.
- Goal: remove subscription/package-oriented UX where it no longer reflects course-purchase model.

## P0 (fix now)
- `src/app/(main)/parent/dashboard/page.tsx`
  - still showed `Trialing` and `Trạng thái gói` metric.
  - still rendered mascot ecosystem block on dashboard.
- `src/app/(main)/parent/children/page.tsx`
  - child profile limit derived from `subscription.childProfileLimit`.
- `src/modules/progress/children-service.ts`
  - child create flow required `subscription` and enforced limit by subscription.
- `src/components/children-manager.tsx`
  - copy: “gói hiện tại”, “nâng cấp để tạo thêm”.
- `src/app/(main)/parent/billing/page.tsx`
  - account section still showed plan/subscription status, auto-renew, profile limits.
- `src/components/app-nav-client.tsx`
  - labels: `Gói dịch vụ`, `Xem gói học`.

## P1 (next batch)
- `src/app/(main)/admin/overview/page.tsx`
  - section title/content still “Trạng thái gói đăng ký”.
- `src/components/admin-stats-header.tsx`
  - aggregates/subtitles still framed as active subscriptions.
- `src/components/admin/analytics/revenue-dashboard.tsx`
  - wording `Doanh thu theo gói` and package framing.
- `src/components/lesson-completion-card.tsx`
  - copy mentions benefit based on package support.

## P2 (copy/legal cleanup)
- `src/app/(main)/terms/page.tsx`
  - mentions paid package/service plan language.
- `src/app/(main)/refund-policy/page.tsx`
  - text mixes package and course model.
- `src/app/(main)/gift-code/page.tsx`
  - metadata copy still “khóa học hoặc gói dịch vụ”.
- `src/components/homepage/unified-scroll-journey.tsx`
  - copy references “gói thử”.
- `src/components/homepage/section-testimonials.tsx`
  - testimonial context references `Family+` package narrative.

## Notes
- Existing backend still contains subscription tables and package/webhook modules for legacy/compatibility.
- This audit focuses on user-visible mismatch first, not immediate schema removal.

## Unresolved questions
- Keep caregiver limit fixed at 2 globally, or move to explicit admin/system setting?
- For admin analytics, keep legacy subscription KPIs in hidden/internal tabs during migration, or remove entirely next batch?

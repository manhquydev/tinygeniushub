# Phase 02: Professional Layout

## Context Links
- Phase 01: `plans/260318-admin-ui-overhaul/phase-01-theme-contrast-fix.md`
- Admin layout: `src/app/(main)/admin/layout.tsx`
- Page header: `src/components/admin/admin-page-header.tsx`
- Section card: `src/components/admin/ui/admin-section-card.tsx`
- Stats header: `src/components/admin-stats-header.tsx`
- Reference: Linear app, Vercel Dashboard, GitHub admin patterns

## Overview
- **Priority**: P1
- **Status**: pending
- **Description**: Improve visual hierarchy, spacing, component arrangement. Reduce clutter; align with modern SaaS dashboard patterns.

## Key Insights
- Current layout uses `space-y-6` with flat section stacking -- no visual grouping
- `AdminPageHeader` has eyebrow + title + description pattern -- good but could be tighter
- Stats cards use `grid-cols-2 sm:grid-cols-4` -- correct responsive pattern
- Module health grid is a large card grid; consider making it collapsible on overview
- Header bar at 12/14px height is compact; shows role, date, email -- slightly cluttered on mobile

## Requirements
### Functional
- Clear visual hierarchy: page header > primary metrics > detail sections
- Consistent spacing rhythm (16/24/32px gaps)
- Collapsible sidebar already works; ensure icon-mode looks polished
- Mobile-responsive at 375px, 768px, 1024px, 1440px breakpoints

### Non-functional
- Pages load without layout shift (no client-side layout calc)
- Consistent component usage across all admin pages

## Related Code Files

### Files to Modify
- `src/components/admin/admin-page-header.tsx` -- tighten spacing, remove eyebrow clutter
- `src/components/admin/ui/admin-section-card.tsx` -- add collapsible variant, refine padding
- `src/components/admin/ui/admin-stat-card.tsx` -- compact variant for dense grids
- `src/components/admin-stats-header.tsx` -- refine stat bar spacing
- `src/app/(main)/admin/layout.tsx` -- refine main content padding
- `src/app/(main)/admin/overview/page.tsx` -- restructure section order
- `src/app/(main)/admin/analytics/page.tsx` -- reduce nesting depth
- `src/components/admin/ui/admin-data-table.tsx` -- header styling, row hover states
- `src/components/admin/ui/admin-empty-state.tsx` -- visual polish

### Files to Create
- None (update existing)

## Implementation Steps

1. **Refine AdminPageHeader**:
   - Remove eyebrow text (adds noise, not actionable info)
   - Tighten bottom margin from `mb-6` to `mb-4`
   - Add subtle bottom border for visual anchoring
   - Keep icon + title + description pattern

2. **Improve AdminSectionCard**:
   - Add `collapsible?: boolean` prop with `defaultOpen` state
   - Use shadcn `Collapsible` component internally
   - Refine padding: `p-4` on mobile, `p-5` on md+
   - Add hover border highlight on interactive cards

3. **Compact AdminStatCard variant**:
   - Add `size?: "default" | "compact"` prop
   - Compact: smaller text (`text-xl`), tighter padding
   - Used in dense overview grids

4. **Standardize spacing rhythm** across pages:
   - Page padding: `p-4 md:p-6` (already close, verify)
   - Section gap: `space-y-5` (reduce from 6 for tighter feel)
   - Card internal: `p-4 md:p-5`
   - Grid gaps: `gap-3 md:gap-4`

5. **Overview page restructure**:
   - Order: Stats header -> Revenue summary -> Module health (collapsible) -> Subscriptions -> Webhooks
   - Make module health grid collapsible by default (it's a diagnostic view, not daily)

6. **Analytics page cleanup**:
   - Reduce nested section cards (currently 2 levels deep in some places)
   - Flatten: top-level sections with direct stat cards inside
   - Streak distribution bar chart stays, but move to standalone section

7. **Header bar refinements**:
   - Hide email on screens < 1280px (only show on xl+)
   - Combine role badge + date into single status area on lg+

8. **Data table improvements**:
   - Add subtle row hover (`bg-[var(--admin-card-bg-elevated)]`)
   - Sticky table header for long lists
   - Compact row height option

## Todo List
- [x] Refine AdminPageHeader (remove eyebrow, tighten spacing, text-2xl)
- [x] Add collapsible variant to AdminSectionCard
- [x] Add compact size to AdminStatCard
- [x] Standardize spacing across shared components (gap-3 md:gap-4, p-4 md:p-5)
- [ ] Restructure overview page section order (out of scope for phase 02 shared components)
- [ ] Flatten analytics page nesting (out of scope for phase 02 shared components)
- [x] Polish header bar responsive breakpoints (email/date hidden until xl)
- [x] Improve data table hover/sticky behavior (sticky header, elevated hover bg)
- [ ] Visual test all admin routes at 4 breakpoints

## Success Criteria
- No more than 2 levels of visual nesting on any page
- Consistent 16/24/32px spacing rhythm
- Module health grid collapsible on overview
- Mobile (375px) renders without horizontal scroll
- Professional, clean look comparable to Linear/Vercel admin patterns

## Risk Assessment
- **Medium**: Changing spacing/layout affects all admin pages. Mitigate: phase 02 runs after phase 01 theme is stable.
- **Low**: Collapsible section card adds client interactivity to server-rendered page. Mitigate: use shadcn Collapsible which handles SSR gracefully.

## Security Considerations
- None (layout/UI-only changes)

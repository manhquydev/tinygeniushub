# Phase 4: Overview + Analytics Pages

## Context Links
- Overview page: `src/app/(main)/admin/overview/page.tsx` (185 lines)
- Analytics page: `src/app/(main)/admin/analytics/page.tsx` (197 lines)
- Stats header: `src/components/admin-stats-header.tsx` (80 lines)
- Health grid: `src/components/admin/admin-module-health-grid.tsx` (64 lines)
- Module catalog: `src/components/admin/admin-module-catalog.ts` (keep untouched)

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 5h
- **Description:** Rebuild Overview (KPI dashboard + module health) and Analytics (learning metrics + retention) pages using Phase 3 shared components + shadcn Chart.

## Key Insights
- Overview page has 5 sections: stats pills, module health grid, subscription status, webhook status, referrals
- Analytics page has 2 main sections: learning analytics (active kids, lessons, streak distribution) and retention metrics
- Both pages are server components — data fetching via `getAdminOverview()`, `getAdminLearningAnalytics()`, `getAdminRetentionAnalytics()`
- No controller hooks — these are pure server-rendered pages
- Streak distribution bar chart is a good candidate for shadcn Chart (recharts wrapper)

## Requirements
### Functional
- Overview: KPI stat cards row, module health grid (shadcn Card-based), subscription/webhook status tables, referral metrics
- Analytics: Active children cards, lesson summary cards, streak distribution chart, top lessons table, retention metrics grid
- All Vietnamese text preserved exactly
- Same data sources — no API changes

### Non-functional
- White cards on #f8fafc background
- Consistent spacing with Phase 3 AdminSectionCard

## Related Code Files
### Modify
- `src/app/(main)/admin/overview/page.tsx` — rebuild with shadcn components
- `src/app/(main)/admin/analytics/page.tsx` — rebuild with shadcn components
- `src/components/admin-stats-header.tsx` — replace with AdminStatCard row
- `src/components/admin/admin-module-health-grid.tsx` — replace with shadcn Card grid

### Create
- None (rebuild in-place)

### Delete
- Old CSS classes for `admin-module-grid`, `admin-module-card`, `admin-health-pill`, etc. (after verified)

### shadcn Components to Install
```bash
npx shadcn@canary add chart
```

## Implementation Steps

1. **Install shadcn Chart**
   ```bash
   npx shadcn@canary add chart
   ```

2. **Rebuild admin-stats-header.tsx**
   - Replace pill row with `AdminStatCard` components in a responsive grid
   - 5 KPI cards: Parents, Active Subs, Revenue 30d, Active Kids 7d, Churn 30d
   - Each card: icon, label, value, optional trend indicator
   - Grid: `grid-cols-2 md:grid-cols-3 lg:grid-cols-5`

3. **Rebuild admin-module-health-grid.tsx**
   - Replace custom CSS card grid with shadcn Card components
   - Each module: Card with icon, title, description, health Badge
   - Health badge colors: complete=emerald, partial=amber, gap=rose
   - Use `AdminStatusBadge` variant="health"
   - Linkable cards: wrap in `<Link>` if `module.href` exists
   - Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`

4. **Rebuild overview/page.tsx**
   - Use `AdminPageHeader` (updated from Phase 3)
   - KPI row: `AdminStatsHeader` (rebuilt step 2)
   - Module health: `AdminModuleHealthGrid` (rebuilt step 3)
   - Subscription status: `AdminSectionCard` + `AdminDataTable` or badge list
   - Webhook status: same pattern
   - Referrals: `AdminSectionCard` + `AdminStatCard` grid
   - Move badge class helpers (`getSubscriptionBadgeClass`, `getWebhookBadgeClass`) to `AdminStatusBadge`

5. **Rebuild analytics/page.tsx**
   - Use `AdminPageHeader`
   - Learning analytics section with `AdminSectionCard`:
     - Active children: 2-column grid of stat cards (7d, 30d)
     - Lesson summary: 2-column grid of stat cards
     - Streak distribution: shadcn Chart (BarChart) replacing custom bar divs
     - Top lessons: `AdminDataTable` with columns [Title, Completions]
   - Retention section with `AdminSectionCard`:
     - 4-column grid of `AdminStatCard`: new parents, churn, retention rate, days to first lesson
   - Keep all helper functions: `asPercent()`, `streakBarClass()`, `getRetentionTone()`

6. **Delete old CSS classes** from globals.css
   - `admin-module-grid`, `admin-module-card`, `admin-module-card-muted`
   - `admin-module-title-row`, `admin-module-icon`
   - `admin-health-pill`, `admin-health-complete`, `admin-health-partial`, `admin-health-gap`
   - `admin-page-header` related classes (if all usages migrated)

7. **Build check**
   ```bash
   pnpm type-check && pnpm build
   ```

## Todo List
- [ ] Install shadcn chart component
- [ ] Rebuild admin-stats-header.tsx with AdminStatCard grid
- [ ] Rebuild admin-module-health-grid.tsx with shadcn Card + Badge
- [ ] Rebuild overview/page.tsx sections
- [ ] Rebuild analytics/page.tsx sections
- [ ] Replace streak bar chart with shadcn Chart (recharts BarChart)
- [ ] Replace top lessons raw table with AdminDataTable
- [ ] Move badge helpers to AdminStatusBadge
- [ ] Delete old CSS classes
- [ ] Build passes

## Success Criteria
- Overview page shows KPI cards in responsive grid
- Module health grid uses shadcn Card with color-coded health badges
- Analytics streak chart renders via shadcn Chart (recharts)
- Top lessons table uses AdminDataTable with empty state
- All Vietnamese labels preserved
- Both pages server-rendered (no "use client" added)

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| shadcn Chart SSR issues | Low | Medium | Chart component is client — wrap in client boundary if needed |
| Streak bar custom styling lost | Low | Low | recharts BarChart supports custom colors per bar |
| Layout shift on card grid | Low | Low | Use fixed grid cols, not auto-fit |

## Next Steps
- Phase 5: Users + Content pages (first client-side interactive modules)

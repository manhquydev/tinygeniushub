# Phase 03: Charts & Visualization

## Context Links
- Chart wrapper: `src/components/ui/chart.tsx` (ChartContainer, ChartTooltip, etc.)
- Recharts v2.15.4 (installed)
- Existing chart: `src/components/weekly-progress-chart.tsx`
- Admin analytics service: `src/modules/admin/admin-analytics-service.ts`
- Admin billing service: `src/modules/admin/admin-billing-service.ts`

## Overview
- **Priority**: P2
- **Status**: completed
- **Description**: Add Recharts visualizations across 5 admin pages. Use existing ChartContainer wrapper and admin theme colors.

## Key Insights
- `ChartContainer` from shadcn already handles responsive sizing and theme injection
- `getAdminAnalyticsSnapshot()` returns time-series data suitable for charts
- `getAdminOverview()` returns revenue, subscription counts, webhook stats
- Current streak distribution uses custom CSS bars -- replace with Recharts bar chart
- Admin pages are server components; chart components must be `"use client"` extracted

## Requirements
### Functional
- 8 chart components across 5 pages (see chart inventory below)
- All charts support dark mode via `--admin-*` CSS vars
- Tooltips show Vietnamese labels with formatted numbers
- Charts adapt to container width (responsive)

### Non-functional
- Each chart component < 100 lines (extract to dedicated files)
- Charts lazy-load on client (wrapped in `Suspense` where needed)
- Use `ChartConfig` type from `chart.tsx` for theming

## Chart Inventory

| Page | Chart | Type | Data Source |
|------|-------|------|-------------|
| Overview | Revenue trend (30d) | AreaChart | `getAdminOverview()` + new endpoint |
| Overview | User growth | LineChart | `getAdminAnalyticsSnapshot()` |
| Analytics | Enrollment funnel | BarChart | `getAdminLearningAnalytics()` |
| Analytics | Streak distribution | BarChart | `learningAnalytics.streakDistribution` |
| Analytics | Retention rate trend | LineChart | New: aggregate retention over time |
| Users | Registration trend | AreaChart | `getAdminAnalyticsSnapshot("users")` |
| Blog | Views over time | LineChart | Blog analytics API |
| Payments (Operations) | Revenue trend | AreaChart | Billing service aggregation |

## Related Code Files

### Files to Create
- `src/components/admin/charts/admin-revenue-trend-chart.tsx`
- `src/components/admin/charts/admin-user-growth-chart.tsx`
- `src/components/admin/charts/admin-enrollment-funnel-chart.tsx`
- `src/components/admin/charts/admin-streak-distribution-chart.tsx`
- `src/components/admin/charts/admin-retention-trend-chart.tsx`
- `src/components/admin/charts/admin-registration-trend-chart.tsx`
- `src/components/admin/charts/admin-blog-views-chart.tsx`
- `src/components/admin/charts/admin-payment-revenue-chart.tsx`

### Files to Modify
- `src/app/(main)/admin/overview/page.tsx` -- add revenue + user growth charts
- `src/app/(main)/admin/analytics/page.tsx` -- replace CSS bars with Recharts, add funnel + retention
- `src/app/(main)/admin/users/page.tsx` -- add registration trend
- `src/app/(main)/admin/blog/page.tsx` or `blog/analytics/page.tsx` -- add views chart
- `src/app/(main)/admin/operations/page.tsx` -- add revenue chart to payments tab
- `src/modules/admin/admin-analytics-service.ts` -- add time-series aggregation if missing

### API Endpoints to Verify/Create
- `GET /api/admin/analytics?period=30d` -- may need time-series response format
- `GET /api/admin/overview` -- check if revenue trend data included
- Blog analytics endpoint -- verify views-over-time data shape

## Implementation Steps

1. **Create shared chart theme config**:
   - Define admin chart colors mapping `--admin-accent` and complementary colors
   - Create `src/components/admin/charts/admin-chart-theme.ts` with ChartConfig presets
   - Colors: teal-500 (primary), sky-500 (secondary), amber-500 (warning), emerald-500 (positive), rose-500 (negative)

2. **Revenue trend chart** (Overview):
   - `"use client"` AreaChart with gradient fill
   - X-axis: dates (30 days), Y-axis: VND formatted
   - Data: aggregate daily payment sums from `getAdminOverview()` or new service function
   - If no time-series data exists in service, add `getRevenueTimeSeries(days: number)` to `admin-analytics-service.ts`

3. **User growth chart** (Overview):
   - LineChart showing cumulative user count over 30d
   - Data: daily new parent registrations
   - May need `getAdminAnalyticsSnapshot()` to return daily breakdown

4. **Enrollment funnel chart** (Analytics):
   - Horizontal BarChart: Registered -> Enrolled -> Active -> Completed
   - Data from `learningAnalytics` aggregates
   - Show absolute numbers + percentages

5. **Streak distribution chart** (Analytics):
   - Replace existing CSS bar visualization with Recharts BarChart
   - 4 bars: 0d, 1-3d, 4-7d, 7d+ with distinct colors
   - Keep same data source: `learningAnalytics.streakDistribution`

6. **Retention trend chart** (Analytics):
   - LineChart showing retention rate over multiple periods
   - May need new service function: `getRetentionTrend()`

7. **Registration trend chart** (Users):
   - AreaChart with daily registrations over 30d
   - Integrate into users page header area

8. **Blog views chart** (Blog Analytics):
   - LineChart of daily page views
   - Data from blog analytics API

9. **Payment revenue chart** (Operations):
   - AreaChart in payments tab showing daily revenue
   - Data from billing service

10. **Wire charts into pages**:
    - Import chart components into respective page files
    - Wrap in `AdminSectionCard` for consistent framing
    - Pass server-fetched data as props to client chart components

## Todo List
- [x] Create admin chart theme config
- [x] Implement admin-revenue-trend-chart.tsx
- [x] Implement admin-user-growth-chart.tsx
- [x] Implement admin-enrollment-funnel-chart.tsx
- [x] Implement admin-streak-distribution-chart.tsx
- [ ] Implement admin-retention-trend-chart.tsx (skipped - no time-series retention data available)
- [x] Implement admin-registration-trend-chart.tsx
- [x] Implement admin-blog-views-chart.tsx
- [x] Implement admin-payment-revenue-chart.tsx
- [x] Add missing service functions for time-series data (getRevenueTimeSeries, getRegistrationTimeSeries)
- [x] Wire charts into overview page
- [x] Wire charts into analytics page
- [ ] Wire charts into users page (skipped - users page is pure client component AdminUsersManagement, no server data props)
- [x] Wire charts into blog analytics page
- [x] Wire charts into operations page

## Success Criteria
- All 8 charts render with real data (not mock)
- Charts are responsive (no overflow on mobile)
- Tooltips show formatted Vietnamese labels
- Dark mode colors consistent with admin theme
- Each chart file < 100 lines

## Risk Assessment
- **Medium**: Some time-series data may not exist in current services. Mitigate: audit data availability first, add minimal service functions.
- **Low**: Recharts bundle size (~45KB gzipped). Already installed, no new dependency.
- **Low**: Client component boundary for charts within server-rendered pages. Mitigate: extract each chart as `"use client"` component, pass data as serializable props.

## Security Considerations
- Chart data fetched server-side via admin session; no client-side API calls for chart data
- Revenue figures are admin-only; ensure pages remain behind `requireAdminParent()` / `getAdminSession()`

# Phase 3: Shared Admin Components Library

## Context Links
- Current page header: `src/components/admin/admin-page-header.tsx` (35 lines, custom CSS)
- Current stats header: `src/components/admin-stats-header.tsx` (80 lines, inline Tailwind)
- Current health grid: `src/components/admin/admin-module-health-grid.tsx` (64 lines, custom CSS)
- Design spec: sidebar dark, content light with white cards + slate borders

## Overview
- **Priority:** P0 (shared by all page phases)
- **Status:** pending
- **Effort:** 5h
- **Description:** Build reusable admin UI components using shadcn primitives. These replace scattered custom CSS patterns used across all 13 modules.

## Key Insights
- Current pages repeat card/metric/badge/table patterns with custom CSS classes
- shadcn Card, Table, Badge components provide accessible, themed primitives
- KPI stat card pattern appears in overview, analytics, operations pages
- Data table pattern appears in users, content, operations, blog, staff, log pages
- Status badge pattern appears in overview (subscriptions, webhooks), operations, gift codes

## Requirements
### Functional
- AdminPageHeader: title + description + icon + actions slot (update existing)
- AdminStatCard: KPI value + label + trend indicator + optional sparkline
- AdminDataTable: shadcn Table wrapper with pagination, sort headers, empty state
- AdminStatusBadge: color-coded pill for subscription/webhook/health statuses
- AdminSectionCard: wrapper Card with title + description + content slot
- AdminEmptyState: icon + message for no-data scenarios
- AdminLoadingSkeleton: Skeleton placeholders for async data

### Non-functional
- All components under 80 lines each
- Use shadcn primitives (Card, Table, Badge, Skeleton)
- White card bg, slate-200 border, consistent spacing

## Architecture
```
src/components/admin/ui/
  ├── admin-page-header.tsx      (UPDATE existing from admin/)
  ├── admin-stat-card.tsx         (NEW)
  ├── admin-data-table.tsx        (NEW)
  ├── admin-status-badge.tsx      (NEW)
  ├── admin-section-card.tsx      (NEW)
  ├── admin-empty-state.tsx       (NEW)
  └── admin-loading-skeleton.tsx  (NEW)
```

## Related Code Files
### Modify
- `src/components/admin/admin-page-header.tsx` — move to `admin/ui/`, replace custom CSS with shadcn Card + Tailwind

### Create
- `src/components/admin/ui/admin-stat-card.tsx`
- `src/components/admin/ui/admin-data-table.tsx`
- `src/components/admin/ui/admin-status-badge.tsx`
- `src/components/admin/ui/admin-section-card.tsx`
- `src/components/admin/ui/admin-empty-state.tsx`
- `src/components/admin/ui/admin-loading-skeleton.tsx`

### Delete
- Nothing (old page-header stays until imports updated in Phase 4+)

### shadcn Components to Install
```bash
npx shadcn@canary add table skeleton input select dialog form tabs scroll-area
```

## Implementation Steps

1. **Install shadcn components**
   ```bash
   npx shadcn@canary add table skeleton input select dialog form tabs scroll-area
   ```

2. **Create admin/ui/ directory**

3. **AdminPageHeader** — update existing
   - Replace custom CSS classes (`admin-page-header`, `admin-page-eyebrow`, etc.)
   - Use shadcn Card as wrapper with gradient top border
   - Keep same props: title, description, icon, actions, eyebrow
   - Move to `admin/ui/admin-page-header.tsx`
   - Keep old file as re-export for backward compat during migration

4. **AdminStatCard** — new
   ```tsx
   type AdminStatCardProps = {
     label: string;
     value: string | number;
     icon?: ReactNode;
     trend?: { value: number; label: string };  // +12% vs last month
     className?: string;
   }
   ```
   - shadcn Card with CardHeader (label) + CardContent (value + trend)
   - Trend arrow: green up / red down / gray neutral
   - Compact variant for pill-style (replacing AdminStatsHeader pills)

5. **AdminDataTable** — new
   ```tsx
   type AdminDataTableProps<T> = {
     columns: { key: string; label: string; render?: (row: T) => ReactNode }[];
     data: T[];
     emptyMessage?: string;
     pagination?: { page: number; totalPages: number; onPageChange: (p: number) => void };
   }
   ```
   - shadcn Table + TableHeader + TableBody + TableRow + TableCell
   - Optional pagination footer with prev/next buttons
   - Empty state fallback

6. **AdminStatusBadge** — new
   ```tsx
   type AdminStatusBadgeProps = {
     status: string;
     variant?: "subscription" | "webhook" | "health";
   }
   ```
   - Maps status strings to color schemes (emerald/sky/amber/rose/slate)
   - Consolidates `getSubscriptionBadgeClass()` and `getWebhookBadgeClass()` from overview page
   - Uses shadcn Badge as base

7. **AdminSectionCard** — new
   - shadcn Card with optional icon + title header
   - Children slot for section content
   - Replaces repetitive `<section className="card page-stack">` pattern

8. **AdminEmptyState** — new
   - Centered icon + message + optional action button
   - Used when tables/lists have no data

9. **AdminLoadingSkeleton** — new
   - shadcn Skeleton variants: card grid, table rows, stat row
   - Composable: `<AdminLoadingSkeleton variant="stat-row" count={4} />`

10. **Build check**
    ```bash
    pnpm type-check && pnpm build
    ```

## Todo List
- [ ] Install shadcn table, skeleton, input, select, dialog, form, tabs, scroll-area
- [ ] Create `src/components/admin/ui/` directory
- [ ] Update AdminPageHeader with shadcn Card
- [ ] Create AdminStatCard
- [ ] Create AdminDataTable with pagination
- [ ] Create AdminStatusBadge with variant color maps
- [ ] Create AdminSectionCard
- [ ] Create AdminEmptyState
- [ ] Create AdminLoadingSkeleton
- [ ] Build passes

## Success Criteria
- All 7 components importable from `@/components/admin/ui/`
- Each component under 80 lines
- AdminDataTable renders table with pagination controls
- AdminStatusBadge renders correct colors for all status types
- Build passes with no unused import warnings

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Over-engineering shared components | Medium | Medium | Start minimal, extend as page phases demand |
| Import path changes breaking pages | Low | High | Keep old re-export until all pages migrated |

## Next Steps
- Phase 4: Apply shared components to Overview + Analytics pages

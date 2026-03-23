---
title: "Admin UI Overhaul"
description: "Fix contrast, professionalize layout, add Recharts visualizations, audit and fix all 14 admin modules"
status: pending
priority: P1
effort: 16h
branch: main
tags: [admin, ui, charts, modules, dark-theme]
created: 2026-03-18
---

# Admin UI Overhaul

## Objective
Transform admin dashboard from functional prototype to professional-grade operations center with proper contrast, charts, and complete module coverage.

## Phases

| # | Phase | Priority | Effort | Status |
|---|-------|----------|--------|--------|
| 1 | [Theme & Contrast Fix](./phase-01-theme-contrast-fix.md) | P1 | 2h | pending |
| 2 | [Professional Layout](./phase-02-layout-professional.md) | P1 | 4h | pending |
| 3 | [Charts & Visualization](./phase-03-charts-visualization.md) | P2 | 5h | pending |
| 4 | [Module Audit & Fix](./phase-04-module-audit-fix.md) | P2 | 5h | pending |

## Dependencies
- Recharts v2.15.4 already installed
- shadcn/ui `chart.tsx` wrapper exists (`ChartContainer`, `ChartTooltip`, etc.)
- Admin CSS vars defined in `globals.css` (lines 82-93)
- 14 modules in `admin-module-catalog.ts`, 60+ API endpoints available

## Execution Order
Phase 1 -> Phase 2 (depends on theme tokens) -> Phase 3 + Phase 4 (parallel)

## Key Constraints
- Keep files under 200 lines; extract chart components into dedicated files
- Use existing `--admin-*` CSS custom properties; do not introduce a second theme system
- All charts use `ChartContainer` from `src/components/ui/chart.tsx`
- Vietnamese labels for user-facing text; English for code identifiers

## Reports
- Scout: `plans/reports/scout-2026-03-18-admin-interface-structure.md`

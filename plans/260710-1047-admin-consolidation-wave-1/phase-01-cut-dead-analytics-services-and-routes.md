---
phase: 1
title: Cut dead analytics services and routes
status: completed
priority: P1
dependencies: []
effort: 4h
---

# Phase 1: Cut dead analytics services and routes

## Overview

Remove dead/orphan analytics code: 1 fully-dead service, 2 orphan services, duplicate metric implementations in the old monolith, 6 orphan API routes, and unmounted chart components. Repoint live consumers first so nothing breaks.

## Context Links

- Audit evidence: `plans/reports/brainstorm-260710-1047-admin-consolidation-audit-and-action-roadmap.md` §A.4
- Live path to preserve: `admin/analytics/page.tsx` → `/api/admin/analytics/snapshot` → `admin-unified-analytics-service`
- Live overview path: `/api/admin/overview` → barrel `src/modules/admin/service.ts` → old monolith's `getAdminLearningAnalytics`/`getAdminRetentionAnalytics` (DUPLICATES of standalone services)

## Requirements

- Functional: `/api/admin/analytics/snapshot`, `/api/admin/analytics/revenue`, `/api/admin/analytics/content`, `/api/admin/analytics/realtime`, `/api/admin/analytics/alerts` cron logic, and `/api/admin/overview` keep identical response shapes
- Non-functional: reduced maintenance surface; no unused exports left behind

## Related Code Files

**Delete:**
- `src/modules/admin/admin-time-series-service.ts` (0 importers)
- `src/modules/admin/admin-cohort-service.ts` + route `src/app/api/admin/analytics/cohorts/`
- `src/modules/admin/admin-funnel-service.ts` + route `src/app/api/admin/analytics/funnels/`
- Orphan routes: `src/app/api/admin/analytics/route.ts` (root), `analytics/lessons/`, `analytics/sot/` (route only — KEEP `admin-sot-dashboard-service`, used by unified), `analytics/clarity/`, `analytics/alerts/` route
- `src/lib/analytics/alerts/monitor-job.ts`: red team found NO caller of `runAlertMonitor` anywhere (incl. `vercel.json` crons — no alerts entry). Verify with cron/worker/queue-aware grep (see step 2); delete if confirmed dead. The earlier "cron uses it" claim was false.
- Unmounted components: `CohortHeatmap`, `CohortTable`, `FunnelChart`, `AlertDashboard`, `ClarityDashboard` (`src/components/admin/analytics/clarity-dashboard.tsx` — fetches the clarity route this phase deletes; grep-confirmed unmounted). Re-derive the full unmounted list via fresh grep at execution time rather than trusting this hand-picked set.
- `src/modules/admin/admin-analytics-service.ts`: delete `getAdminAnalyticsSnapshot`, `getAdminTopLessonsAnalytics`, and duplicate `getAdminLearningAnalytics`/`getAdminRetentionAnalytics` (delete whole file if nothing else remains)

**Modify:**
- `src/modules/admin/service.ts` (barrel): repoint learning/retention re-exports to `admin-learning-analytics-service` / `admin-retention-analytics-service`
- `src/app/api/admin/overview/route.ts` (or its service): confirm it consumes repointed exports
- Related `src/modules/admin/__tests__/*` referencing deleted code

## Implementation Steps (TDD)

1. **Tests first — lock live contracts:** write/extend vitest contract tests asserting response shape (keys, types) of `/api/admin/analytics/snapshot` and `/api/admin/overview` services (call service functions directly with mocked prisma per existing `__tests__` patterns). Run — green baseline.
2. Verify audit's liveness claims before cutting — grep must be **cron/worker/queue-aware**, not import-only (red team proved import-only greps miss cron→queue→worker indirection): for each deletion target, grep `src/` AND `src/worker/`, `vercel.json`, `.github/workflows/`. Confirm `admin-ga4-reporting-service` imported by `admin-sot-dashboard-service` → KEEP both. Confirm `runAlertMonitor`/`monitor-job` has 0 callers → delete it too.
3. **Atomic barrel swap (single commit — red team confirmed sequential steps break compile):** the barrel `src/modules/admin/service.ts` is pure `export *` and `admin-analytics-service.ts` exports the SAME names as the standalone services (`getAdminLearningAnalytics`, `getAdminRetentionAnalytics` + types) — adding standalone re-exports before stripping duplicates causes TS2308 ambiguous-export across all 34 barrel consumers. In ONE edit: add `export * from "./admin-learning-analytics-service"` + `"./admin-retention-analytics-service"` AND delete the duplicate functions/types from `admin-analytics-service.ts` (delete the whole file if nothing remains). Run tests — must stay green (shape parity verified by red team: `admin-analytics-service.ts:14-39` vs standalone types match; if drift appears, STOP and report, do not adapt tests silently).
4. Delete orphan routes + services + unmounted components listed above. After each deletion batch: `pnpm type-check` to catch dangling imports.
5. Delete/update tests that only covered deleted code.
6. Full gate: `pnpm lint && pnpm type-check && pnpm test`.

## Success Criteria

- [ ] Contract tests for snapshot + overview written BEFORE changes and green AFTER
- [ ] Zero references to deleted services (`grep` clean)
- [ ] `/admin/analytics` and `/admin/overview` pages render with data (manual check via `pnpm dev`)
- [ ] `pnpm lint && pnpm type-check && pnpm test` green

## Risk Assessment

- **Barrel export collision (TS2308):** mitigated by atomic swap in step 3 — never leave an intermediate state where both `admin-analytics-service.ts` and standalone services export the same names through the `export *` barrel (34 consumer files break at once)
- **Barrel repoint shape drift:** contract tests in step 1 catch this; if drift found, surface to user before adapting
- **GA4 service runtime liveness** (audit unresolved Q2): step 2 verifies import chain; do not delete if reachable
- **Import-only grep blind spot:** liveness verification must include cron/worker/queue indirection (step 2) — two prior "dead" claims (newsletter, monitor-job "cron uses it") were wrong for exactly this reason

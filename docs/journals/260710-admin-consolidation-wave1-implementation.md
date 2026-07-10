# Admin Consolidation Wave 1 — Implementation

**Date:** 2026-07-10
**Branch:** `feat/admin-consolidation-wave-1` (5 code commits on origin/main; not merged)
**Plan:** `plans/260710-1047-admin-consolidation-wave-1/`

## What shipped (to branch)

All 4 phases, TDD, each independently verified + committed:

1. **Dead analytics cut** (`92d33eea`) — deleted monolith `admin-analytics-service` (byte-identical duplicate of standalone overview/learning/retention services), `admin-time-series`/`cohort`/`funnel` services, orphaned alerts lib, 6 unmounted routes, 5 unmounted components. Repointed live consumers to standalone services. Avoided the TS2308 barrel-collision red-team flagged by deleting the monolith entirely rather than partial-repoint.
2. **Newsletter feature-kill** (`4a2e8072`) — dismantled a LIVE pipeline (weekly cron + BullMQ worker) in safe order (stop sends → delete surfaces → drop model). Surgical removal from shared `queue.ts`/`worker/index.ts` left other queues intact. Hand-authored the drop migration to avoid bundling pre-existing unrelated schema drift. Deleted orphan `admin/bulk-enroll`.
3. **Nav unification** (`077b3e8a`) — sidebar generated from `admin-module-catalog.ts` (single source); deleted hardcoded `NAV_GROUPS`; fixed stale catalog (phantom clarity, orphan skills/impersonation), added feature-flags + missing site-settings modules; feature-flags got its own page.
4. **Centralized gating** (`fa2eab2e`) — shared `requireSuperAdminParent`/`requireSuperAdmin` helpers + catalog conformance test. Fixed live authz gaps where pages were gated but APIs weren't (organizations, skills, feature-flags, impersonate/stop). Break-glass runbook added.

## Key decisions / deviations

- **Step 1 premise was already resolved.** The goal assumed the i18n branch needed closing (failing VI switching + PR). Reality: i18n was already merged to `origin/main` via PR #9; VI switching works (EN/VI locale parity 5178 keys). No PR fabricated. The red-team's "17-file overlap blocker" was measured against a local `main` that was 16 commits stale.
- **Phase 4 architecture deviated from plan** (layout choke-point → shared-helper-per-page + conformance test). No `middleware.ts` exists to feed a pathname to a server layout; adding one is higher-risk and un-testable locally. The conformance test gives the same guarantee (no superAdminOnly page/API ships un-gated) without middleware.
- **`admin-guard.ts` retirement deferred** — its `ADMIN_EMAILS` allowlist vs DB `AdminAccount.role` migration carries lockout risk that needs the running stack + `test:e2e:security` to validate, which isn't provisioned locally.

## What red-team + audit caught (that the original audit missed)

The original 2-agent audit was wrong twice: it called the newsletter "dead" (a live weekly send pipeline exists) and `admin/integrations` an orphan (live Jules webhook read-side). Both surfaced by adversarial review BEFORE any code was cut. Lesson reinforced: import-only grep misses cron→queue→worker indirection — liveness checks must be cron/worker/queue-aware. The Phase 4 conformance test also surfaced authz gaps beyond the inventory (skills/feature-flags/impersonate APIs ungated) — mechanical enforcement beats hand-authored matrices.

## Outstanding before merge/deploy (need running stack)

- `pnpm test:e2e:security` + manual staff-admin walkthrough (redirect/403).
- Prod DB backup before the newsletter drop migration deploys; post-deploy rollback needs full DB restore (not code-only fast rollback).

## Pre-existing issues flagged (not Wave 1)

- Schema drift (Abeka*/CourseReview) on the branch never had a migration generated.
- Local dev Postgres/Redis not provisioned (`docker-compose` services never started; port 5432 taken by an unrelated container) — `pnpm backup:create` and real local dev can't work as-is.

**Verification:** type-check clean, lint clean, 648/649 tests (1 pre-existing `kid-mission-panel` flake, passes in isolation), conformance 11/11. Final independent audit: SHIP, zero Critical/High/Medium.

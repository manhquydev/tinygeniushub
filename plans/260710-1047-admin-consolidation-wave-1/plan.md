---
title: "Admin Consolidation Wave 1 - Cut Dead Code, Unify Nav, Centralize Gating"
description: "Delete dead/orphan admin business logic (analytics, newsletter feature-kill, orphan APIs), unify sidebar nav from module catalog, centralize SUPER_ADMIN gating. TDD: lock behavior before each cut."
status: pending
priority: P1
branch: "i18n/english-primary-migration"
tags: [admin, cleanup, refactor, tdd]
blockedBy: [260514-0129-i18n-english-primary-migration]
blocks: []
created: "2026-07-10T03:54:51.038Z"
createdBy: "ck:plan"
source: skill
---

# Admin Consolidation Wave 1 - Cut Dead Code, Unify Nav, Centralize Gating

## Overview

Wave 1 of the admin consolidation roadmap: remove dead/orphan business logic surfaces, intentionally kill the newsletter feature, make `admin-module-catalog.ts` the single source of truth for sidebar nav, and centralize SUPER_ADMIN gating at a layout choke point. TDD mode: each phase writes tests locking current behavior BEFORE cutting/refactoring.

**Source:** `plans/reports/brainstorm-260710-1047-admin-consolidation-audit-and-action-roadmap.md` + red-team review (2026-07-10, 3 adversarial reviewers, 14 findings applied).

**User decisions locked in (re-confirmed post-red-team 2026-07-10):**
- Coupons: KEEP (checkout wiring deferred to Wave 3 — do NOT delete coupon code)
- Newsletter: DELETE as **intentional feature-kill** — red team proved a live send pipeline exists (weekly cron + BullMQ worker); user chose to kill it anyway with corrected facts. Scope includes worker/cron/queue dismantling in safe order
- Jules integration (`admin/integrations`): KEEP — live webhook integration; Wave 3 candidate for admin UI wiring
- `admin/bulk-enroll`: DELETE — user confirmed no operational (curl/script) usage; real impls live at teacher/org routes
- Orphan analytics: DELETE (git preserves history)

## Prerequisites

1. **Blocked by** `plans/260514-0129-i18n-english-primary-migration/` — real state per red-team verification: its Phase 4 (verify) is *blocked and failing* (VI locale switching fails across surfaces), Phase 5 file does not exist yet, and the branch already carries diffs to 17 `admin/**` files this plan also touches (`admin/security/page.tsx`, `admin/skills/page.tsx`, ...). **Go/no-go gate: verify the i18n branch is actually merged to `main` before opening any Wave 1 phase.**
2. **Working-tree hygiene:** commit or stash the ~472 `.claude/` framework deletions (+ other uncommitted entries) separately BEFORE staging any Wave 1 diff, so Wave 1 PRs stay reviewable.
3. DB backup before Phase 2 migration: `pnpm backup:create`.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Cut dead analytics services and routes](./phase-01-cut-dead-analytics-services-and-routes.md) | Pending |
| 2 | [Delete newsletter feature and orphan admin APIs](./phase-02-delete-newsletter-feature-and-orphan-admin-apis.md) | Pending |
| 3 | [Generate nav from module catalog and unbury feature flags](./phase-03-generate-nav-from-module-catalog-and-unbury-feature-flags.md) | Pending |
| 4 | [Centralize SUPER_ADMIN gating](./phase-04-centralize-super-admin-gating.md) | Pending |

Phases 1-2 independent; Phase 3 depends on Phase 2 (newsletter nav entry removed); Phase 4 depends on Phase 3 — note Phase 3 risk section: superAdminOnly pages exposed in nav should get the Phase 4 layout gate (or an interim per-page check) at the same time.

## Dependencies

- Cross-plan: `blockedBy: 260514-0129-i18n-english-primary-migration`
- Validation gates per phase: `pnpm lint && pnpm type-check && pnpm test`
- Phase 4 additionally: `pnpm test:e2e:security`

## Acceptance (Wave-level)

- All dead/orphan surfaces removed; newsletter pipeline fully dismantled (no send path remains); `pnpm lint/type-check/test` green
- Sidebar renders from `admin-module-catalog.ts`; `/admin/skills` + `/admin/impersonation` + `/admin/feature-flags` reachable via nav
- Every `/admin/*` page enforces role via the layout choke point; superAdminOnly APIs pass the catalog conformance test (incl. fixed organizations gap)
- Break-glass runbook exists before Phase 4 ships
- No regression on existing admin pages (each loads for the correct role)

## Red Team Review

### Session — 2026-07-10
**Reviewers:** Security Adversary, Assumption Destroyer, Failure Mode Analyst (3× code-reviewer subagents, Standard verification tier)
**Findings:** 14 after dedupe (4 Critical, 6 High, 4 Medium) — 14 accepted (3 resolved via user re-decision), 0 rejected. All findings carried file:line evidence; none rejected at the evidence filter.

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Newsletter "no send pipeline" premise false — live cron+BullMQ pipeline | Critical | Accept → user re-decided: intentional feature-kill | Phase 2 (rewritten), plan.md |
| 2 | Barrel repoint as 2 sequential steps → TS2308 across 34 consumers | Critical | Accept | Phase 1 step 3 (atomic swap) |
| 3 | Fast rollback is code-only; unsafe after destructive migration | Critical | Accept | Phase 2 risks |
| 4 | `/api/admin/organizations*` not SUPER_ADMIN-gated despite catalog flag | Critical | Accept | Phase 4 (explicit fix + conformance test) |
| 5 | `admin/integrations` is live Jules read-side, not orphan | High | Accept → user: KEEP | Phase 2 (removed from delete list) |
| 6 | staff/security/log/impersonation pages lack role checks; per-page opt-in pattern already failed 3/4 times | High | Accept | Phase 4 (layout choke point) |
| 7 | Second role-blind auth system `admin-guard.ts` unaccounted | High | Accept | Phase 4 (migrate + retire) |
| 8 | i18n blocker further from done than stated; 17 admin-file overlap | High | Accept | plan.md Prerequisites (go/no-go) |
| 9 | Phase 2 inventory missed 5/7 model consumers incl. worker/cron | High | Accept | Phase 2 (full inventory) |
| 10 | Sole-SUPER_ADMIN lockout risk; no break-glass | High | Accept | Phase 4 (runbook requirement) |
| 11 | `ClarityDashboard` missing from Phase 1 delete list | Medium | Accept | Phase 1 |
| 12 | "cron uses monitor-job.ts" claim false — 0 callers | Medium | Accept | Phase 1 (verify + delete) |
| 13 | bulk-enroll operational-use unverified | Medium | Accept → user: not used, DELETE | Phase 2 |
| 14 | 472 uncommitted `.claude/` deletions not gated in plan | Medium | Accept | plan.md Prerequisites |

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01, phase-02, phase-03, phase-04
- Decision deltas checked: 6 (newsletter feature-kill scope, Jules keep, bulk-enroll delete, atomic barrel swap, layout-gate architecture, i18n prerequisite state)
- Reconciled stale references: 5 (plan.md decisions + prerequisites; phase-02 full rewrite; phase-01 monitor-job/ClarityDashboard/atomic-swap; phase-03 exposure-ordering risk; phase-04 full rewrite)
- Unresolved contradictions: 0

## Unresolved Questions

1. Is `vercel.json` cron the active trigger in production (deploys run via GitHub Actions → PM2 on DigitalOcean, not Vercel)? Does not change Phase 2 scope (worker is live regardless) — verify during Phase 2 step 3 to ensure ALL trigger paths are removed.
2. `ADMIN_EMAILS` allowlist semantics (Phase 4): confirm during execution whether any consumer needs env-based allowlist before retiring `admin-guard.ts`.
3. Skills module intended role (staff vs superadmin) — confirm during Phase 4 step 1.

---
title: 'Admin Consolidation Wave 1 - Cut Dead Code, Unify Nav, Centralize Gating'
description: >-
  Delete dead/orphan admin business logic (analytics, newsletter feature-kill,
  orphan APIs), unify sidebar nav from module catalog, centralize SUPER_ADMIN
  gating. TDD: lock behavior before each cut.
status: completed
priority: P1
branch: i18n/english-primary-migration
tags:
  - admin
  - cleanup
  - refactor
  - tdd
blockedBy:
  - 260514-0129-i18n-english-primary-migration
blocks: []
created: '2026-07-10T03:54:51.038Z'
createdBy: 'ck:plan'
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
| 1 | [Cut dead analytics services and routes](./phase-01-cut-dead-analytics-services-and-routes.md) | Completed |
| 2 | [Delete newsletter feature and orphan admin APIs](./phase-02-delete-newsletter-feature-and-orphan-admin-apis.md) | Completed |
| 3 | [Generate nav from module catalog and unbury feature flags](./phase-03-generate-nav-from-module-catalog-and-unbury-feature-flags.md) | Completed |
| 4 | [Centralize SUPER_ADMIN gating](./phase-04-centralize-super-admin-gating.md) | Completed |

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
| 1 | Newsletter "no send pipeline" premise false — live cron+BullMQ pipeline | Critical | Accept → user re-decided: intentional feature-kill | Completed |
| 2 | Barrel repoint as 2 sequential steps → TS2308 across 34 consumers | Critical | Accept | Completed |
| 3 | Fast rollback is code-only; unsafe after destructive migration | Critical | Accept | Completed |
| 4 | `/api/admin/organizations*` not SUPER_ADMIN-gated despite catalog flag | Critical | Accept | Completed |
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

## Validation Log

### Session — 2026-07-10 (retrospective, post-implementation)

`/ck:plan validate` run after implementation + merge. Per the validate guard, the verification pass is skipped because `## Red Team Review` already carries file:line evidence (Standard tier, 14 findings); all plan claims were additionally verified during implementation (type-check + lint clean, 648/649 tests, catalog conformance 11/11) and by an independent final code-review (SHIP, zero Critical/High/Medium).

**Verification Results**
- Tier: Standard (4 phases). Claims checked during implementation: all phase file/symbol/route references executed against real code. Verified: all. Failed: 0. Unverified: 0.

**Critical questions — no open user decisions remain.** Every decision point was resolved before/during implementation via prior `AskUserQuestion` rounds (approach, coupons keep, newsletter feature-kill, Jules keep, bulk-enroll delete) and the red-team re-decisions. The one post-plan design change (Phase 4: layout choke-point → shared-helper-per-page + conformance test) is documented with rationale (no `middleware.ts` exists to feed a server layout the pathname); it preserves the same guarantee and passed audit.

**Open questions — resolved during execution:**
1. `vercel.json` cron trigger — RESOLVED: `/api/cron/newsletter-weekly` entry removed from `vercel.json` and the entire worker/queue/service pipeline deleted, so all trigger paths (Vercel-cron or otherwise) are gone regardless of which fires in prod.
2. `ADMIN_EMAILS` / `admin-guard.ts` — DEFERRED (documented in Phase 4 STEP E): retiring the role-blind email-allowlist guard carries a lockout risk that needs the running stack + `test:e2e:security` to validate the `ADMIN_EMAILS`↔`AdminAccount.role` relationship; left in place, its 2 analytics-read consumers untouched.
3. Skills module role — RESOLVED: SUPER_ADMIN (confirmed via `skills/page.tsx` redirect + catalog `skills-mapping.superAdminOnly: true`).

**Whole-Plan Consistency Sweep:** re-read plan.md + 4 phase files; decisions above reconciled; unresolved contradictions: 0.

**Recommendation:** Plan is fully implemented, audited (SHIP), and merged to `main`. No outstanding decisions or contradictions. Pre-deploy gates (`test:e2e:security`, staff-admin walkthrough, prod DB backup) remain the operator's responsibility and are not plan-internal blockers.

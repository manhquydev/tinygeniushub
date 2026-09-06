---
title: "operator-kernel-loop"
description: "Close ticket-grant holes, give one admin household tickets + SKU on/off, freeze Abeka. Parent+kid already ticketed for learn."
status: pending
priority: P1
effort: "3d"
branch: main
tags: [kernel, admin, entitlement, billing, operate]
blockedBy: []
blocks: []
created: 2026-09-05
---

# Operator kernel loop

## Overview

Kernel **learn** is already ticket-SoT (`canAccess` → complete/watch/today). Money/ops still write `Subscription` / `CourseEnrollment` **without** tickets on gift, free checkout, admin subscription PATCH, and payment reconcile. Admin is a 16-module staff product. Abeka is a parallel app.

This plan makes the **machine run with 2 roles** (Parent household, one Admin operator). New catalogs later = Offering + Lesson data, not new complete APIs.

Authority: `docs/decisions/260904-1102-platform-kernel.md`. Brainstorm 2026-09-05: operate first; do not push staff. Audit `plans/reports/codebase-audit-2026-09-04/` — several Criticals are **stale vs 2026-09-05 src** (today is tickets; curriculum POST is parent+child; child cap reads subscription). Use current src, not audit bullets, as SoT.

Stacks after done plans: `260904-1103-platform-kernel` (code), `260904-2244-kernel-catalog-access`, `260905-0821-ticket-surface`, `260904-1940-local-kernel-loop`. Does not reopen those.

## Brainstorm contract

| Field | Value |
|---|---|
| Outcome | Parent buy/gift/admin-grant → live `Entitlement` → kid `canAccess`. One admin: content, cash, household tickets, SKU active. Abeka not in the loop. |
| Constraints | ADR kernel. Files ≤200 lines. Domain in `src/modules/*`. One Admin JWT. Current SKU = course + track today. |
| Non-goals | Staff RBAC expansion, teacher/orgs, blog-as-ops, Abeka→Lesson adapter, plugin SDK, child login, Family+ marketing, `/pricing` restore, Stripe price-id if unset (fail closed, do not fake). |
| Acceptance | See Success Criteria. |

## Scope Challenge

- Existing: `grantOfferingInTx` / `grantPlanOfferingInTx` / `grantCourseOfferingInTx` (`src/modules/entitlement/grant-from-billing.ts`). Admin JWT `ccth_admin_session`. Content CMS. Payments list. Parent billing already lists tickets.
- Requested: operate-first 2-role architecture implemented.
- Complexity: >8 files because grant holes are 4 call sites + admin UI. No new framework.
- Selected mode: **HOLD SCOPE**

## Research packet (no extra researchers)

- Audit arbiter: `plans/reports/codebase-audit-2026-09-04/report.md`
- Herdr scouts 2026-09-05: admin API/UI/sec/gap; kernel law/ticket/catalog/commerce; garbage docs/biz/admin
- ADR + `docs/platform-kernel.md`

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Every money/ops grant path writes/extends `Entitlement` | P1 |
| 2 | Admin household screen lists/grants/expires tickets | P1 |
| 3 | Operator nav = 4 jobs; Abeka writes unpublished or parent-auth; package webhook signed | P1 |
| 4 | Offering active toggle on existing catalogKeys; regression tests | P1 |

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Close ticket grant holes](./phase-01-start.md) | Pending | 6h |
| 2 | [Household tickets admin](./phase-02-household-tickets.md) | Pending | 8h |
| 3 | [Operator nav + Abeka freeze](./phase-03-operator-nav-abeka-freeze.md) | Pending | 6h |
| 4 | [Offering toggle + tests](./phase-04-offering-toggle-tests.md) | Pending | 6h |

Phase 2 depends on 1. Phase 4 depends on 1–2. Phase 3 independent of 2 (can parallel after 1).

## Architecture

```
Parent session                    Admin JWT (1 operator)
  buy / gift / kid play             content · money · household · SKU
         │                                    │
         ▼                                    ▼
   PaymentRecord ──webhook/ops──► grant*InTx ──► Entitlement
         │                                          │
         └──────── CourseEnrollment ledger only      └► canAccess(parentId, lessonId)
```

Do **not** add Catalog plugin runtime. `catalogKey` string already on `Offering`.

## Out of scope

- `CONTENT_EDITOR` / `SUPPORT_AGENT` workflows
- `/admin/blog`, `/admin/organizations` product work
- Abeka Lesson importer
- Certificates keyed off enrollment
- Dual Prisma client merge
- Worker bootstrap cron rewrite
- README/PDR full rewrite (phase 4: only kernel-ops sentences that this plan makes false)

## Success Criteria

- [ ] Gift redeem, free checkout, admin subscription action, payment reconcile each leave a live household ticket covering the SKU
- [ ] Admin can open a parent and see tickets (code, catalogKey, status, validUntil) and grant/extend/expire
- [ ] Reconcile no longer grants play via `CourseEnrollment` alone
- [ ] Remaining Abeka spoof GETs 401; package-subscription unsigned 401/404 (HMAC already live)
- [ ] Operator nav hides blog/orgs/staff-as-team; one admin still reaches security/log/impersonation
- [ ] `Offering.active=false` blocks **new** grants; existing live tickets still play
- [ ] No `POST /api/<catalog>/complete` added
- [ ] Unit tests for the four grant holes + household list + Abeka 401

## Assumptions

- First live SKU = PayOS/mock course + trial track today. Stripe pass stays fail-closed without price id.
- Abeka has no production customers to migrate this plan (unpublish, do not adapter).
- Impersonation stays for the single operator.

## Unresolved (locked defaults — do not re-open in cook)

- Child cap 3 vs 1: keep `Subscription.childProfileLimit` fallback 1. Not this plan.
- Stripe VND recurring: out of scope.
- Prod ingress of package-subscription: freeze as if live.

<!-- slug: operator-kernel-loop -->

## Red Team Review

### Session — 2026-09-05 (coordinator; Opus code-reviewer rate-limited)
**Findings:** 10 (8 accepted, 2 rejected)
**Severity breakdown:** 2 Critical, 4 High, 4 Medium
Lenses: Security + Failure/Flow + Assumption/Scope. Evidence from src.

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Gift marks used then validates plan; no tx | Critical | Accept | Phase 1 |
| 2 | `enrollParent` ignores tx; rollback claim false | Critical | Accept | Phase 1 |
| 3 | Package webhook already HMAC `route.ts:93` | High | Accept | Phase 3 shrink |
| 4 | `curriculum/complete` already parent+child | High | Accept | Phase 3 shrink |
| 5 | Tickets POST must copy CSRF+RL+roles | High | Accept | Phase 2 |
| 6 | Free checkout already-enrolled skips grant | High | Accept | Phase 1 |
| 7 | Detail via `admin/service` barrel | Medium | Accept | Phase 2 |
| 8 | Hide courses nav must not delete APIs | Medium | Accept | Phase 3 |
| 9 | Re-add package WebhookEvent | Medium | Reject | gold-plate |
| 10 | Gate `canAccess` on `Offering.active` | Medium | Reject | would cut live kids |

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01..04
- Decision deltas: gift validate-first+tx; enroll tx-aware; HMAC exists; complete already authed; CSRF copy; already-enrolled still grant
- Reconciled stale references: plan success Abeka/HMAC line
- Unresolved contradictions: 0

## Validation Log

### Session — 2026-09-05 specialized scopes (no interview; BA locked)
Opus interview skipped: rate limit + decisions already locked in brainstorm.

#### Round commerce (phase 1)
- `redeemGiftCode` no grant, used-before-validate `gift-code-service.ts:67-93` VERIFIED
- `createFreeTemporaryCheckoutSession` enroll-only `course-checkout-service.ts:315-319` VERIFIED
- `syncEnrollmentsFromPaymentTarget` has tx `reconcile/route.ts:206` VERIFIED
- `grantCourseOfferingInTx` exists `grant-from-billing.ts:126` VERIFIED

#### Round admin (phase 2)
- `listEntitlements` `entitlement-service.ts:100` VERIFIED (no status filter)
- `getAdminParentDetail` `admin-user-service.ts:343` via `admin/service.ts` VERIFIED
- CSRF+RL+roles `users/[parentId]/subscription/route.ts:18-25` VERIFIED

#### Round security (phase 3)
- Package HMAC `package-subscription/route.ts:93-97` VERIFIED
- `curriculum/complete` `requireParentAndOwnedChild` `:27` VERIFIED
- Abeka `check-access` parentId query no session `:39-46` VERIFIED

#### Round offering (phase 4)
- `canAccess` selects `offering.catalogKey` only, not `active` `entitlement-service.ts:133-135` VERIFIED

### Verification Results
- **Tier:** Standard (4 phases)
- **Claims checked:** 11
- **Verified:** 11 | **Failed:** 0 | **Unverified:** 0

Locked: 2 roles; one operator; operate-first; Abeka leftover not adapter; `canAccess` ignores offering.active; expire on cancel.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01..04 after red-team apply
- Decision deltas checked: 6
- Reconciled stale references: 0 remaining
- Unresolved contradictions: 0

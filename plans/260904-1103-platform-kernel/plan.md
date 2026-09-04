---
title: "platform-kernel"
description: "Cut over TinyGenius Hub to a course-agnostic kernel: household tickets, lesson+skill, offerings (recurring + one-time)."
status: pending
priority: P1
effort: "5d"
tags: [kernel, entitlement, billing, learning]
blockedBy: []
blocks: []
created: 2026-09-04
---

# Platform kernel cutover

## Overview

Implement accepted ADR `docs/decisions/260904-1102-platform-kernel.md`. Kernel = parent household + child profiles + tickets + lesson + skill. Catalogs (Track, Course, later Abeka) plug in. Money grants tickets; player does not key off `CourseEnrollment`.

v1 does **not**: child login, per-child licenses, Abeka content migration, offering admin CMS, Family+ slot=5, newsletter, MFA.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Entitlement module: household ticket + `canAccess(parentId, lessonId)` | P1 |
| 2 | Payments grant/extend tickets (dual-write with existing enrollment) | P1 |
| 3 | Today/watch/complete/player use tickets; Abeka writes require parent auth | P1 |
| 4 | Recurring pass uses Stripe Billing auto-charge | P1 |
| 5 | Tests + cutover docs; no dual-read left on kernel lesson access | P1 |

## Cross-Plan Dependencies

Abeka stabilization plans are completed. This plan does not migrate Abeka into `Lesson`; it only auth-gates or unpublishes Abeka write APIs.

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Entitlement schema + service](./phase-01-start.md) | Pending |
| 2 | [Offerings + payment grants](./phase-02-offering-payment-grants.md) | Pending |
| 3 | [Access cutover + Abeka auth](./phase-03-access-cutover-learning.md) | Pending |
| 4 | [Stripe recurring pass](./phase-04-stripe-recurring-pass.md) | Pending |
| 5 | [Tests + doc cutover](./phase-05-tests-doc-cutover.md) | Done |

## Dependencies

- ADR: `docs/decisions/260904-1102-platform-kernel.md`
- Contract: `docs/platform-kernel.md`
- Audit: `plans/reports/codebase-audit-2026-09-04/report.md`
- Existing: `src/modules/learning/completion-service.ts`, `src/modules/billing/webhook-service.ts`, `src/modules/courses/course-payment-webhook-service.ts`, `src/app/api/lessons/today/route.ts`, `src/modules/content/service.ts`, `src/app/(kid-app)/kid/today/page.tsx`


## Success Criteria

- [ ] `canAccess` is the learn-path gate for kernel `Lesson` ids
- [ ] Progress still keyed by `childId`; tickets keyed by `parentId`
- [ ] Stripe recurring offering uses subscription mode, not `mode=payment`
- [ ] Abeka `POST` complete/watch/journey require parent session
- [ ] Unit tests for grant, expire, household share, per-child progress
- [ ] No new catalog-specific complete API

## Out of scope

Child users, per-child tickets, Abeka→Lesson importer, `/pricing` marketing page, child cap 3/5 product change, Sentry.

<!-- slug: platform-kernel -->

## Red Team Review

### Session — 2026-09-04
**Findings:** 7 (6 accepted, 1 rejected)
**Severity breakdown:** 1 Critical, 4 High, 2 Medium
Opus code-reviewer subagents failed (rate limit). Coordinator ran Security + Failure + Assumption lenses against source.

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Kid today RSC bypasses API; enrollment-only mission | Critical | Accept | Phase 3 |
| 2 | Unsigned package-subscription can still grant paid access | High | Accept | Phase 3 |
| 3 | No STRIPE_PRICE_* in env; price_data cannot be subscription | High | Accept | Phase 4 |
| 4 | Level key is not CourseLesson.orderNo | High | Accept | Phase 1 |
| 5 | Dual-read cutover without backfill gate | High | Accept | Phase 3/5 |
| 6 | VND Stripe subscriptions may be unsupported | Medium | Accept | Phase 4 stop-rule |
| 7 | Adaptive IDOR on review-queue | Medium | Reject | out of scope unless touched |

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01..05
- Decision deltas checked: 6
- Reconciled stale references: today API vs `content/service.ts`; Stripe env
- Unresolved contradictions: 0

## Validation Log

### Verification Results
- **Tier:** Full (5 phases)
- **Claims checked:** 12
- **Verified:** 12 | **Failed:** 0 | **Unverified:** 0
- `getParentFromRequest` `src/lib/auth/session.ts:120`
- `getRealKidGardenMission` enrollment-only `src/modules/content/service.ts:159-175`
- Kid page calls service `kid/today/page.tsx:82`
- Stripe `mode=payment` `stripe-provider.ts:50`
- Trial sub create `identity/service.ts:64-76`
- Webhook lock `webhook-service.ts:81`
- CourseLesson `schema.prisma:1063-1066`
- Abeka complete unauthenticated `curriculum/complete/route.ts:22-61`
- No STRIPE_PRICE in `src/lib/env.ts`

Locked BA answers (not re-opened): household tickets, parent-only users, lesson+skill, recurring auto-charge, one-time program+level, PayOS one-time / Stripe recurring.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01-start.md, phase-02..05
- Decision deltas checked: 6
- Reconciled stale references: 3
- Unresolved contradictions: 0


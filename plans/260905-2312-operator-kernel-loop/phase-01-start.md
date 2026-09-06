---
phase: 1
title: "Close ticket grant holes"
status: pending
priority: P1
effort: "6h"
dependencies: []
---

# Phase 1: Close ticket grant holes

## Overview

Four ops/money paths write access tables but skip `grant*InTx`. Player already ignores enrollment. After this phase, those paths grant/extend household tickets in the same DB transaction as the ledger write.

## Requirements

- Functional: gift redeem, free checkout, admin subscription mutate, payment reconcile all call `grantPlanOfferingInTx` or `grantCourseOfferingInTx` (or expire/grace counterparts) inside **one** `prisma.$transaction` using `@/lib/db` (same client as those services).
- Functional: enrollment upsert may remain as purchase ledger; it is not the grant.
- Functional: `enrollParent` today uses module `prisma`, not a tx (`course-service.ts:190`). Do **not** call it inside `$transaction` and claim rollback. Either add optional `tx` argument to `enrollParent`/`getEnrollment` or inline `courseEnrollment.upsert` on the tx next to grant.
- Functional: free checkout when already enrolled (`ALREADY_ENROLLED`) must still grant the course ticket (enrollment-only parent is the hole).
- Non-functional: files stay ≤200 lines; split reconcile helpers if needed.
- Non-functional: fail closed if offering/code cannot be resolved — do not silently succeed money without ticket.

## Architecture

Reuse `src/modules/entitlement/grant-from-billing.ts`. Do not invent a fifth grant helper unless a path needs expire-only.

| Path | Today | After |
|---|---|---|
| `redeemGiftCode` | mark used then sub upsert; **not** a tx; planCode parsed **after** used (`gift-code-service.ts:67-93`) | validate planCode **first**; one `$transaction`: used + sub + `grantPlanOfferingInTx` |
| free checkout | `createFreeTemporaryCheckoutSession` → `enrollParent` only (`course-checkout-service.ts:315-319`) | same tx: enrollment upsert + `grantCourseOfferingInTx`; if already enrolled, grant anyway |
| `updateAdminUserSubscription` | Subscription extend/cancel/activate | + grant/extend or `expirePlanOfferingInTx` |
| reconcile `SYNC_ENROLLMENTS` / `MARK_SUCCEEDED_AND_SYNC` | `syncEnrollmentsFromPaymentTarget` already has `tx` (`reconcile/route.ts:206-245`) | same loop: `grantCourseOfferingInTx` per `courseId` from `resolveCourseIdsFromCheckoutTarget` |

Admin PATCH that only changes Family+ display names is **out**; map planCode → `offeringCodeForPlan` already in grant-from-billing.

## Related Code Files

- Modify: `src/modules/courses/gift-code-service.ts` — `redeemGiftCode`
- Modify: `src/modules/courses/course-checkout-service.ts` — free/temporary checkout
- Modify: `src/modules/admin/admin-users-management-service.ts` — `updateAdminUserSubscription`
- Modify: `src/app/api/admin/payments/[id]/reconcile/route.ts` — sync path
- Modify: `src/modules/entitlement/grant-from-billing.ts` — only if a missing expire/grant variant is required
- Create: `src/modules/courses/__tests__/gift-code-ticket-grant.test.ts` (or extend existing)
- Create/modify tests next to each service (match existing vitest layout)

## Implementation Steps

1. Use `@/lib/db` prisma. Pass `Prisma.TransactionClient` into grant helpers (already `BillingTx`).
2. `redeemGiftCode`: `payablePlanCodeSchema.safeParse` **before** any write. Then `$transaction`: mark used, subscription upsert, `grantPlanOfferingInTx`. Unknown/unmapped planCode → `DomainError`, gift remains unused.
3. Free checkout: `$transaction` with enrollment upsert (extend `enrollParent` with `tx?` or inline). Always `grantCourseOfferingInTx`. Already-enrolled: skip enrollment create, still grant.
4. Admin subscription: `activate`/`extend` → grant/extend; `cancel` → `expirePlanOfferingInTx`. Expire on cancel. Do not invent dunning UI.
5. Reconcile: inside existing `syncEnrollmentsFromPaymentTarget` loop, grant per courseId. Do not invent a second payload parser.
6. Tests: parent with **no** prior ticket → after op `canAccess` true. Gift invalid plan does not set `usedAt`. Already-enrolled free checkout still creates ticket. Enrollment-only fixture without grant still `canAccess` false.

## Todo

- [x] Gift redeem grants plan ticket in one tx
- [x] Free checkout grants course ticket in one tx
- [x] Admin subscription activate/extend/cancel mutates tickets
- [x] Reconcile sync grants course tickets
- [x] Tests for four paths

## Success Criteria

- [x] Four call sites import grant helpers from `@/modules/entitlement/grant-from-billing`
- [x] No new complete API
- [x] Unit tests fail if grant is omitted (assert `prisma.entitlement` row or `canAccess`)

## Risk Assessment

- Gift `planCode` not in `PLAN_OFFERING_CODE` → today marks used then 422. Signal: usedAt set, no ticket. Response: validate first (step 2).
- Reconcile bundle payload. Response: reuse `resolveCourseIdsFromCheckoutTarget` only.
- Cancel vs grace: expire may cut play immediately. Pre-decided: expire on cancel.
- `enrollParent` outside tx. Signal: grant throws, enrollment remains. Response: tx-aware enroll or inline upsert.

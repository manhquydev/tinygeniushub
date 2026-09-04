---
title: "Phase 2: Offerings + payment grants"
status: done
phase: 2
priority: P1
effort: "1d"
dependencies: [1]
---

# Phase 2: Offerings + payment grants

## Overview

Every successful payment and trial signup **dual-writes** a household ticket. Do not remove `CourseEnrollment` / `Subscription` yet.

## Requirements

- Functional: trial signup grants time-bounded `platform:pass` (or track) ticket; Stripe/mock billing success grants/extends matching offering; PayOS course success grants `course:<id>` ticket
- Non-functional: same webhook idempotency as today (`WebhookEvent @@unique([provider, eventId])` `prisma/schema.prisma:555-567`)

## Architecture

Call `entitlementService.grant` from:

1. `src/modules/identity/service.ts:45-76` after trial `Subscription` create — same tx
2. `src/modules/billing/webhook-service.ts:78-292` after PROCESSED payment — map planCode → offering code
3. `src/modules/courses/course-payment-webhook-service.ts:49-362` after enrollment upsert — grant `course:<courseId>`

Idempotent grant: if ACTIVE ticket exists for `(parentId, offeringId)`, extend `validUntil` if new period is later; do not duplicate.

Do not implement Stripe `mode=subscription` here (phase 4).

## Related Code Files

- Modify: `src/modules/identity/service.ts`, `src/modules/billing/webhook-service.ts`, `src/modules/courses/course-payment-webhook-service.ts`
- Create: `src/modules/entitlement/grant-from-billing.ts` (map plan/course → offering)
- Tests: extend `src/modules/billing/__tests__/webhook-service.test.ts`, `src/modules/identity/__tests__/service.test.ts`

## Implementation Steps

1. Map `PlanCode` → offering codes (trial, yearly, family — still household ticket, not extra seats).
2. Grant inside existing billing tx/lock (`pg_advisory_xact_lock` already in webhook-service.ts:79-81).
3. Grant on PayOS enroll path after unique enrollment upsert.
4. Tests: duplicate webhook does not duplicate ACTIVE tickets.

## Todo

- [x] Trial grant in registerParent tx
- [x] Billing webhook grant/extend
- [x] Course PayOS grant
- [x] Idempotent grant tests

## Success Criteria

- [x] New trial parent has an ACTIVE entitlement
- [x] Duplicate webhook: still one ACTIVE ticket
- [x] CourseEnrollment still created (dual-write)

## Risk Assessment

| Risk | Signal | Response |
|---|---|---|
| Grant after lock released | ticket missing on crash | grant inside same tx as WebhookEvent PROCESSED |
| MONTHLY_STANDARD still unmappable | `stripe-webhook-service.ts:111-136` | phase 2 only grant when planCode maps; monthly stays broken until phase 4 |

## Security Considerations

Never grant from unsigned `src/app/api/webhooks/package-subscription/route.ts:51-107`. Do not wire that route to entitlement. Auth-gate or leave untouched (deny-list in phase 3 if time).

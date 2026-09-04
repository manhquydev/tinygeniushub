# Cook phase 02 — offerings + payment grants

Date: 2026-09-04
Phase: `plans/260904-1103-platform-kernel/phase-02-offering-payment-grants.md` (status: done)
ADR: `docs/decisions/260904-1102-platform-kernel.md`

## Outcome

Every successful trial signup / billing payment / PayOS course payment dual-writes a household ticket. `CourseEnrollment` and `Subscription` still written. `canAccess` callers unchanged.

## Files

Created:

- `src/modules/entitlement/grant-from-billing.ts` (138)
- `src/modules/entitlement/__tests__/grant-from-billing.test.ts` (172)

Modified:

- `src/modules/identity/service.ts` — trial `platform-pass` grant in same `$transaction` as `Subscription` create (`validUntil` = trial end, 7d)
- `src/modules/identity/__tests__/service.test.ts` — asserts ACTIVE ticket, no `childId`
- `src/modules/billing/webhook-service.ts` — `grantPlanOfferingInTx` after `WebhookEvent` PROCESSED, only `SUCCEEDED`, inside `pg_advisory_xact_lock` tx
- `src/modules/billing/__tests__/webhook-service.test.ts` — grant on success; skip duplicate PROCESSED; extend existing ACTIVE
- `src/modules/billing/__tests__/webhook-service.transaction.test.ts` — grant on success; no grant on fail/refund
- `src/modules/courses/course-payment-webhook-service.ts` — `grantCourseOfferingInTx` after `courseEnrollment.upsert` (bundle + single course)

New files ≤200 lines. `webhook-service.ts` 304 / `course-payment-webhook-service.ts` 374 already over 200 before this phase.

## Behavior

- Plan map: `TRIAL` / `YEARLY_STANDARD` / `YEARLY_FAMILY_PLUS` → `platform-pass` (`platform:pass`). Family+ is still one household ticket, not extra seats.
- `MONTHLY_STANDARD` → no grant (phase 4).
- Idempotent: one ACTIVE per `(parentId, offeringId)`. Later `validUntil` extends; earlier/equal does not shrink; no second row.
- Course: upsert offering `course-<id>` / catalogKey `course:<id>` / `ONE_TIME_PROGRAM` / `validUntil` null.
- In-tx helper — does **not** call nested serializable `grantEntitlement` (that API still 409s a second live ticket).
- Unsigned `src/app/api/webhooks/package-subscription` not wired.
- Stripe `mode=subscription` not implemented.

## Verification

```
pnpm exec vitest run \
  src/modules/entitlement/__tests__/entitlement-service.test.ts \
  src/modules/entitlement/__tests__/grant-from-billing.test.ts \
  src/modules/identity/__tests__/service.test.ts \
  src/modules/billing/__tests__/webhook-service.test.ts \
  src/modules/billing/__tests__/webhook-service.transaction.test.ts
✓ 31 tests
```

Project-wide lint/test skipped per request.

Reviewer (`reviewer`): overall_correctness=correct, confidence 0.90. In-tx dual-write, enrollment still created, monthly unmapped, package-subscription/Stripe mode/`canAccess` callers untouched. COOK go.

`code-reviewer` (Opus) rate-limited; used `reviewer`.

## Non-goals held

- No `canAccess` caller cutover (phase 3).
- No Stripe Billing `mode=subscription` (phase 4).
- No grant from unsigned package-subscription webhook.
- `CourseEnrollment` / `Subscription` not removed.

## Unresolved questions

- Split `webhook-service.ts` / `course-payment-webhook-service.ts` (still >200) in a later phase?
- PayOS `payment_already_succeeded` early-return still skips re-grant; same pre-existing crash window as enrollment.
- Apply `20260904110300_add_offering_entitlement` + seed `platform-pass` before trial signup in live DBs.

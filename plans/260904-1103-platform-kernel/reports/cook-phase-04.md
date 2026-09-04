# Cook phase 04 — Stripe recurring pass

Date: 2026-09-04
Phase: `plans/260904-1103-platform-kernel/phase-04-stripe-recurring-pass.md` (status: done)
ADR: `docs/decisions/260904-1102-platform-kernel.md`

## Outcome

Recurring `platform:pass` checkout uses Stripe Checkout `mode=subscription` + precreated Price id. Not `mode=payment`. Not `price_data`. PayOS one-time path untouched.

Missing price id fail-closes in the Stripe adapter (`BILLING_PROVIDER_MISCONFIGURED`). `mock_gateway` unchanged for non-prod.

## Files

Created:

- `src/modules/billing/stripe-recurring-price.ts` (26)
- `src/modules/billing/billing-period.ts` (23)
- `src/modules/billing/stripe-webhook-map.ts` (175)
- `src/modules/billing/__tests__/billing-period.test.ts` (27)

Modified:

- `src/lib/env.ts` — `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY` optional
- `src/modules/billing/providers/stripe-provider.ts` — payable plans → `mode=subscription` + `line_items[0][price]`
- `src/modules/billing/providers/types.ts` — `stripePriceId?`
- `src/modules/billing/checkout-service.ts` — pass `platform-pass` offering price
- `src/modules/billing/stripe-webhook-service.ts` — signature only; re-exports mapper
- `src/modules/billing/webhook-service.ts` — `MONTHLY_STANDARD`, `periodEnd`, `subscription_deleted`, addMonths, GRACE/EXPIRED tickets
- `src/modules/entitlement/grant-from-billing.ts` — monthly → `platform-pass`; GRACE live tickets; expire helper
- `prisma/seed.ts` — seed RECURRING `stripePriceId` from env when set

New TS ≤200. `webhook-service.ts` 331 / `env.ts` 270 already over before this phase.

## Behavior

- Price resolve: env plan price first (`MONTHLY` vs `YEARLY`), else `Offering.stripePriceId`. Empty → 500, not `price_data`.
- `YEARLY_FAMILY_PLUS` uses `STRIPE_PRICE_ID_YEARLY`.
- Checkout session + `subscription_data[metadata]` copy `parentId` / `parentEmail` / `planCode`.
- Mapper: `invoice.paid` / checkout succeeded → grant/extend; `invoice.payment_failed` / `subscription.updated` past_due|unpaid → GRACE 3d; `customer.subscription.deleted` / canceled → EXPIRED. Empty invoice `metadata: {}` does not shadow `subscription_details.metadata.planCode`.
- Period: Stripe `current_period_end` if present; else `addMonths` for `MONTHLY_STANDARD`, `addYears` otherwise.
- Package leftover codes still `mode=payment` + `price_data` (not kernel RECURRING).

## Verification

```
pnpm exec vitest run \
  src/modules/billing/providers/stripe-provider.test.ts \
  src/modules/billing/__tests__/stripe-webhook-service.test.ts \
  src/modules/billing/__tests__/checkout-service.test.ts \
  src/modules/billing/__tests__/webhook-service.test.ts \
  src/modules/billing/__tests__/webhook-service.transaction.test.ts \
  src/modules/billing/__tests__/billing-period.test.ts \
  src/modules/entitlement/__tests__/grant-from-billing.test.ts
✓ 48 tests
```

Full e2e skipped per request.

Reviewer (`reviewer`): first pass overall_correctness=incorrect — empty invoice `metadata: {}` stole planCode. Fixed: accept metadata only when `planCode` is a non-empty string. Re-test 48 pass. COOK go.

`code-reviewer` (Opus) rate-limited; used `reviewer`.

## Non-goals held

- No dunning email UI.
- PayOS not used for recurring.
- content/learning/abeka not edited.
- Did not silently keep `mode=payment` for RECURRING.

## Unresolved questions

- Live Stripe account must have VND recurring Prices; checkout 500 if ids empty. Not verified against a live Stripe VND subscription Price.
- `YEARLY_FAMILY_PLUS` shares `STRIPE_PRICE_ID_YEARLY` unless offering price is set.
- Split `webhook-service.ts` / `env.ts` (still >200) later?

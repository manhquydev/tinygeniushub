---
title: "Phase 4: Stripe recurring pass"
status: done
phase: 4
priority: P1
effort: "1d"
dependencies: [2]
---

# Phase 4: Stripe recurring pass

## Overview

Recurring offering uses Stripe Billing **subscription** (auto-charge). Stop using `mode=payment` for `Offering.kind=RECURRING`. PayOS stays one-time.

## Requirements

- Functional: checkout for `platform:pass` creates Stripe Subscription; `invoice.paid` / `customer.subscription.updated` extend ticket `validUntil`; `customer.subscription.deleted` or unpaid → GRACE then EXPIRED
- Functional: MONTHLY_STANDARD maps to monthly period (`addMonths`), not `addYears` (`webhook-service.ts:182-183`)
- Non-functional: mock_gateway still works in non-prod (`providers/index.ts:7-22`)

Today `src/modules/billing/providers/stripe-provider.ts:50` hardcodes `mode=payment` and ad-hoc `price_data` VND (`:58-60`). `src/lib/env.ts` has `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRETS` only — **no** `STRIPE_PRICE_*`.

Recurring checkout **must** use Stripe `mode=subscription` + precreated `Offering.stripePriceId` (or new env `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY` added to `src/lib/env.ts` with fail-closed when `BILLING_PROVIDER=stripe` and kind=RECURRING). Do not reuse `price_data` one-shot form for subscriptions.

If Stripe cannot bill VND subscriptions with the live account, **stop phase 4** and document the blocker — do not silently keep `mode=payment`.

Webhook: extend `src/modules/billing/stripe-webhook-service.ts` payablePlanCodeSchema (`:111`) to include `MONTHLY_STANDARD`; handle `invoice.paid`, `customer.subscription.*`. Do not throw 400 on monthly (`STRIPE_WEBHOOK_UNMAPPABLE` `:136`).

Failed charge: entitlement GRACE (default 3 days) on `invoice.payment_failed`; EXPIRED on `customer.subscription.deleted` after grace.

Do not build dunning email UI. Do not use PayOS for recurring.

## Related Code Files

- Modify: `src/modules/billing/providers/stripe-provider.ts`, `src/modules/billing/checkout-service.ts`, `src/modules/billing/stripe-webhook-service.ts`, `src/modules/billing/webhook-service.ts`, `src/lib/env.ts`
- Tests: `src/modules/billing/providers/stripe-provider.test.ts`, `src/modules/billing/__tests__/stripe-webhook-service.test.ts`, `checkout-service.test.ts`

## Implementation Steps

1. Add Stripe Price id fields to env + Offering; seed `platform:pass` RECURRING.
2. Checkout branch: RECURRING → `mode=subscription` + `line_items[0][price]=priceId`.
3. Map subscription `current_period_end` → entitlement.validUntil; monthly uses month not `addYears` (`webhook-service.ts:182-183`).
4. Tests: recurring form is subscription; monthly metadata maps; missing price id fail-closed in stripe mode.


## Todo

- [x] Stripe subscription checkout
- [x] invoice.paid extends ticket
- [x] monthly period math
- [x] GRACE on payment_failed
- [x] tests

## Success Criteria

- [x] Recurring checkout is not `mode=payment`
- [x] Monthly webhook does not throw STRIPE_WEBHOOK_UNMAPPABLE
- [x] One-time course PayOS path unchanged

## Risk Assessment

| Risk | Signal | Response |
|---|---|---|
| Live Stripe price IDs missing | checkout 500 | mock_gateway in dev; fail closed in prod if price id empty |
| Old yearly one-shot customers | no subscription id | leave existing PaymentRecord; only new checkouts use Billing |

## Security Considerations

Webhook signature still HMAC (`stripe-webhook-service.ts:76-108`). No unsigned package-subscription grants.

# Phase 7: Stripe Product Names

## Context Links
- Scout report: lines 208–213
- `src/modules/billing/providers/stripe-provider.ts`

## Overview
- **Priority**: P1 (High)
- **Status**: completed (2026-05-08)
- **Effort**: ~0.5h
- Update 2 Stripe product display names in code only.
- **Do NOT** update Stripe dashboard — the product names there are managed by code during checkout session creation (they're passed as `product_data.name`).

## Files to Modify

### `src/modules/billing/providers/stripe-provider.ts`

| Line | Find | Replace |
|------|------|---------|
| 17 | `"Cung Con Tu Hoc - Family Plus (Yearly)"` | `"TinyGenius Hub - Family Plus (Yearly)"` |
| 20 | `"Cung Con Tu Hoc - Standard (Yearly)"` | `"TinyGenius Hub - Standard (Yearly)"` |

Full function for context:
```typescript
function getPlanDisplayName(planCode: CreateCheckoutSessionInput["planCode"]) {
  if (planCode === "YEARLY_FAMILY_PLUS") {
    return "TinyGenius Hub - Family Plus (Yearly)";  // ← changed
  }
  return "TinyGenius Hub - Standard (Yearly)";        // ← changed
}
```

## Implementation Steps

1. Edit `src/modules/billing/providers/stripe-provider.ts` — replace both strings.
2. Check if `"Cung Con Tu Hoc"` appears elsewhere in billing code:
   ```bash
   rg "Cung Con Tu Hoc" src/modules/billing/
   ```
3. If there are other billing providers (PayOS, mock gateway) with similar display names, update those too.
4. `pnpm build` — verify no errors.

## Acceptance Criteria
- [x] `rg "Cung Con Tu Hoc" src/modules/billing/` returns 0 results
- [x] `pnpm build` succeeds
- [x] Stripe checkout page shows "TinyGenius Hub - Family Plus (Yearly)" as product name

## Important Note
- **Stripe Dashboard**: The product names shown on Stripe's dashboard are set at product creation time in Stripe, NOT by this code. This code sets `product_data.name` in the Checkout Session, which appears on the checkout page itself. To update existing Stripe product names in the Stripe dashboard, go to Stripe Dashboard → Products and edit manually. This is a separate operational step.

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Stripe returns old name for existing subscriptions | The name appears on checkout page only. Existing subscriptions are unaffected. |
| Other billing provider has hardcoded name | Grep `src/modules/billing/` for "Cung Con Tu Hoc" to confirm only Stripe provider has it. |

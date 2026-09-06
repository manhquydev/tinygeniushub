---
phase: 4
title: "Offering toggle + tests"
status: pending
priority: P1
effort: "6h"
dependencies: [1, 2]
---

# Phase 4: Offering toggle + tests

## Overview

Minimal SKU control: list seed Offerings, set `active`. New grants refuse inactive offerings. Existing live tickets still play. Regression tests for phases 1–3. Not a Catalog CMS.

## Requirements

- Functional: `GET /api/admin/offerings` lists code, kind, catalogKey, active, stripePriceId (nullable).
- Functional: `PATCH /api/admin/offerings/:id` `{ active: boolean }` SUPER_ADMIN.
- Functional: `grantOfferingInTx` (or callers) refuse inactive offering with DomainError.
- Functional: existing ACTIVE/GRACE tickets ignore offering.inactive for `canAccess`.
- Tests: grant holes (phase 1), household tickets (phase 2), Abeka 401 + unsigned webhook (phase 3), offering inactive blocks new grant.
- Docs: one sentence in `docs/platform-kernel.md` cutover line if it still says dual-read for kernel learn (learn is already ticket-only). Do not rewrite README/PDR.

## Architecture

No new Catalog table. `Offering` already exists.

```
grant*InTx
  load offering by code
  if !offering.active && action is create/extend-from-zero → throw
  expire still allowed
```

Admin UI: small panel on operations page (already payments/webhooks) — list + toggle. Do not add a 17th nav module.

## Related Code Files

- Modify: `src/modules/entitlement/grant-from-billing.ts` — active check
- Create: `src/modules/admin/admin-offering-service.ts`
- Create: `src/app/api/admin/offerings/route.ts`
- Create: `src/app/api/admin/offerings/[id]/route.ts`
- Modify: `src/components/admin/operations/*` — add offerings section
- Modify: `src/modules/entitlement/__tests__/grant-from-billing.test.ts` (or sibling)
- Modify: `docs/platform-kernel.md` only if a sentence is now false
- Do not create `src/modules/catalog/`

## Implementation Steps

1. Active check inside `grantOfferingInTx` so all callers inherit.
2. Admin list/patch services + routes; auth match payments GET vs security PATCH (SUPER_ADMIN for PATCH).
3. Operations UI section: table of offerings, toggle.
4. Tests as in Success Criteria.
5. Sweep docs/platform-kernel.md dual-read sentence for **learn** path only.

## Todo

- [x] grant refuses inactive offering
- [x] GET/PATCH admin offerings
- [x] Operations toggle UI
- [x] Regression tests phases 1–3
- [x] Kernel contract sentence if stale

## Success Criteria

- [x] Inactive offering: new gift/admin grant fails; existing ticket `canAccess` still true
- [x] No Catalog CMS, no TrackCode enum migration
- [x] `pnpm exec vitest` on the new/changed test files passes
- [x] No new catalog complete route

## Risk Assessment

- `canAccess` currently does not join `Offering.active`. Changing it would cut live kids when operator toggles off. Pre-decided: **do not** gate `canAccess` on active — only new grants.
- Seed offerings missing in a DB. Signal: GET empty. Response: do not auto-insert in this route; seed remains `db:seed`.
- Stripe `stripePriceId` null. Toggle still allowed; checkout fail-closed stays billing's problem.

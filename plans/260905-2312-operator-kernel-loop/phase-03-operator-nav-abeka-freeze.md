---
phase: 3
title: "Operator nav + Abeka freeze"
status: pending
priority: P1
effort: "6h"
dependencies: []
---

# Phase 3: Operator nav + Abeka freeze

## Overview

Few humans. Nav is a 16-module staff console. Abeka is a second kernel. Collapse operator IA; freeze Abeka mutating/unauth surfaces so they cannot be the learning kernel.

Independent of phase 2. Can run parallel after phase 1.

## Requirements

- Functional: operator nav shows: overview, users, content, operations, security, log, impersonation. Hide from default nav: blog, organizations, gift-codes, courses-as-SKU-admin (keep `/admin/content` for lessons). Staff page URL-only.
- Functional: **do not delete** `/api/admin/courses/**` — hide nav only. Content picker may still call those APIs.
- Functional: spoofable Abeka GETs (`parentId` query, no session) → 401: `videos/check-access`, `videos/accessible`, `progress/watch` GET, unauth streak/badge writes.
- Functional: `POST /api/curriculum/complete` **already** `requireParentAndOwnedChild` (`complete/route.ts:27`). Do not re-auth. Leave as leftover catalog complete (out of kernel). No new work unless auth is bypassable.
- Functional: `POST /api/webhooks/package-subscription` **already** HMAC via `isValidBillingSignature` (`route.ts:93-97`). Do **not** reimplement. Add/keep a test that unsigned → 401/404. Still **no** `Entitlement` grant from this webhook.
- Non-functional: do not delete Abeka tables. No Abeka admin.

## Architecture

Nav: flag on `ADMIN_MODULE_CATALOG` e.g. `operator: true` or a denylist `OPERATOR_HIDDEN_KEYS`. `getVisibleAdminModules` filters hidden unless `?all=1` is **not** added — just hide. Super-admin still uses same list (one person).

Abeka: prefer **401/404 on route**, not a new access-control rewrite. `src/lib/abeka/access` stays unused by kernel player.

Package webhook: HMAC exists. This phase only regression-tests unsigned body. Do not add WebhookEvent rows or ticket grants.

## Related Code Files

- Modify: `src/components/admin/admin-module-catalog.ts`
- Modify: `src/app/(main)/admin` layout/nav consumer of `getVisibleAdminModules`
- Confirm only: `src/app/api/curriculum/complete/route.ts` (already authed)
- Modify: `src/app/api/abeka/progress/watch/route.ts` GET+POST
- Modify: `src/app/api/abeka/videos/accessible/route.ts`
- Modify: `src/app/api/abeka/videos/check-access/route.ts`
- Modify: `src/app/api/curriculum/streak/update/route.ts` and GET streak if write-on-GET
- Modify: `src/app/api/curriculum/badges/check/route.ts` and view
- Modify: `src/app/api/abeka/plans/journeys/route.ts`
- Test only: `src/app/api/webhooks/package-subscription/route.ts` (HMAC already at `:93`)
- Tests: route-level or service-level 401 cases

## Implementation Steps

1. Add `operatorVisible` (default true) to catalog; set false on blog, organizations, gift-codes, courses, feature-flags, jules, analytics-if-noisy. Keep users/content/operations/security/log/impersonation/overview.
2. Filter in `getVisibleAdminModules`.
3. Auth-gate remaining spoofable Abeka GETs and unauth writes listed above. Skip `curriculum/complete` unless a bypass is found.
4. Write-on-GET streak: require parent or make GET read-only.
5. Package webhook: test unsigned → 401/404 production mapping. Do not rewrite HMAC.
6. Tests: unauth video check-access → 401; unsigned package webhook → 401/404; `curriculum/complete` without session still 401 (already).

## Todo

- [x] Operator nav filter
- [x] Abeka/curriculum auth freeze
- [x] Package webhook unsigned test (HMAC already live)
- [x] Tests 401

## Success Criteria

- [x] Default admin home nav has no Blog / Organizations / Courses SKU
- [x] Unauthenticated Abeka mutate/spoof GET returns 401/404
- [x] Unsigned package-subscription does not write `PackageSubscription` (already HMAC — prove with test)
- [x] Kernel `/api/lessons/:id/complete` unchanged

## Risk Assessment

- Hidden courses admin vs lesson picker. Response: **keep course admin routes**; hide nav only.
- HMAC already live (`isValidBillingSignature`). Do not “fix” unsigned webhook that is signed.
- Curriculum student pages still mock. Out of scope to delete.

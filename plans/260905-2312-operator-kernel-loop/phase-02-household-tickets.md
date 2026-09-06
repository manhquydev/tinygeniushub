---
phase: 2
title: "Household tickets admin"
status: pending
priority: P1
effort: "8h"
dependencies: [1]
---

# Phase 2: Household tickets admin

## Overview

ADR: support sees one household ticket list. Parent `/parent/billing` already lists entitlements. Admin `/admin/users` still shows Subscription/Family+. Replace that pane with tickets. One operator, not a staff team.

## Requirements

- Functional: parent detail API includes entitlements (offering code, catalogKey, kind, status, validFrom, validUntil).
- Functional: SUPER_ADMIN (the operator) can grant (existing offering code), extend `validUntil`, expire a ticket.
- Functional: UI on `/admin/users` detail — ticket table + grant/extend/expire. Stop rendering Family+ plan as access SoT.
- Non-functional: reuse `listEntitlements` if it exists on parent billing; do not duplicate query logic.
- Non-functional: mutations go through `grant*InTx` / `expirePlanOfferingInTx`, not raw `prisma.entitlement.create`.

## Architecture

```
GET  /api/admin/users/[parentId]     + entitlements[]
POST /api/admin/users/[parentId]/tickets
     { offeringCode, action: grant|extend|expire, days? }
```

Auth: existing `requireAdminFromRequest` + SUPER_ADMIN | SUPPORT_AGENT **if already used on subscription PATCH**. Do not add SUPPORT_AGENT workflows; if current subscription PATCH is SUPER_ADMIN-only, keep that. Match `updateAdminUserSubscription` auth exactly.

Do **not** build Offering CMS here (phase 4). Grant only existing Offering.code rows.

## Related Code Files

- Modify: `src/modules/admin/admin-user-service.ts` — `getAdminParentDetail` (`:343`); barrel `src/modules/admin/service.ts` already re-exports it
- Modify: `src/app/api/admin/users/[parentId]/route.ts` (GET already `getAdminParentDetail`)
- Create: `src/app/api/admin/users/[parentId]/tickets/route.ts`
- Create: `src/modules/admin/admin-ticket-service.ts` (keep ≤200 lines)
- Modify: admin users detail client under `src/components/admin/` (pane that PATCHes subscription)
- Keep: `src/app/api/admin/users/[parentId]/subscription/route.ts` unused by UI
- Tests: `src/modules/admin/__tests__/admin-ticket-service.test.ts`

## Implementation Steps

1. Reuse `listEntitlements` (`entitlement-service.ts:100`) — returns **all** statuses. Admin table shows every row; mutate only `ACTIVE`/`GRACE`.
2. Add `entitlements[]` to `getAdminParentDetail` payload.
3. `admin-ticket-service.ts`: grant/extend/expire via grant-from-billing; unknown offeringCode → 400.
4. POST tickets route **copy** `subscription/route.ts`: `assertTrustedOrigin`, `enforceAdminMutationRateLimit`, `requireAdminFromRequest(request, ["SUPER_ADMIN", "SUPPORT_AGENT"])`.
5. Users detail UI: ticket table + 3 actions. Stop Family+ as access headline. Child profiles stay.
6. Tests: list empty; grant platform-pass; expire → `canAccess` false if no other live ticket; unauthenticated POST 401.

## Todo

- [x] Detail DTO includes tickets
- [x] POST grant/extend/expire
- [x] Users UI ticket table
- [x] Hide subscription-as-access UI
- [x] Tests

## Success Criteria

- [x] Operator can grant `platform-pass` to a parent and kid today missions appear (ticket), without CourseEnrollment
- [x] No admin HTTP under `/api/admin/entitlement` duplicate — nest under users
- [x] File sizes ≤200 lines or split

## Risk Assessment

- Two mutate APIs diverge. Response: UI only tickets.
- Granting `course-{id}` for unpublished course. Allow (ops).
- Impersonation unchanged this phase.
- `listEntitlements` includes EXPIRED. Response: show status; do not treat expired as live.

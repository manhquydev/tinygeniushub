---
title: "Phase 9: User-visible API errors"
status: todo
priority: P2
effort: "3h"
dependencies: [1]
---

# Phase 9: User-visible API errors

## Overview
UI shows `error.message` from `fail()`. Messages are hardcoded EN. Localize parent-facing DomainError / route-error strings via `translate(..., locale)` on the server. Need request locale: cookie via `cookies()` + `resolveAppLocale` (same as `request.ts`).

## Related Code Files
- Modify: `src/lib/route-error.ts`
- Modify: parent-facing throws in:
  - `src/modules/caregivers/service.ts`
  - `src/modules/courses/gift-code-service.ts`
  - `src/modules/progress/children-service.ts`
  - `src/modules/entitlement/assert-can-learn.ts`
  - `src/app/api/auth/login/route.ts` (Invalid credentials)
  - `src/app/api/auth/forgot-password/route.ts` success/disabled messages
- Do not rewrite email HTML builders.
- Do not edit auth-form.tsx (phase 05).

## Architecture
Helper `translateError(key)` that reads cookie locale once per request. Prefer passing locale into services only if already request-scoped; otherwise translate at route boundary. KISS: translate at `handleRouteError` / `fail()` call sites in routes when message is static; for DomainError, construct with translated message at throw site if those functions already run in request scope.

If a service is used from worker (no cookie), keep English defaultLocale.

## Implementation Steps
1. Grep `new DomainError(` in listed files; replace message with `translate("errors....", undefined, locale)` when locale available.
2. `route-error.ts` unknown/invalid JSON → `errors.unknown` / new `errors.invalidPayload`.
3. Worker-only paths: skip.

## Todo
- [ ] route-error.ts
- [ ] caregivers/gift/children/entitlement DomainErrors
- [ ] auth login/forgot messages
- [ ] Confirm worker jobs unchanged

## Success Criteria
- [ ] Login failure with vi cookie returns Vietnamese `error.message`
- [ ] Gift code invalid vi → Vietnamese
- [ ] No email template edits

## Risk Assessment
Services without request locale. Signal: tests calling service without cookie get EN — OK (defaultLocale). Response: do not thread locale through domain for workers.

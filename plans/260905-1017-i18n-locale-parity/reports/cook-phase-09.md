# Cook Phase 09 — User-visible API errors

**Plan:** `plans/260905-1017-i18n-locale-parity`  
**Date:** 2026-09-05  
**Files:** `src/lib/route-error.ts`, `src/modules/caregivers/service.ts`, `src/modules/courses/gift-code-service.ts`, `src/modules/progress/children-service.ts`, `src/modules/entitlement/assert-can-learn.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/forgot-password/route.ts`

## Outcome

Phase 09 only. Parent-facing `fail()` / `DomainError` messages go through `cookies()` + `resolveAppLocale` + `translate`. No locale JSON. No auth-form. No email HTML. No worker jobs.

`tgh_locale=vi` → Vietnamese `error.message`. Missing/invalid cookie or non-request (worker/tests) → English `defaultLocale`.

`fail()` still `{ error: { message, details? } }`. No top-level `error.code`. DomainError `code` stays in `details`.

## Wiring

| Surface | Keys |
|---|---|
| `handleRouteError` JSON | `errors.invalidJson` |
| `handleRouteError` Zod | `errors.invalidPayload` |
| `handleRouteError` unknown/500 | `errors.unknown` |
| `handleRouteError` DomainError | passthrough already-translated `error.message` |
| login 401 DomainError (`INVALID_CREDENTIALS` + `AUTH_API_ERROR`) | `errors.invalidCredentials` |
| login 429 | `errors.loginRateLimited` |
| login email verify | `errors.emailNotVerified`, `errors.emailNotVerifiedDeliveryFailed` |
| forgot success / rate-limit cover | `errors.passwordResetRequested` |
| forgot 503 not enabled | `errors.passwordResetNotEnabled` |
| caregivers DomainError | `errors.parentNotFound`, `caregiverLimitReached`, `caregiverAlreadyExists`, `caregiverInviteExists`, `caregiverInviteNotFound`, `caregiverInviteInvalid`, `caregiverInviteAccepted`, `caregiverInviteExpired` |
| gift-code DomainError | `errors.giftCodeNotFound`, `giftCodeUsed`, `giftCodeExpired`, `giftCodePlanInvalid` |
| children DomainError | `errors.profileLimitReached`, `profileLimitRetryRequired`, `childNotFound` |
| `assertCanLearn` | `errors.childNotFound`, `lessonNotFound`, `trialLessonRestricted`, `learnAccessDenied` |

Helper: `translateError(key)` in `route-error.ts`. `cookies()` throw → `defaultLocale`.

## Verification

- Throwaway smoke (`pnpm tsx`): 27 keys EN+VI present. VI has diacritics; EN does not.
- No cookie: `translateError("errors.invalidCredentials")` = `Invalid credentials.`
- `handleRouteError` JSON → EN `Invalid JSON payload.` status 400. Zod → EN `Invalid request payload.` 400. Unknown Error → EN `Something went wrong.` 500. No top-level `error.code`.
- DomainError passthrough: VI `Mã quà tặng không hợp lệ.` status 404, `details.code=GIFT_CODE_NOT_FOUND`.
- Catalog VI: login `Thông tin đăng nhập không đúng.`; gift `Mã quà tặng không hợp lệ.`
- `normalizeLoginError` remaps every 401 DomainError (not only `AUTH_API_ERROR`) so `authenticateParent` `INVALID_CREDENTIALS` is localized.
- `pnpm exec eslint` exclusive files: clean.
- No Vietnamese diacritics in exclusive `src/` files.
- `src/worker/**` does not import exclusive services. Worker jobs untouched.
- Project-wide tests skipped per cook instruction.

## File size

`route-error.ts` 83. `caregivers/service.ts` 301 (was 300). `login/route.ts` 230. Others ≤183. Exclusive ownership forbids splits.

## Non-goals honored

Did not edit `locales/*/translation.json`, `auth-form.tsx`, email builders, worker jobs, `http.ts`. Did not add `error.code` on `fail()`. Did not thread locale through domain for workers.

## Unresolved

- Auth-form EN map still keys off some pre-catalog English strings. VI API messages passthrough (phase 05). EN Zod/JSON now catalog with period (`Invalid request payload.`) so the exact `"Invalid request payload"` field-path branch may miss; 429 still uses status. Phase 10.
- `handleRouteError` is async. Callers already `return` it from async routes.
- `caregivers/service.ts` remains over 200 lines.

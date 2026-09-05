# Cook Phase 05 — Auth forms

**Plan:** `plans/260905-1017-i18n-locale-parity`  
**Date:** 2026-09-05  
**Files:** `src/components/auth-form.tsx`, `src/components/forgot-password-form.tsx`, `src/components/reset-password-form.tsx`, `src/components/admin-login-form.tsx`

## Outcome

Phase 05 only. Inner auth forms consume catalog keys. Shells, locale JSON, `http.ts` untouched. Submit URLs and auth logic unchanged.

`tgh_locale=vi` → form labels/buttons/client errors Vietnamese. `tgh_locale=en` → English.

## Wiring

| File | Namespace |
|---|---|
| `auth-form.tsx` | `useTranslations("auth.form")` + `errors` |
| `forgot-password-form.tsx` | `auth.forgot` + `errors` |
| `reset-password-form.tsx` | `auth.reset` + `errors` |
| `admin-login-form.tsx` | `admin.login.form` + `errors` |

Signup legal line: `t.rich("signup.legal.agree")` with `{terms|privacy|cookie}` as Link nodes. Catalog still `{token}` only.

## `formatAuthError` / message map

`fail()` is `{ message, details }` — **no `error.code`**. Dropped `details.code` branches (`EMAIL_NOT_VERIFIED`, `EMAIL_EXISTS`).

Order:

1. Known English `error.message` → catalog key
2. Non-English (Vietnamese / diacritics) → show `error.message`
3. Else → `errors.unknown`

Still use `details.issues[0].path` for 400 `"Invalid request payload"` field keys (`email` / `password` / `displayName` / `legalAccepted`). Still use 429 `Retry-After` / `details.retryAfterMs` for `rateLimitedWithSeconds`. Not `error.code`.

500 login/signup still `router.push("/auth-fail")`.

Forgot/reset success: non-English API `data.message` shown as-is; English → `successDefault`.

## Verification

- 87 catalog keys present EN+VI (node walk). Missing: 0.
- Translator smoke (vi): `"Invalid credentials"` → `Email hoặc mật khẩu không đúng.`; unknown English → `Đã có lỗi xảy ra.`; Vietnamese passthrough kept.
- `pnpm exec eslint` on the 4 files: clean.
- No diacritics in the 4 files.
- `pnpm check:i18n` still fails on **unrelated** files (`site-footer.test.tsx`, `translator.test.ts`, seed scripts). Not this phase.
- Project-wide tests skipped per cook instruction.

## File size

`auth-form.tsx` 328 lines (was 334). Plan ≤200. Exclusive ownership forbids a helper file. Forgot 144 / reset 196 / admin 142.

## Non-goals honored

No auth page shells. No `locales/*/translation.json`. No `http.ts`. No `generated.*`.

## Unresolved

- Phase 09 may change English API strings; client map is fallback for EN still in flight.
- `auth-form.tsx` remains over 200 lines.

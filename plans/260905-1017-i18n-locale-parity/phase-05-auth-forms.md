---
title: "Phase 5: Auth forms"
status: todo
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 5: Auth forms

## Overview
Auth shells already translate; inner forms hardcoded EN → MIXED login/signup.

## Related Code Files
- Modify: `src/components/auth-form.tsx`
- Modify: `src/components/forgot-password-form.tsx`
- Modify: `src/components/reset-password-form.tsx`
- Modify: `src/components/admin-login-form.tsx`

Do not edit `src/app/(main)/auth/**/page.tsx` shells.

## Implementation Steps
1. `useTranslations("auth.form"|"auth.forgot"|"auth.reset"|"admin.login.form")`.
2. `formatAuthError` maps known **message strings** to keys; unknown → `errors.unknown`.
3. `fail()` in `src/lib/http.ts:24-39` returns `{ ok:false, error:{ message, details } }` — **no `error.code`**. Do not add a code field.
4. Do not change submit URLs or auth logic.

## Todo
- [ ] auth-form login+signup
- [ ] forgot + reset
- [ ] admin login form body

## Success Criteria
- [ ] `/auth/login` + vi: fields/buttons/errors Vietnamese
- [ ] Admin login body follows locale

## Risk Assessment
Message-map breaks if phase 09 changes English source strings. Coordinate: phase 09 translates at server so vi cookie already returns VI `error.message`; client map is fallback for en messages still in flight. Prefer displaying `error.message` when it is already non-English, else map.

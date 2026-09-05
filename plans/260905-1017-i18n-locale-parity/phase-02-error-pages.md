---
title: "Phase 2: Error pages"
status: todo
priority: P1
effort: "3h"
dependencies: [1]
---

# Phase 2: Error pages

## Overview
Localize 404/500/loading. User-reported: 500 not converted; nested 500 MIXED with i18n nav.

## Requirements
- Functional: copy follows `tgh_locale`; global-error `html lang` matches copy.
- Non-functional: stay client where `reset`/`useRouter` required.

## Architecture
- `not-found.tsx` + `(main)/error.tsx`: `useTranslations("specialPages.notFound"|"specialPages.error")` + `common.actions` if needed. Root layout already wraps provider (`src/app/layout.tsx`).
- `global-error.tsx`: owns `<html>`/`<body>`. No provider. Parse `tgh_locale` from `document.cookie`, `resolveAppLocale`, `translate(..., locale)`. Default en. Never hardcode `lang="vi"`.
- `global-loader.tsx`: `useTranslations("specialPages.loading")`.

Do not call `cookies()` inside `global-error` (client, broken tree).

## Related Code Files
- Modify: `src/app/global-error.tsx`
- Modify: `src/app/not-found.tsx`
- Modify: `src/app/(main)/error.tsx`
- Modify: `src/app/loading.tsx` (only if it has copy; else loader only)
- Modify: `src/components/global-loader.tsx`
- Create: none unless extracting `readLocaleCookie()` next to translator would exceed 200 lines — then `src/i18n/client-locale.ts` (this phase owns it).

## File inventory
| File | Action | Size | Tests |
|------|--------|------|-------|
| global-error.tsx | modify | ~4k | e2e phase 10 |
| not-found.tsx | modify | ~3k | e2e phase 10 |
| (main)/error.tsx | modify | ~4k | e2e phase 10 |
| global-loader.tsx | modify | small | unit optional |

## Implementation Steps
1. Replace hardcoded EN clusters with t() keys from phase 01.
2. global-error: cookie → locale → translate + `lang={locale}`.
3. Keep existing images/paths. Alt text from keys.
4. Nested 500 CTAs: `ctaRetry` / `ctaBack` (not "Come back").

## Todo
- [ ] Wire not-found
- [ ] Wire (main)/error
- [ ] Wire global-error cookie locale
- [ ] Wire global-loader
- [ ] Manual: missing cookie → English

## Success Criteria
- [ ] Cookie vi → Vietnamese 404/500/global-error/loading overlay
- [ ] global-error lang is `vi` or `en` matching cookie, never stale `vi` with EN copy
- [ ] No locale JSON edits

## Test scenario matrix
| Path | Critical |
|------|----------|
| 404 with vi cookie | body Vietnamese |
| nested 500 with vi cookie | error body VI, nav already VI |
| global-error no cookie | EN + lang=en |

## Risk Assessment
global-error cookie parse fails on encoding. Signal: always EN. Response: use same cookie write format as `language-switcher.tsx` (`tgh_locale=vi; path=/`).

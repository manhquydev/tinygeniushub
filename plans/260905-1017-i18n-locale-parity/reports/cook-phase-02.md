# Cook Phase 02 — Error pages

**Plan:** `plans/260905-1017-i18n-locale-parity`  
**Date:** 2026-09-05  
**Files:** `src/app/global-error.tsx`, `src/app/not-found.tsx`, `src/app/(main)/error.tsx`, `src/components/global-loader.tsx`  
**Unchanged:** `src/app/loading.tsx` (no copy; renders `GlobalLoader`)  
**Not created:** `src/i18n/client-locale.ts` (global-error 111 lines, under 200)

## Outcome

Phase 02 only. 404 / nested 500 / global-error / loading overlay follow `tgh_locale`. No locale JSON edits. No other `src/` files.

## Wiring

| File | Mechanism | Keys |
|---|---|---|
| `not-found.tsx` | `useTranslations("specialPages.notFound")` | badge, imageAlt, title, subtitle, ctaHome, ctaBack |
| `(main)/error.tsx` | `useTranslations("specialPages.error")` | badge, imageAlt, title, subtitle, ctaRetry, ctaBack |
| `global-error.tsx` | `document.cookie` → `resolveAppLocale` → `translate(..., locale)` | badge, imageAlt, title, subtitle, ctaReload, ctaHome |
| `global-loader.tsx` | `useTranslations("specialPages.loading")` | ariaLabel, imageAlt, title, subtitle |
| `loading.tsx` | none | chrome only |

`global-error`: no NextIntl provider, no `cookies()`. `<html lang={locale}>`. Missing/invalid cookie → `en`. Never `lang="vi"`. Nested 500 CTAs `ctaRetry` / `ctaBack` (not "Come back"). Image paths unchanged; alt from keys.

## Cookie parse

Same write format as `language-switcher.tsx` (`tgh_locale=vi; path=/`). Read: split `document.cookie`, `decodeURIComponent` in try/catch, `resolveAppLocale`. Decode fail / missing / empty / unsupported → `en`.

## Verification

Throwaway import of `translate` + cookie helper (not project-wide suite):

- 22/22 catalog leaves present; EN ≠ VI. Sample VI: notFound title `Không tìm thấy trang bạn cần`; error ctaBack `Quay lại`; globalError title `Hệ thống đang gặp sự cố tạm thời`; loading title `Đang chuẩn bị hành trình học...`.
- Cookie: missing/empty/`fr`/malformed `%E0%A4%A` → `en`; `tgh_locale=vi` (alone or with other cookies) → `vi`.
- Diacritics grep on exclusive files: none.
- Line counts: 111 / 69 / 76 / 15 / 51, all ≤200.

`code-reviewer` (Opus) rate-limited. `reviewer` PASS (confidence 0.93). Known: global-error SSR has no `document` so first paint is `en`; client then matches cookie. Contracted; no `cookies()` in that tree.

## Non-goals honored

No `locales/*.json`. No other `src/` UI. No `generated.*`. No URL prefixes. Dev-only `digest:` in nested error left as debug, not catalog copy.

## Unresolved

None blocking. E2E 404/500 coverage is phase 10.

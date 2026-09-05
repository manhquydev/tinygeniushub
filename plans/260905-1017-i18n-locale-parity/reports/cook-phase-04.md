# Cook Phase 04 — Parent managers + courses

**Plan:** `plans/260905-1017-i18n-locale-parity`  
**Date:** 2026-09-05  
**Mode:** code (accepted plan), Phase 4 only, `--no-test` for project-wide suite

## Outcome

Exclusive UI wired to catalog keys. `tgh_locale=vi` drives manager/panel/courses chrome through next-intl / `translate()`. No locale JSON edits. Checkout banner untouched (phase 07). Children/reports page headers untouched.

`translate("parent.coursesPage.heading", undefined, "vi")` → `Quản lý khóa học đã mua`.

## Files

| File | Namespace | Pattern |
|---|---|---|
| `src/components/children-manager.tsx` | `parent.childrenManager` | `useTranslations` |
| `src/components/caregiver-manager.tsx` | `parent.caregiver` | `useTranslations` + `useLocale` |
| `src/components/reports-panel.tsx` | `parent.reportsPanel` | `useTranslations` + `useLocale` |
| `src/components/weekly-progress-chart.tsx` | `parent.reportsPanel.chart` | `useTranslations` |
| `src/app/(main)/parent/courses/page.tsx` | `parent.coursesPage` | `getLocale` + `translate(..., locale)` |

Forbidden untouched: `course-checkout-status-banner.tsx`, `locales/*/translation.json`, parent children/reports page headers.

## Dates / currency

`locale === "vi" ? "vi-VN" : "en-US"`. Title sort collation follows locale (`vi` / `en`). VND uses `Intl.NumberFormat` + `currencySuffix`.

## Residual accepted

- `KID_AVATAR_OPTIONS` `label` / `description` (`Basic Fox Cub` etc.)
- `CourseCheckoutStatusBanner` copy (phase 07)
- API `body.error?.message` (phase 09)

## Verification

- Catalog smoke (15 keys): EN ≠ VI except `currencySuffix` (`₫` both). No missing keys (no key-path fallback).
- `tsc` on exclusive files: no errors. Repo tsc still fails in phase 07 filter files (`AGE_GROUP_LABELS` etc.) — out of scope.
- Diacritics grep on exclusive files: empty.
- Reviewer (`reviewer` agent; `code-reviewer` Opus rate-limited): **9/10**. No critical. Applied warning: overall-progress value now `card.percent`.

Project-wide tests skipped per cook instruction.

## Unresolved

None blocking. Checkout banner still EN until phase 07.

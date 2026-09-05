---
title: "i18n locale parity"
description: "Wire leftover hardcoded EN/VI-mix UI to next-intl so tgh_locale=vi is Vietnamese without mixed English."
status: pending
priority: P1
effort: "3d"
branch: chore/github-security-scanning
tags: [feature, frontend, i18n, parallel]
blockedBy: []
blocks: []
created: 2026-09-05
---

# i18n locale parity

## Overview

Cookie locale `tgh_locale` (`en` default, `vi` secondary) already drives nav/footer/cookie/legal/parent.dashboard chrome. Audit 2026-09-05: 404/500, dashboard nested panels, auth forms, kid leftover VI, courses/blog, shared chrome, API `error.message` stay hardcoded English (or MIXED). Plan wires those surfaces to semantic catalog keys. No URL prefix. `defaultLocale` stays `en`. Vietnamese copy lives only in `locales/*/translation.json` (`pnpm check:i18n` bans diacritics in `src/`).

Mode: `--parallel`. Phase 01 owns both locale JSON files. Later phases consume keys only — never edit `translation.json`. Missing key → stop, do not invent `generated.*` hashes.

## Brainstorm contract

- **Outcome:** `tgh_locale=vi` → in-scope UI Vietnamese, no mixed EN. `tgh_locale=en` → English. 404/500 and `/parent/dashboard` switch.
- **Constraints:** next-intl cookie; `translate()` / `useTranslations()`; files ≤200 lines; exclusive file ownership; kernel ADR untouched.
- **Non-goals:** locale URL prefixes; rewrite `generated.*`; dead homepage `section-*.tsx`; CMS `titleVi` content; change `defaultLocale`; child login; admin CRUD EN-only staff panels; transactional email rewrite beyond in-app/API strings the UI shows.
- **Acceptance:** listed pages switch language; e2e covers 404/500 + dashboard mix; `html lang` matches copy on global-error.

## Scope Challenge

- Existing: `src/i18n/*`, `locales/{en,vi}/translation.json`, `specialPages` for offline/maintenance/auth-fail/session-expired, `parent.dashboard.*` chrome, `tests/e2e/language-switching.spec.ts`.
- Requested: convert unconverted + unmix EN/VI from audit, then cook via Herdr.
- Complexity: ~40 files, 0 new services, 10 phases (01 sequential; 02–07 parallel).
- Selected mode: HOLD SCOPE.

## Cross-Plan Dependencies

None. `260904-1103-platform-kernel` is entitlement/billing, different files.

## File ownership (exclusive)

| Phase | Owns | Forbidden |
|-------|------|-----------|
| 01 | `locales/en/translation.json`, `locales/vi/translation.json` | all `src/` UI |
| 02 | `global-error.tsx`, `not-found.tsx`, `(main)/error.tsx`, `loading.tsx`, `global-loader.tsx` | locale JSON |
| 03 | `daily-activity-feed.tsx`, `daily-goal-setter.tsx`, `referral-claim-form.tsx`, `dashboard-referral-section.tsx` | locale JSON |
| 04 | `children-manager.tsx`, `caregiver-manager.tsx`, `reports-panel.tsx`, `weekly-progress-chart.tsx`, `parent/courses/page.tsx` | locale JSON, `course-checkout-status-banner.tsx` |
| 05 | `auth-form.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx`, `admin-login-form.tsx` | locale JSON |
| 06 | lesson-player panels, lesson-wizard activity-renderer + flow, `KidSharedGardenDashboard.tsx`, `KidSkyGardenScene.tsx`, `SeedPlantingCinematic.tsx`, `kid-mission-panel.tsx`, `kid-navigation-feedback.tsx` | locale JSON |
| 07 | public `/courses` page, mounted `course-detail-*`, `course-filter-utils.ts`, `course-filter-sidebar.tsx`, `course-active-filters.tsx`, `course-sort-select.tsx`, `course-mobile-filter-trigger.tsx`, `course-checkout-status-banner.tsx`, blog pages + `blog-card.tsx` `blog-card-featured.tsx` `blog-sidebar.tsx` `blog-category-labels.ts`, `contact-form.tsx`, `waitlist-form.tsx`, `gift-code-form.tsx` | locale JSON, CMS `titleVi` |
| 08 | `notification-bell.tsx`, `parent-notification-center.tsx`, both parent gates, `ui/calendar.tsx` Close/dialog sr-only if touched, `impersonation-banner.tsx`, `mascot-support-hub.tsx` | locale JSON, daily-goal-setter |
| 09 | `src/lib/route-error.ts`, parent-facing DomainError messages in modules listed in phase file | locale JSON, auth form files |
| 10 | `tests/e2e/language-switching.spec.ts` + focused component tests | production copy files except test fixtures |

## Execution waves (Herdr, max 6 panes/tab)

1. Phase 01 alone.
2. Phases 02–07 parallel (6 panes).
3. Phases 08–09 parallel.
4. Phase 10 after 02–09.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Catalog keys](./phase-01-start.md) | Pending |
| 2 | [Error pages](./phase-02-error-pages.md) | Pending |
| 3 | [Parent dashboard mix](./phase-03-parent-dashboard-mix.md) | Pending |
| 4 | [Parent managers + courses](./phase-04-parent-managers-courses.md) | Pending |
| 5 | [Auth forms](./phase-05-auth-forms.md) | Pending |
| 6 | [Kid lesson leftover](./phase-06-kid-lesson-leftover.md) | Pending |
| 7 | [Marketing courses/blog/forms](./phase-07-marketing-courses-blog-forms.md) | Done |
| 8 | [Shared chrome](./phase-08-shared-chrome.md) | Pending |
| 9 | [User-visible API errors](./phase-09-user-visible-api-errors.md) | Pending |
| 10 | [E2E regression](./phase-10-e2e-regression.md) | Pending |

## Design decisions

1. **404/500 keys** under `specialPages.notFound` / `specialPages.error` / `specialPages.globalError` — same shape as offline/maintenance. Do not reuse API `errors.notFound`.
2. **`global-error.tsx`:** no provider. Read `tgh_locale` from `document.cookie`, `resolveAppLocale`, `translate(key, values, locale)`. Set `<html lang={locale}>`. Missing cookie → `en`.
3. **`(main)/error.tsx` + `not-found.tsx`:** keep client; `useTranslations` (they sit under root `NextIntlClientProvider`).
4. **Dates:** `toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")` using `useLocale()` / passed locale. Stop hardcoding `vi-VN` inside English UI.
5. **Do not consume `generated.*`** for new wires.
6. **Referral ICU:** `dashboard-referral-section.tsx` owned by phase 03. Pass `welcomeOffer`/`rewardVouchers` into `t.rich` / `t()` values. Do not skip.

## Success Criteria

- [ ] `tgh_locale=vi`: 404, nested 500, global-error, `/parent/dashboard` show Vietnamese body (not EN islands)
- [ ] `tgh_locale=en`: those pages English; global-error `lang` is `en` not hardcoded `vi`
- [ ] No new Vietnamese diacritics in `src/` (`pnpm check:i18n`)
- [ ] `pnpm test:e2e:i18n` plus new coverage in phase 10 pass
- [ ] Parallel phases never both edit the same file

## Out of scope

Dead homepage sections, `generated.*` cleanup, `pricing.*`/`forSchools.*` orphan namespaces, blog CMS article body (`titleVi`/`contentHtml`), teacher/admin CRUD, kernel/entitlement, email HTML templates.

Kid garden HUD is **in scope** (phase 06). Checkout banner is **phase 07 only**.

## Red Team Review

### Session — 2026-09-05
Opus `code-reviewer` subagents failed (rate limit). Coordinator ran Security + Failure + Assumption + Scope lenses against source.

**Findings:** 8 (6 accepted, 2 rejected)
**Severity:** 1 Critical, 4 High, 3 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | `CourseCheckoutStatusBanner` dual-owned by 04 and 07 | Critical | Accept | plan ownership, phase 04/07 |
| 2 | `getBlogCategoryDisplayName` callers include cards/sidebar not listed | High | Accept | phase 07 |
| 3 | `fail()` has no `error.code` (`src/lib/http.ts:24-39`) | High | Accept | phase 05 |
| 4 | `course-filter-utils` labels used by sidebar/sort/active-filters | High | Accept | phase 07 |
| 5 | Phase 06 cut kid garden HUD — illegal HOLD-SCOPE cut | High | Accept | phase 06 |
| 6 | Phase 10 dashboard e2e assumes auth; language-switching.spec is guest-only | Medium | Accept | phase 10 |
| 7 | XSS via translate interpolation | Medium | Reject | React text nodes escape; no evidence |
| 8 | Decision 6 ICU fix vs phase 03 file list mismatch | Medium | Accept | phase 03 owns referral section |

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01..10 (after this edit pass)
- Decision deltas checked: 6
- Reconciled stale references: banner owner, garden HUD, fail() code, blog callers, ICU file
- Unresolved contradictions: 0

## Validation Log

### Session — 2026-09-05
User authorized autonomous gates until clean then Herdr cook. No interview fork. Locked decisions: defaultLocale=en; 404/500 under specialPages; global-error reads cookie; garden HUD in phase 06; banner exclusive phase 07; fail() message-only.

### Verification Results
- **Tier:** Full (10 phases)
- **Claims checked:** 12
- **Verified:** 12 | **Failed:** 0 | **Unverified:** 0
- `src/app/global-error.tsx:23` `<html lang="vi">` + EN copy
- `src/app/(main)/error.tsx:29` hardcoded EN nested 500
- `src/app/not-found.tsx:21` hardcoded EN 404
- `src/app/layout.tsx:67` NextIntlClientProvider (not-found/error client can useTranslations)
- `src/app/loading.tsx:12` renders GlobalLoader
- `src/components/global-loader.tsx:1` `"use client"`
- `src/lib/http.ts:24-39` fail() message, no code
- `src/app/(main)/parent/courses/page.tsx:7` and `src/app/(main)/courses/page.tsx:17` both import checkout banner
- `src/modules/blog/blog-category-labels.ts:19-20` always nameEn
- `src/lib/courses/course-filter-utils.ts:1-42` English label constants
- `tests/e2e/language-switching.spec.ts:15` guest-only
- `src/i18n/locales.ts:1-3` defaultLocale en, cookie tgh_locale

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01-start, 02-error, 03-dashboard, 04-managers, 05-auth, 06-kid, 07-marketing, 08-chrome, 09-api, 10-e2e
- Decision deltas checked: 6
- Reconciled stale references: 0 remaining after red-team apply
- Unresolved contradictions: 0

## Unresolved questions

None blocking.

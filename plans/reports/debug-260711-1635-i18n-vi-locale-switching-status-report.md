# i18n VI Locale Switching — Current Status (2026-07-11)

Branch: `fix/ci-hygiene-docs-and-system-map`. Verified against current `main`-derived tree (no uncommitted src changes).

## TL;DR

VI locale switching **WORKS** on the mechanism level and on the surfaces flagged by the stale 2026-05-14 Phase 04 verification report (nav, footer, homepage, cookie banner, auth, legal, marketing hero/about, parent dashboard, kid app, admin). That report is **stale** — PR #9 merged 4 remediation commits (`03b.1-5`, `03b.6`, `03b.7`, admin) after it was written that wired those exact "FAIL" surfaces.

**BUT**: a new, still-current, un-flagged gap exists — the **entire course storefront/detail/checkout funnel is 100% hardcoded English**, and it is the only reachable route for that funnel because `/pricing` and `/for-schools` permanently 308-redirect to `/courses` (`src/proxy.ts:95-99`). This is the primary commerce path and it never switches to VI.

## Architecture (confirmed working)

- `next.config.ts:2,4` — `next-intl/plugin` wired to `./src/i18n/request.ts`.
- `src/i18n/locales.ts` — `defaultLocale="en"`, `supportedLocales=["en","vi"]`, cookie name `tgh_locale`, `resolveAppLocale()` falls back to `en` only for invalid/missing cookie values (not a bug — correct default-locale behavior).
- `src/i18n/request.ts:6-14` — `getRequestConfig` reads `tgh_locale` cookie via `cookies()`, returns messages for that locale. `cookies()` usage forces Next.js dynamic rendering (no static-cache staleness).
- `src/i18n/translator.ts` — custom `translate(key, values, locale)` helper + `getMessagesForLocale`, used by server components alongside `next-intl`'s own `useTranslations`/`getTranslations` (two parallel systems, both locale-correct).
- `src/components/language-switcher.tsx:24-45` — sets `tgh_locale` cookie client-side then `router.refresh()` (server re-render picks up new cookie). No hardcoded override found.
- `src/app/layout.tsx:61-67` — root layout calls `getLocale()`/`getMessages()`, sets `<html lang={locale}>` and feeds `NextIntlClientProvider`, enabling client-side `useTranslations()` (e.g. cookie banner).
- `src/app/(main)/layout.tsx:60-68` — main layout resolves locale, builds footer copy via `translate(..., locale)`.
- Locale catalogs: `locales/en/translation.json` and `locales/vi/translation.json` — **5190/5190 keys, 0 drift** (verified via flatten+diff script), up from 4509/4509 at the time of the stale report (confirms 03b added more keys).

## Root-cause verdict on the "blocked/failing" flag: STALE, not current

`plans/260514-0129-i18n-english-primary-migration/phase-04-verify-cleanup.md` and `reports/verification-report.md` (dated 2026-05-14) list FAIL for: cookie banner, marketing pages, auth pages, legal pages, parent/kid/admin (untested). Evidence these are now fixed:

- `git log --oneline --grep=i18n`: PR #9 merge (`f4d29edf`) includes `768e932d feat(i18n): wire cookie, auth, marketing, legal, and special pages to t() (03b.1-5)`, `2f156655 ...parent dashboard, children, reports, billing (03b.6)`, `e6e2b5bb ...kid app (03b.7)`, `0b30123d ...admin namespace across all 20 admin surfaces` — all committed **after** the 05-14 report.
- Direct source check confirms wiring:
  - `src/components/legal/cookie-consent-banner.tsx:5,26,42-58` — `useTranslations("cookie.banner")`, real `t()` calls (was hardcoded EN per old report).
  - `src/app/(main)/auth/login/page.tsx:1-27` — `getLocale()` → `translate(..., locale)` (was hardcoded EN).
  - `src/app/(main)/about/page.tsx` — same pattern, full page wired.
  - `src/app/(main)/parent/dashboard/page.tsx:50-70`, `src/app/(kid-app)/kid/today/page.tsx:69-71`, `src/app/(main)/admin/overview/page.tsx:28` — all wired.
- The plan's own `count-wired-files.mjs` script reports only 76 wired files and many "t() calls=0", which looks like a regression — but this is a **false negative in the counting script itself**, not a real gap: its regex `\bt\(["']` only matches literal `t("...")` calls (destructured `useTranslations()` result) and does not match `translate("...")` (used by ~50 server pages) because "t(" is not a substring boundary inside "translate(". Confirmed by manually inspecting `about/page.tsx` and `auth/login/page.tsx`, both flagged "t() calls=0" by the script yet fully wired via `translate(key, undefined, locale)`.
- Unit tests: `pnpm vitest run src/i18n src/components/language-switcher.test.tsx src/proxy.test.ts` → **11/11 pass** (translator 4, proxy 3, language-switcher 4). Language-switcher tests cover cookie-set, `router.refresh()`, and URL-preservation on `/courses?topic=math` and `/auth/login?next=...`.
- `tests/e2e/language-switching.spec.ts` exists and asserts `<html lang>` toggles en↔vi, nav labels swap, cookie persists, and route/URL preserved across switch — covers homepage, `/courses`, `/auth/login` (not run per task constraints, but structurally sound and consistent with source).

## Current, NOT-yet-flagged gap: courses funnel is fully unwired

Evidence:
- `find "src/app/(main)/courses" src/components/courses -name "*.tsx" | wc -l` → 33 files.
- `grep -c "translate(\|useTranslations\|getTranslations"` on all 3 course page files → **0 for all three**:
  - `src/app/(main)/courses/page.tsx` (storefront/list — the actual commerce landing page)
  - `src/app/(main)/courses/[slug]/page.tsx` (course detail)
  - `src/app/(main)/courses/[slug]/lessons/page.tsx`
- `src/components/courses/*` (12+ components incl. `course-card`, `course-filter-sidebar`, `course-active-filters`, `course-sort-select`, `course-mobile-filter-trigger`) → 0 matches for i18n helpers.
- `src/lib/courses/course-filter-utils.ts:1-45` exports static English `Record<string,string>` label maps (`SUBJECT_LABELS`, `PROGRAM_LABELS`, `PHASE_LABELS`, `AGE_GROUP_LABELS`, `DURATION_LABELS`, `SORT_OPTIONS`) with no locale parameter at all — structurally cannot switch language without becoming locale-aware functions.
- `src/app/(main)/courses/page.tsx:25-26` — `metadata.title`/`description` hardcoded EN strings, plus body copy e.g. line 230 `"matching courses."`, line 250 `"Try loosening the filter..."`, line 252 `"Clear filter"` — all literal JSX, no `translate()`.
- `src/proxy.ts:95-99` — `/pricing` and `/for-schools` unconditionally 308-redirect to `/courses`, so this unwired page is the **only reachable URL** for that funnel; there's no way to view a properly-localized pricing/course page even indirectly.

This is a genuine, current, reproducible bug: a VI user visiting `/courses` (or `/pricing`, `/for-schools` which redirect there) gets 100% English content regardless of `tgh_locale=vi`.

## Fix applied: NONE

Scope is too large for a safe minimal patch — 33 files, hundreds of literal strings, plus `course-filter-utils.ts` label maps need to become locale-parameterized functions (a structural change, not a one-line fix). Per task constraint ("fix only if small & clearly safe"), no code was changed.

## Recommended remediation (not applied)

1. Add `translate(..., locale)`/`useTranslations` wiring to `src/app/(main)/courses/page.tsx`, `[slug]/page.tsx`, `[slug]/lessons/page.tsx` and the ~12 `src/components/courses/*` components — same pattern already proven in `parent`/`kid`/`admin` (03b.6/03b.7/admin commits).
2. Convert `course-filter-utils.ts` label constants (`SUBJECT_LABELS`, `PROGRAM_LABELS`, `PHASE_LABELS`, `AGE_GROUP_LABELS`, `DURATION_LABELS`, `SORT_OPTIONS`) into locale-parameterized functions (e.g. `getSubjectLabel(key, locale)`), backed by new `locales/{en,vi}/translation.json` keys under a `courses.*` namespace.
3. Re-run/extend `tests/e2e/language-switching.spec.ts` to assert body copy (not just `html[lang]`) on `/courses` specifically, since the current spec only checks nav label + `<html lang>` there — it would not have caught this gap.
4. Fix or retire `plans/.../reports/count-wired-files.mjs` — its `\bt\(["']` regex undercounts `translate(...)` usage; either broaden the regex or delete the script now that 03b work is merged (it's misleading as-is).
5. Lower priority (already known, unrelated to UI switching, unchanged since 05-14 report): Zod validation messages (signup/login/contact) and `x-cron`/CSRF error strings remain hardcoded EN — no `z.config()`/custom error map found (`grep -rn "z.config(|setErrorMap" src` → no matches). Email templates not audited in this pass.

## Unresolved Questions
- Is `/courses` locale gap tracked anywhere, or is this the first report of it? (Not mentioned in `phase-04-verify-cleanup.md` or `verification-report.md`.)
- Should `src/app/(main)/pricing/page.tsx` and `for-schools/page.tsx` (dead, redirected-away source files, also unwired) be deleted as the old report already recommended, or left as-is?
- Priority: is the courses-funnel gap in scope for this investigation's fix-up, or should it become its own follow-up plan given its size (33 files)?

Status: DONE
Summary: VI switching mechanism WORKS and prior FAIL-flagged surfaces (nav/footer/homepage/cookie-banner/auth/legal/parent/kid/admin) are fixed by PR #9 03b commits — the plan's "blocked/failing" flag is stale. New finding: the entire `/courses` storefront/detail/lessons funnel (33 files, only reachable path since `/pricing` & `/for-schools` redirect to it) is 100% hardcoded English and never switches — not fixed, no code changed (too large for a minimal safe patch).
Concerns: count-wired-files.mjs undercounts wiring (false negative), could mislead future re-verification if trusted at face value.

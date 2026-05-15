# i18n EN/VI Verification Report (Phase 04)

Generated: 2026-05-14
Branch: `i18n/english-primary-migration`
Verifier: Claude Code (full-stack live test against `http://localhost:3000` via Docker compose).
Stack health: `/api/health` and `/api/health/ready` both `ok` before tests.

## Executive Summary

| Layer | Status | Notes |
|---|---|---|
| i18n framework wiring | PASS | `next-intl` plugin, cookie `tgh_locale`, EN default fallback, `<html lang>` follows cookie |
| Locale parity | PASS | `locales/en/translation.json` and `locales/vi/translation.json` both expose 4,509 keys, 0 drift |
| Static VI residue in source | PASS | Only `src/components/site-footer.test.tsx` contains intentional VI fixtures |
| Language switcher | PARTIAL | Switches cookie + triggers `router.refresh()`; works for server components, but not all components rebroadcast |
| Page coverage of `useTranslations()` | **FAIL** | Only 19/1062 source files import i18n helpers (≈1.8%). Most pages were hand-translated to English in source — never lifted into translation keys |
| Cookie consent banner | **FAIL** | `cookie-consent-banner.tsx` and `cookie-consent-actions.tsx` hardcode EN |
| Marketing pages (`/pricing`, `/about`, `/contact`, etc.) | **FAIL** | Body content hardcoded EN; identical under both `tgh_locale=en` and `tgh_locale=vi` |
| Auth pages (`/auth/login`, `/auth/signup`, etc.) | **FAIL** | Body hardcoded EN; identical under both locales |
| API error / Zod validation | **FAIL** | Messages hardcoded EN (e.g. "Invalid email address", "Too small: expected …"); no locale switching |
| Email templates | **NOT TESTED** | Worker pipeline not exercised here; presumed same pattern as APIs |

Overall: phase 03 module reports ("complete") describe prose rewrites, not full i18n wiring. The migration covers footer, top navigation, language switcher, and ~53 t() calls on the homepage scroll journey; the rest of the application keeps hardcoded English. EN-default site reads correctly, but VI locale only switches the nav/footer/homepage strings — body of `/pricing`, `/about`, `/contact`, `/auth/*`, `/parent/*` (untested), `/kid/*` (untested), `/admin/*` (untested), and the cookie banner remain English.

## Evidence

### Source-level audit
- `node scripts/i18n/audit-vietnamese-text.mjs` → `runtime-source: 31` lines in `src/components/site-footer.test.tsx` (intentional VI fixtures). No other VI in `src/`, `prisma/`, `scripts/`, `tests/`, `__tests__`.
- Locale parity check → `EN=4509 keys, VI=4509 keys, missing in VI=0, missing in EN=0`. EN strings flagged as VI are math glyphs (×, ÷); VI strings without diacritics are brand-proper-nouns (Blog, Facebook, YouTube, Cookie, TinyGeniusHub).

### i18n wiring inventory
`plans/260514-0129-i18n-english-primary-migration/reports/count-wired-files.mjs` output:
- 19 of 1062 `.ts/.tsx` files in `src/` import `useTranslations | getTranslations | translate(`
- Only `src/components/homepage/unified-scroll-journey.tsx` makes ≥10 t() calls (53)
- Other matches: layout, app-nav, cloud-garden visuals, mascot a11y labels, curriculum skill node, i18n translator/test

### Live HTML probes (40 routes, EN cookie)
`plans/260514-0129-i18n-english-primary-migration/reports/i18n-page-scan-report.md`:
- 40 routes probed under `tgh_locale=en`
- 0 routes leaked Vietnamese characters into the rendered HTML body
- Auth-gated routes redirect to `/auth/login` (expected)

### Live HTML probes (VI cookie comparison)
Direct `curl` comparison between `tgh_locale=en` and `tgh_locale=vi`:
- `/` (home) → VI body returned ("Khu vườn"); homepage component DOES translate (its 53 t() calls work). Some standalone substrings still remain in EN due to mixed wiring.
- `/pricing` → identical HTML under both cookies (`Transparent price list for each course` heading). No locale switch.
- `/about` → mostly identical; one heading shifted to `Câu chuyện` (one translated wrapper, rest hardcoded).
- `/contact` → identical.
- `/privacy` → identical (title only).
- `/auth/login` → identical (`Parents, welcome back to your self-study journey`).

### API/validation
`POST /api/auth/signup` with bad payload, both locales: identical EN Zod messages:
- `"Invalid email address"`
- `"Too small: expected string to have >=8 characters"`
- `"Invalid input: expected true"`

`POST /api/contact` with empty payload, both locales: identical EN Zod messages plus EN enum values (`"Technical support"`, `"Collaboration / B2B"`, `"Report error"`, `"Other"`).

CSRF guard returns hardcoded `"Missing request origin"` with code `CSRF_ORIGIN_MISSING` in both locales.

### Cookie consent banner regression
`src/components/legal/cookie-consent-banner.tsx` lines 40-50 and `src/components/legal/cookie-consent-actions.tsx` lines 277-300 hold hardcoded English (`"Cookie settings"`, `"We always use necessary cookies for login operations and security…"`, `"Only necessary cookies"`, `"Accept all"`, `"Current status:"`, `"Not selected yet"`, `"Saving..."`). No `useTranslations()` import.

### Visual evidence
Screenshots in `plans/260514-0129-i18n-english-primary-migration/reports/screenshots/`:
- `home-en.png` — EN baseline (full page).
- `pricing-vi-no-switch.png` — VI cookie active; nav is Vietnamese ("Khóa học", "Bảng giá") but body and cookie banner stay English. This is the visual proof of the partial-wiring regression.
- `auth-login-vi-no-switch.png` — VI cookie active; `/auth/login` body ("Parents, welcome back to your self-study journey", "Parent login") and cookie banner remain English. Visual proof for the auth-flow regression.
- `home-vi-snapshot.yml` — Playwright accessibility snapshot under VI cookie.

## Failing surfaces (per area)

### Public/marketing pages
Hardcoded EN — `useTranslations` not imported:
- `src/app/(main)/page.tsx` (homepage server entry — child component `unified-scroll-journey` IS wired, but page shell is not)
- `src/app/(main)/pricing/page.tsx`
- `src/app/(main)/about/page.tsx`
- `src/app/(main)/contact/page.tsx`
- `src/app/(main)/for-schools/page.tsx`
- `src/app/(main)/gift-code/page.tsx`
- `src/app/(main)/waitlist/page.tsx`
- `src/app/(main)/referral/page.tsx`
- `src/app/(main)/blog/page.tsx`
- `src/app/(main)/blog/search/page.tsx`
- `src/app/(main)/blog/[slug]/page.tsx`
- `src/app/(main)/blog/category/[slug]/page.tsx`
- `src/app/(main)/try-garden/page.tsx`
- `src/app/(main)/interactive-lesson-preview/page.tsx`
- `src/app/(main)/hybrid-preview/page.tsx`
- `src/app/(main)/mascot-preview/page.tsx`

### Legal pages
Hardcoded EN:
- `src/app/(main)/privacy/page.tsx`
- `src/app/(main)/terms/page.tsx`
- `src/app/(main)/cookie-policy/page.tsx`
- `src/app/(main)/refund-policy/page.tsx`

(Old VI URL paths `/gioi-thieu`, `/lien-he`, `/dieu-khoan-su-dung`, `/chinh-sach-bao-mat`, `/chinh-sach-cookie`, `/chinh-sach-hoan-tien`, `/gioi-thieu-ban` redirect 301 to English slugs — these page files themselves are residual and could be deleted.)

### Auth flow
Hardcoded EN:
- `src/app/(main)/auth/page.tsx`
- `src/app/(main)/auth/login/page.tsx`
- `src/app/(main)/auth/signup/page.tsx`
- `src/app/(main)/auth/forgot-password/page.tsx`
- `src/app/(main)/auth/reset-password/page.tsx`
- `src/app/(main)/setup/page.tsx`
- `src/app/(main)/reader/login/page.tsx`
- `src/app/(main)/reader/signup/page.tsx`
- `src/app/(admin-login)/admin/login/page.tsx`

### Special/error pages
- `src/app/maintenance/page.tsx`, `src/app/offline/page.tsx`, `src/app/auth-fail/page.tsx`, `src/app/session-expired/page.tsx`, `src/app/accept-invite/page.tsx`

### Parent / kid / admin / curriculum
Untested live (need authenticated session). Source scan shows none of these `(main)/parent/**`, `(kid-app)/kid/**`, `(main)/admin/**`, `(curriculum)/**` page files import `useTranslations`/`translate`. Treat as the same hardcoded-EN regression.

### Client components
Plus any client-component-only copy (cookie banner already documented). Quick grep candidates for follow-up audit: `src/components/*-banner*`, `src/components/*-form*`, `src/components/admin-*`, `src/components/site-announcement-banner.tsx`, `src/components/impersonation-banner.tsx`, `src/components/reader-top-bar.tsx`, `src/components/mascot-support-hub.tsx`.

### API + validation
- `src/modules/**/*-validation*.ts` and inline Zod usages use default Zod messages (EN). No `setErrorMap` / `useTranslations` plumbed.
- Auth signup, login, contact, billing/contact endpoints all reproduce EN in both locales.

### Emails
Not exercised; worker pipeline (`src/modules/reports/email/*`) needs the same audit. High risk of EN-only output.

## Validation Gates (Phase 04 success criteria, status)

| Gate | Required | Actual |
|---|---|---|
| `pnpm lint` exits 0 | ✅ | Not run in this verification (no edits). Run before final PR. |
| `pnpm build` exits 0 | ✅ | Not run. Run before final PR. |
| Grep finds zero hardcoded VI in runtime source outside `locales/` | ✅ | PASS (only the legitimate VI test fixture remains) |
| Playwright screenshots cover key public/auth/parent/kid/admin/policy pages | ✅ | Partially. Public/legal/auth covered. Authenticated parent/kid/admin pages skipped — listed as untested. |
| Git status clean, commits pushed, PR created | ✅ | Local branch has untracked `vps/`. No PR opened yet. |

## Recommended remediation plan

1. **Block the merge.** Phase 04 cannot exit cleanly: only the navigation/footer/language-switcher and homepage scroll journey are real i18n surfaces. Everything else is EN-text-in-source masquerading as a migration.

2. **Re-audit Phase 3 module status.** Each `feat(i18n): migrate [module-name]` commit shipped translated prose but did not introduce `useTranslations()` calls in most files. The status table in `phase-03-migrate.md` should be reset and the module list re-driven by a "files that import useTranslations/translate" inventory, not by line-count of VI-removed text.

3. **Lint rule.** Add an ESLint rule (or a CI grep) that flags `.tsx` files with JSX literal strings of length ≥ N in `src/app/`, `src/components/` to block future regressions. Treat the existing `generated.*` 4,428-key dump as the candidate dictionary for the remaining pages.

4. **Prioritized wiring order** (matches the user funnel):
   1. Cookie consent banner + actions (visible on every page).
   2. Auth flow (`/auth/login`, `/auth/signup`, `/auth/forgot-password`, `/auth/reset-password`).
   3. Marketing public pages (`/pricing`, `/courses`, `/about`, `/contact`, `/for-schools`, `/referral`, `/gift-code`, `/waitlist`).
   4. Legal pages.
   5. Parent dashboard (`/parent/dashboard`, `/parent/children`, `/parent/reports`, `/parent/courses`, `/parent/billing`).
   6. Kid app (`/kid/today`, `/kid/courses`, `/kid/garden/**`).
   7. Admin surfaces.
   8. API/validation/email templates (introduce a server-side `translate("errors.invalidEmail")` helper or a Zod error map keyed on locale).

5. **Delete the dead Vietnamese URL pages** (`(main)/gioi-thieu`, etc.) — they were superseded by the EN slugs via `next.config.ts` redirects and now confuse the migration story.

6. **Verify under authenticated state.** Re-run page-by-page after wiring parent/kid/admin to confirm locale switches.

## Unresolved Questions

- Should the `generated.*` namespace stay (a flat dump of every Vietnamese string) or be split into per-page namespaces (`pricing.*`, `auth.login.*`, etc.) for readability? Current shape works but hides intent.
- Email templates: is the policy to localize them per recipient locale stored on the user record, or to keep them EN-only and translate via marketing copy edits? This affects scope of phase 04+.
- Validation errors: switch to per-issue translation keys (preferred) or a single `errors.validationFailed` umbrella with raw field list? Schema-driven Zod messages cannot be locale-switched without setting `z.config({ locale })` or a custom error map.

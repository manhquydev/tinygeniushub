---
title: "Phase 03b — Rewire UI Surfaces to t() / translate()"
description: "Wire the ~1,043 remaining hardcoded-EN files into useTranslations() so VI cookie actually switches user-facing copy."
status: pending
priority: P1
effort: 24h
branch: i18n/english-primary-migration
tags: [i18n, next-intl, migration, wiring]
created: 2026-05-15
---

# Phase 03b — Rewire UI Surfaces to t() / translate()

## Context Links

- Verification report: `plans/260514-0129-i18n-english-primary-migration/reports/verification-report.md`
- Earlier Phase 3 (prose rewrite only): `plans/260514-0129-i18n-english-primary-migration/phase-03-migrate.md`
- Wired reference: `src/components/homepage/unified-scroll-journey.tsx:56` (`useTranslations("generated")`)
- Translator helper: `src/i18n/translator.ts:20` (`translate(key, values, locale)`)
- Request config: `src/i18n/request.ts:6` — cookie-driven locale
- Locale registry: `src/i18n/locales.ts:1` — `defaultLocale=en`, cookie=`tgh_locale`

## Overview

- **Priority:** P1 — blocks Phase 04 exit and PR merge.
- **Status:** pending.
- **Brief:** Phase 03 was reported "complete" but only wired ~19/1,062 source files. Body of `/pricing`, `/about`, `/auth/*`, cookie banner, `/parent/*`, `/kid/*`, `/admin/*`, Zod validation, emails still emit hardcoded EN regardless of `tgh_locale`. This phase wires the high-impact surfaces.

## Key Insights

1. **Two i18n helpers live in the codebase:**
   - Server: `import { translate } from "@/i18n/translator"` + `translate(key, values, locale)` — needs `resolveAppLocale(await getLocale())`.
   - Client: `import { useTranslations } from "next-intl"` + `const t = useTranslations("namespace")`.
   - Server pages may also use `import { getTranslations } from "next-intl/server"` and `const t = await getTranslations("namespace")`.
2. **Locale catalog shape today (`locales/en/translation.json`, 4,509 keys):**
   - Named namespaces (clean, 81 keys total): `common`, `email`, `errors`, `metadata`, `language`, `navigation`, `footer`, `validation`.
   - `generated.*` (4,428 keys): flat dump of every Vietnamese string ever scraped. **Polluted** — 321 entries carry stray prefix chars (`?`, `+`, `/`, `"`), 79 look like comments/template literals/code. Unsafe to surface to users without sanitization.
3. **Most surface strings already exist in EN/VI** under hash-named keys like `parent_login_a72e190b`, `cookie_settings_b3f18521`, `transparent_price_list_for_each_course_f29036e4`. Wiring can either:
   - **(A)** import via the hash key from `generated.*` — fast, ugly, fragile (keys change if dump regenerated).
   - **(B)** lift strings into stable per-surface namespaces (`cookie.banner.heading`, `auth.login.title`) — readable, durable, but requires curated key additions.
4. **Server components dominate.** Pricing, about, contact, legal, auth, parent dashboard, kid app, admin are server components calling `requireParent()`. Use `translate()` + `getLocale()`. Client-only surfaces (cookie banner, auth-form, dashboard cards passed as props) need `useTranslations` OR receive copy as props from server parent.
5. **Subcomponent fan-out is high.** A page's i18n wiring is incomplete unless every prop-receiving child is also wired. Example: `parent/dashboard/page.tsx` passes 12+ hardcoded strings into `DashboardMetricCards`, `DashboardHeroSection`, etc.
6. **No Zod error-map plumbing.** Search confirms zero `setErrorMap` / `z.config({ locale })` usage; Zod returns its built-in EN messages everywhere. Localizing requires a custom error map keyed on locale, wired into every `parseAsync()` call site.

## Requirements

### Functional

- VI cookie (`tgh_locale=vi`) must visibly switch text on: cookie banner, login/signup/forgot/reset, pricing, about, contact, for-schools, all four legal pages, parent dashboard hero + metric cards, kid app today/garden, common admin headers.
- EN remains default and renders identically to today.
- No raw VI in runtime source outside `locales/`.
- No broken interpolation: `{name}`, `{count}` etc. must survive locale switch.

### Non-functional

- Each phase ships as one focused commit: `feat(i18n): wire <surface> to t() (phase 03b.<n>)`.
- Build, lint, tests stay green after every commit.
- Subcomponents must not silently fall back to hardcoded EN — every JSX literal ≥3 words gets a key.

## Architecture

### Namespace strategy (decision required, see Unresolved Q1)

Recommended: **split-namespace per surface**, mirror EN/VI exactly:

```
locales/en/translation.json
├── common.actions.*               // existing
├── navigation.*                   // existing
├── footer.*                       // existing
├── validation.*                   // existing
├── errors.*                       // existing
├── cookie.banner.{heading,body,detail,close,details,policy}
├── cookie.actions.{currentStatus,allAllowed,onlyNecessary,notSelected,onlyNecessaryButton,acceptAll,saving,saveError,offlineFallback}
├── auth.login.{title,description,badge,submit,forgotLink,signupLink}
├── auth.signup.{title,description,badge,submit,...}
├── auth.forgotPassword.*
├── auth.resetPassword.*
├── auth.shared.{emailLabel,passwordLabel,invalidCredentials,...}
├── auth.reader.{login,signup}.*
├── auth.admin.login.*
├── auth.verify.{pending,deliveryIssue,success,expired,invalid,signupSuccess}
├── marketing.pricing.{hero,faq,conversion,...}
├── marketing.about.*
├── marketing.contact.*
├── marketing.forSchools.*
├── marketing.referral.*
├── marketing.giftCode.*
├── marketing.waitlist.*
├── marketing.tryGarden.*
├── marketing.previews.{interactiveLesson,hybrid,mascot}.*
├── marketing.blog.{index,search,category,post}.*
├── legal.{privacy,terms,cookiePolicy,refundPolicy}.*
├── special.{maintenance,offline,authFail,sessionExpired,acceptInvite}.*
├── parent.dashboard.{metrics,hero,shortcuts,referral,reports}.*
├── parent.children.*
├── parent.reports.*
├── parent.courses.*
├── parent.billing.*
├── parent.skills.*
├── kid.{today,garden,courses,zone}.*
├── admin.{overview,users,staff,courses,...}.*
├── api.errors.{invalidEmail,passwordTooShort,passwordTooLong,...}
├── email.{lifecycle.trialWelcome,trialD1,...}.{subject,body}
└── generated.*                    // legacy, only consumed by unified-scroll-journey
```

The `generated.*` namespace stays untouched as a legacy dictionary for `unified-scroll-journey.tsx`. New code never reads from it.

### Wiring patterns

**Server component (preferred for marketing/legal/auth pages):**
```ts
import { getLocale } from "next-intl/server";
import { resolveAppLocale } from "@/i18n/locales";
import { translate } from "@/i18n/translator";

export default async function PricingPage() {
  const locale = resolveAppLocale(await getLocale());
  const heading = translate("marketing.pricing.hero.heading", undefined, locale);
  ...
}
```

**Client component with `next-intl` provider already wrapping it:**
```ts
"use client";
import { useTranslations } from "next-intl";

export function CookieConsentBanner() {
  const t = useTranslations("cookie.banner");
  ...
  <h2>{t("heading")}</h2>
```

**Client component nested deep, no provider context:**
- Lift copy into a `copy` prop built server-side. Pattern already used by `SiteFooter`/`buildSiteFooterCopy()` in `src/app/(main)/layout.tsx:16`.

**API/Zod validation:**
- Add `src/i18n/zod-error-map.ts` exporting `buildZodErrorMap(locale: AppLocale)`. Call `z.setErrorMap(buildZodErrorMap(locale))` at the entry of every API handler using `parseAsync()` (after resolving locale from request cookie/header). Alternative: localize message inline on each `.refine()` / `.min()` — DRY violation, rejected.

**Email templates (`src/modules/platform/lifecycle-email-copy-builder.ts`, `src/modules/reports/email-delivery-service.ts`):**
- Out of scope for phase 03b unless Unresolved Q2 closes "yes". Tracked as `phase-03c-email-i18n.md` follow-up if needed.

## Subphase Breakdown

Each subphase is one commit. Subphases ordered by user funnel impact.

| # | Subphase | Surface | Files (page) | Files (subcomponent) | Effort | Priority |
|---|----------|---------|--------------|----------------------|--------|----------|
| 03b.1 | Cookie banner | every page | 2 | 0 | 1h | P0 |
| 03b.2 | Auth flow | login, signup, forgot, reset, reader login/signup, admin login, setup | 9 | 2 (`auth-form`, `auth-split-shell`) | 4h | P0 |
| 03b.3 | Marketing public pages | pricing, about, contact, for-schools, gift-code, waitlist, referral, try-garden, blog index/search/category/post, previews | 14 | 0 unique | 5h | P1 |
| 03b.4 | Legal pages | privacy, terms, cookie-policy, refund-policy | 4 | 0 | 2h | P1 |
| 03b.5 | Special/error pages | maintenance, offline, auth-fail, session-expired, accept-invite | 5 | 0 | 1h | P1 |
| 03b.6 | Parent dashboard | parent root + dashboard subcomponents | 7 | 7 (`parent/*.tsx`) | 4h | P1 |
| 03b.7 | Kid app | today, courses, garden zones | 6 | TBD (audit during subphase) | 3h | P2 |
| 03b.8 | API/Zod error map | all `/api/**` handlers using `parseAsync` | ~80 | 1 (`zod-error-map.ts`) | 3h | P2 |
| 03b.9 | Admin surfaces (header strip only) | admin overview + admin-page-header | 25 | 1 (`admin-page-header`) | 1h | P3 |

**Total estimated effort: ~24 h** (one engineer week). Subphases 03b.1–03b.5 are user-visible on EN-only browsers; 03b.6–03b.7 require authenticated state; 03b.8 affects API consumers; 03b.9 is admin-only and lowest impact.

**Phases NOT in scope (deferred):**
- Email templates (`phase-03c-email-i18n.md` follow-up — see Unresolved Q2).
- Admin form bodies, deep admin tables (low traffic, English-acceptable for ops staff per current evidence in `verification-report.md` § 4.7).
- Curriculum admin (`(curriculum)/**`) — same rationale.

## Files to Modify (by subphase)

### 03b.1 — Cookie banner

Modify:
- `src/components/legal/cookie-consent-banner.tsx` — add `useTranslations("cookie.banner")`; replace literals on `:40,41-43,45-50,55,59`.
- `src/components/legal/cookie-consent-actions.tsx` — add `useTranslations("cookie.actions")`; replace literals on `:236, 259, 274-280, 291, 299`.

Locale additions: `cookie.banner.*` (6 keys) + `cookie.actions.*` (9 keys) in both `locales/en/translation.json` and `locales/vi/translation.json`.

### 03b.2 — Auth flow

Modify (server pages, prop-down pattern):
- `src/app/(main)/auth/page.tsx`
- `src/app/(main)/auth/login/page.tsx`
- `src/app/(main)/auth/signup/page.tsx`
- `src/app/(main)/auth/forgot-password/page.tsx`
- `src/app/(main)/auth/reset-password/page.tsx`
- `src/app/(main)/reader/login/page.tsx`
- `src/app/(main)/reader/signup/page.tsx`
- `src/app/(main)/setup/page.tsx`
- `src/app/(admin-login)/admin/login/page.tsx`

Modify (client subcomponents):
- `src/components/auth-form.tsx` (lines 30–33, 38–76, 96, plus form labels lower in file) — accept `copy` prop OR use `useTranslations("auth.shared")`.
- `src/components/auth-split-shell.tsx` — accept localized `badge`/`title`/`description` props (already prop-driven; just stop hardcoding the values upstream).

Locale additions: `auth.shared.*`, `auth.login.*`, `auth.signup.*`, `auth.forgotPassword.*`, `auth.resetPassword.*`, `auth.verify.*`, `auth.reader.{login,signup}.*`, `auth.admin.login.*`, `auth.setup.*`.

### 03b.3 — Marketing public pages

Modify (server pages):
- `src/app/(main)/pricing/page.tsx`
- `src/app/(main)/about/page.tsx`
- `src/app/(main)/contact/page.tsx`
- `src/app/(main)/for-schools/page.tsx`
- `src/app/(main)/gift-code/page.tsx`
- `src/app/(main)/waitlist/page.tsx`
- `src/app/(main)/referral/page.tsx`
- `src/app/(main)/try-garden/page.tsx`
- `src/app/(main)/interactive-lesson-preview/page.tsx`
- `src/app/(main)/hybrid-preview/page.tsx`
- `src/app/(main)/mascot-preview/page.tsx`
- `src/app/(main)/blog/page.tsx`
- `src/app/(main)/blog/search/page.tsx`
- `src/app/(main)/blog/category/[slug]/page.tsx`
- `src/app/(main)/blog/[slug]/page.tsx`

For pages with `export const metadata`, also localize `title` and `description` via `generateMetadata({ params }) → translate(..., locale)`.

### 03b.4 — Legal pages

Modify:
- `src/app/(main)/privacy/page.tsx`
- `src/app/(main)/terms/page.tsx`
- `src/app/(main)/cookie-policy/page.tsx`
- `src/app/(main)/refund-policy/page.tsx`

Legal copy is long-form prose. Keys are body sections (`legal.privacy.section.dataCollection.heading`, `.body`).

### 03b.5 — Special pages

Modify:
- `src/app/maintenance/page.tsx`
- `src/app/offline/page.tsx`
- `src/app/auth-fail/page.tsx`
- `src/app/session-expired/page.tsx`
- `src/app/accept-invite/page.tsx`

### 03b.6 — Parent dashboard

Modify (page):
- `src/app/(main)/parent/dashboard/page.tsx` — pass localized `metricCards[].label/hint`, `heroMessage`, props.
- `src/app/(main)/parent/children/page.tsx`
- `src/app/(main)/parent/reports/page.tsx`
- `src/app/(main)/parent/courses/page.tsx`
- `src/app/(main)/parent/billing/page.tsx`
- `src/app/(main)/parent/dashboard/[childId]/skills/page.tsx`
- `src/app/(main)/parent/dashboard/[childId]/skills/[skillId]/page.tsx`

Modify (subcomponents):
- `src/components/parent/dashboard-hero-section.tsx`
- `src/components/parent/dashboard-metric-cards.tsx`
- `src/components/parent/dashboard-children-section.tsx`
- `src/components/parent/dashboard-child-card.tsx`
- `src/components/parent/dashboard-shortcuts-section.tsx`
- `src/components/parent/dashboard-referral-section.tsx`
- `src/components/parent/dashboard-reports-section.tsx`

### 03b.7 — Kid app

Modify:
- `src/app/(kid-app)/kid/page.tsx`
- `src/app/(kid-app)/kid/today/page.tsx`
- `src/app/(kid-app)/kid/courses/page.tsx`
- `src/app/(kid-app)/kid/courses/[slug]/page.tsx`
- `src/app/(kid-app)/kid/garden/page.tsx`
- `src/app/(kid-app)/kid/garden/[zone]/page.tsx`

Pre-subphase scout step: grep `src/components/kid-*.tsx` and `src/components/garden/**` for hardcoded JSX literals; expand modify-list as discovered.

### 03b.8 — API/Zod

Create:
- `src/i18n/zod-error-map.ts` (new file) — exports `buildZodErrorMap(locale: AppLocale)` returning a `z.ZodErrorMap` that consults `validation.*` keys.

Modify:
- Every API route under `src/app/api/**` and service file under `src/modules/**` that calls `parseAsync()` / `.parse()` — wrap call site so locale-aware error map is registered before parsing. Helper: `withZodLocale(req, schema)` to keep DRY.
- Locale additions: `validation.*` (expand existing 2-key namespace to ~40 keys covering Zod's standard issue codes: `too_small`, `too_big`, `invalid_string.email`, `invalid_enum_value`, `required`, etc.).

API handler count: ~80 files (`Grep z\.(string|object|enum|number|email|array)` returns 94 files; some are pure schemas without handlers).

### 03b.9 — Admin (lightweight)

Modify only:
- `src/components/admin/admin-page-header.tsx` (already prop-driven for title/subtitle — wire the prop callers).
- `src/app/(main)/admin/overview/page.tsx`
- `src/app/(main)/admin/page.tsx`

Deep admin tables stay EN-only (low traffic, internal users).

## Implementation Steps (template per subphase)

1. **Scout**: grep target files for JSX literals ≥3 words. Build a key inventory file in `plans/.../reports/keys-<subphase>.txt`.
2. **Reconcile keys**: for each literal, check if a matching entry exists in `generated.*` (use `node -e` JSON lookup). Lift good ones into the per-surface namespace; write new keys where needed. Keep `generated.*` untouched.
3. **Mirror to VI**: every new EN key gets a VI translation in `locales/vi/translation.json`. Use existing `generated.*` VI value when key was lifted from there. Use translator for genuinely new keys.
4. **Wire server pages**: import `getLocale`, `resolveAppLocale`, `translate`. Replace literals with `translate("namespace.key", values, locale)`.
5. **Wire client subcomponents**: import `useTranslations`. For deep subcomponents without provider chain, accept `copy` props built server-side (mirror `SiteFooter` pattern).
6. **Localize metadata**: convert `export const metadata` to `export async function generateMetadata()` for pages with title/description.
7. **Sanity grep**: `rg "^\s*<h[1-6]>[A-Z]" <subphase-files>` returns zero. `rg "useTranslations\(|translate\(" <subphase-files>` returns ≥1 per file.
8. **Manual smoke test**: `curl --cookie "tgh_locale=vi" http://localhost:3000/<route>` and diff against EN render — body must change.
9. **Commit**: `feat(i18n): wire <surface> to t() (phase 03b.<n>)`.

## Todo List

- [ ] 03b.1 Cookie banner
- [ ] 03b.2 Auth flow (server pages + auth-form/split-shell)
- [ ] 03b.3 Marketing public pages
- [ ] 03b.4 Legal pages
- [ ] 03b.5 Special/error pages
- [ ] 03b.6 Parent dashboard (pages + 7 subcomponents)
- [ ] 03b.7 Kid app
- [ ] 03b.8 API/Zod error map
- [ ] 03b.9 Admin header strip
- [ ] Re-run `reports/count-wired-files.mjs` and update verification report
- [ ] Update `plan.md` Phase 3 status to truly complete

## Success Criteria

- `curl --cookie "tgh_locale=vi"` returns Vietnamese body for `/pricing`, `/about`, `/contact`, `/auth/login`, `/auth/signup`, `/privacy`, `/terms`, `/cookie-policy`, `/refund-policy`, `/maintenance`.
- Cookie banner heading switches between "Cookie settings" and the existing VI translation when toggling cookie value.
- Authenticated probe: parent dashboard hero greeting changes locale (use seeded test account).
- `reports/count-wired-files.mjs` reports ≥120 wired files (up from 19).
- `pnpm lint` exits 0.
- `pnpm build` exits 0.
- `pnpm test` exits 0 (i18n unit tests pass; snapshot tests refreshed where intended).
- `node scripts/i18n/audit-vietnamese-text.mjs` continues to report 31 lines (only the test fixture).
- No regression in EN render (visual diff against current `home-en.png`).

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Stale hash-named keys in `generated.*` change shape under future re-extraction → wired pages break | Medium | High | Lift hash-named values into per-surface stable keys; freeze `generated.*` from further automated mutation; document that `unified-scroll-journey.tsx` is the only legacy consumer. |
| Subcomponent fan-out underestimated (parent dashboard alone has 7 children) | High | Medium | Each subphase opens with a scout step; modify-list is allowed to grow during the subphase, not after. |
| `next-intl` client provider boundary unclear in deep nested client components | Medium | Medium | Use `copy` prop fallback (proven in `SiteFooter`). Document this as the standard for any nested client component. |
| Zod error map breaks existing API tests asserting on EN messages | High | Medium | Pin existing API tests to `locale=en` (default). Add new tests asserting VI cookie returns VI Zod messages. |
| `generateMetadata` async migration breaks Next.js cached static pages | Low | Medium | Pages that need locale-aware metadata become dynamic. Verify revalidation budgets in `next.config.ts`. |
| Long-form legal prose mistranslated by reusing `generated.*` entries with stray prefix chars | Medium | High | Translator hand-curates legal sections; do NOT auto-lift from `generated.*` for legal subphase 03b.4. |
| `pnpm build` time grows on large catalog bundling | Low | Low | `next-intl` already tree-shakes per locale; no action expected. |
| Phase exceeds 24h estimate | Medium | Low | Phases 03b.1–03b.5 ship as user-visible win even if 03b.6–03b.9 slip. PR can land partial. |

## Security Considerations

- API/Zod localization must not leak schema internals into error messages. Keep wording generic ("Invalid email", not "Field `parentEmail` failed regex `/^...$/`").
- CSRF guard message (`Missing request origin`, `CSRF_ORIGIN_MISSING`) stays in EN by design — security headers, not user-facing copy. Add explicit comment to that effect.
- Locale cookie is already `HttpOnly`-not-required, `SameSite=Lax`. No change.
- Email template localization (out of scope) must consult the recipient's stored locale preference, not the request locale, when added.

## Next Steps

After 03b complete:
- **Phase 03c (optional)**: email template i18n if Unresolved Q2 resolves to "yes".
- **Phase 04 (re-run)**: Playwright screenshots under both cookies; rerun `count-wired-files.mjs`; refresh `verification-report.md`.
- **Phase 05**: cleanup, lint, build, push, PR.

## Unresolved Questions

1. **Namespace strategy** — Approve "split-namespace per surface" (keys like `cookie.banner.heading`) versus a flat-keyed approach reusing the existing `generated.*` hash keys? Recommendation: split-namespace. Cost: ~150 curated new keys + VI translations. Benefit: readable code, durable against future extraction.
2. **Scope of email/template i18n** — In `phase-03b.8` (API/Zod) or split to a `phase-03c-email-i18n.md` follow-up? Recommendation: split into 03c; email recipients have a locale preference (`Parent.locale` is the natural field name — needs schema check) that differs from request cookie. Mixing them in 03b adds schema work.
3. **Admin depth** — current plan only wires `admin-page-header` (03b.9). Confirm admin form bodies and tables can stay EN-only.
4. **Legacy `generated.*` cleanup** — when (or if) to delete the 4,428-entry dump after all real surfaces are lifted into named namespaces? Recommend deferring until after Phase 04 stable.
5. **VI URL pages residuals** — `(main)/gioi-thieu/`, `(main)/lien-he/`, etc. were noted in verification report as `next.config.ts`-redirect-only and "could be deleted". Confirm deletion is in scope of Phase 05 cleanup, not 03b.

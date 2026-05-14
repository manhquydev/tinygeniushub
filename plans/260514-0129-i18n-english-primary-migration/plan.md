---
title: "English-Primary i18n Migration"
description: "Replace Vietnamese hardcoded runtime copy with EN-primary i18n; VI remains a fallback locale."
status: in-progress
priority: P1
effort: 30h
branch: i18n/english-primary-migration
tags: [i18n, next-intl, migration]
created: 2026-05-14
---

# English-Primary i18n Migration Plan

## Objective
Replace Vietnamese hardcoded runtime copy with an English-primary i18n/l10n system. Keep Vietnamese as fallback locale data only.

## Scope
- Runtime source: `src/`, `prisma/`, `scripts/`, `tests/`, `__tests__`, root config files.
- Locale output: `locales/en/translation.json`, `locales/vi/translation.json`.
- Docs and historical archives are included in audit notes, but final zero-Vietnamese gate applies to runtime source outside locale files.
- Generated/binary/build artifacts are excluded from scan gates.

## Phases
1. Audit Vietnamese text inventory.
2. Initialize i18n architecture for Next.js App Router + backend/shared translation helpers.
3. Migrate modules in separate commits (prose rewrite — DONE; t() wiring — NOT done, deferred to 03b).
3b. Rewire UI surfaces to `t()` / `translate()` — see `phase-03b-rewire-ui-surfaces.md`.
4. Verify UI/API/email/default English mode (re-run after 03b).
5. Cleanup, push commits, create PR.

## Dependencies
- Next.js 16 App Router.
- `next-intl` for app/server/client translations.
- A lightweight server-side helper for API, worker, seed, and script messages (`src/i18n/translator.ts`).

## Status
- Phase 1: complete — audit generated.
- Phase 2: complete — i18n framework initialized; `tgh_locale` cookie + EN default + 4,509-key EN/VI parity.
- Phase 3: **misreported** — prose rewrite shipped, but only 19/1,062 source files import `useTranslations`/`translate`. Phase reset to "partial".
- Phase 3b: **NEW**, pending — wire cookie banner, auth flow, marketing, legal, special, parent dashboard, kid app, API/Zod, admin header. See `phase-03b-rewire-ui-surfaces.md`. ~24h, 9 subphases.
- Phase 4: verification done 2026-05-14, remediation blocked on Phase 3b.
- Phase 5: pending (blocked on Phase 3b + re-verification).

## Phase Files
- `phase-01-audit.md` — DONE
- `phase-02-architecture.md` — DONE
- `phase-03-migrate.md` — prose-rewrite DONE, status reset to partial; t() wiring lifted into 03b
- `phase-03b-rewire-ui-surfaces.md` — pending, P1, 24h
- `phase-04-verify-cleanup.md` — pending, blocked on 03b
- (deferred) `phase-03c-email-i18n.md` — pending decision on Unresolved Q2 in 03b

## Validation Gates
- `pnpm lint` exits 0.
- `pnpm build` exits 0.
- `pnpm test` exits 0.
- Source grep finds no Vietnamese diacritic strings outside `locales/`.
- `reports/count-wired-files.mjs` reports ≥120 wired files (up from 19).
- VI cookie visibly switches body copy on /pricing, /auth/login, cookie banner, and parent dashboard hero.
- Playwright screenshots cover key public, auth, parent, kid, admin, and policy pages.
- Git status clean, commits pushed, GitHub PR created.

## Unresolved Questions
- Namespace strategy: split-named (`cookie.banner.heading`) vs hash-keyed (`generated.cookie_settings_b3f18521`). See 03b Q1. Recommendation: split-named.
- Email template i18n scope: bundle into 03b.8 or split into 03c? See 03b Q2. Recommendation: split.
- Admin depth: header-only or full forms/tables? See 03b Q3. Recommendation: header-only.
- Cleanup timing for legacy `generated.*` namespace. See 03b Q4. Recommendation: defer past Phase 4.
- VI URL residual pages (`(main)/gioi-thieu/`, etc.) deletion in Phase 5? See 03b Q5.

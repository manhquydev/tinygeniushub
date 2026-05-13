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
3. Migrate modules in separate commits.
4. Verify UI/API/email/default English mode.
5. Cleanup, push commits, create PR.

## Dependencies
- Next.js 16 App Router.
- `next-intl` for app/server/client translations.
- A lightweight server-side helper for API, worker, seed, and script messages.

## Status
- Phase 1: complete, audit generated.
- Phase 2: complete, i18n framework initialized.
- Phase 3: next.
- Phase 4-5: pending.

## Validation Gates
- `pnpm lint` exits 0.
- `pnpm build` exits 0.
- Source grep finds no Vietnamese diacritic strings outside `locales/`.
- Playwright screenshots cover key public, auth, parent, kid, admin, and policy pages.
- Git status clean, commits pushed, GitHub PR created.

## Unresolved Questions
- None.

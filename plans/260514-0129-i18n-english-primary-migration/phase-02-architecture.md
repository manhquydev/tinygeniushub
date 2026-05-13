# Phase 02 - Architecture

## Overview
- Priority: high
- Status: pending
- Add English-primary i18n framework and locale file structure.

## Key Insights
- Official `next-intl` docs recommend `i18n/request.ts`, the Next plugin, and `NextIntlClientProvider` for App Router.
- Prompt requires `locales/en/translation.json` and `locales/vi/translation.json`.

## Requirements
- Install/configure `next-intl`.
- English is default primary locale.
- Vietnamese locale mirrors every English key.
- Add server/helper API for route handlers, workers, emails, scripts.

## Related Code Files
- Modify: `package.json`, `pnpm-lock.yaml`
- Modify: `next.config.ts`
- Modify: `src/app/layout.tsx`
- Create: `src/i18n/request.ts`
- Create: `src/i18n/locales.ts`
- Create: `src/i18n/translator.ts`
- Create: `locales/en/translation.json`, `locales/vi/translation.json`

## Implementation Steps
1. Add dependency and Next plugin.
2. Add locale config and request loader.
3. Wrap root layout with `NextIntlClientProvider`; set `<html lang="en">`.
4. Add translation helper for non-React code.
5. Seed locales with architecture-level keys.
6. Commit `feat(i18n): initialize i18n framework and locale structure`.

## Success Criteria
- App compiles with i18n provider.
- Locale JSON paths match prompt.

## Risk Assessment
- Root layout changes affect whole app; run GitNexus impact and type-check.

## Security Considerations
- Locale key fallback should not expose raw internal details.

## Unresolved Questions
- None.

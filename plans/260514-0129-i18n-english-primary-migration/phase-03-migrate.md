# Phase 03 - Migrate

## Overview
- Priority: high
- Status: **partial** (prose rewrite complete; t() wiring deferred to `phase-03b-rewire-ui-surfaces.md`)
- Original scope: replace Vietnamese hardcoded runtime strings module by module.
- Actual delivery: VI prose removed from source (audit reports 31 lines in legitimate test fixtures), but only `layout-and-shared-ui` and the homepage scroll journey gained `useTranslations()` calls. Other modules ship hardcoded EN that does not respond to the locale cookie.

## Migration Modules (revised status, post-verification 2026-05-14)
1. `layout-and-shared-ui` - DONE (nav, footer, language switcher wired)
2. `public-marketing-and-legal-pages` - **partial** (prose rewritten EN, t() not wired) → 03b.3, 03b.4
3. `auth-parent-and-dashboard` - **partial** → 03b.2, 03b.6
4. `courses-and-kid-learning` - **partial** → 03b.7
5. `admin-and-teacher` - **partial** → 03b.9 (header-only) + deferred
6. `api-modules-workers-emails` - **partial** → 03b.8 + 03c (deferred)
7. `prisma-seeds-scripts-tests` - DONE (no user-facing copy)

## Requirements
- Each module gets one focused commit: `feat(i18n): migrate [module-name] to i18n keys`.
- Use English keys and English default messages.
- Vietnamese locale mirrors all keys with Vietnamese translations.
- No raw Vietnamese in migrated runtime source.

## Implementation Steps
1. Run impact analysis before editing exported functions/components.
2. Migrate one module at a time.
3. Run focused grep after each module.
4. Commit module changes separately.

## Success Criteria
- Source grep count decreases to zero outside locale files.
- Module commits are focused and ordered.

## Risk Assessment
- Broad UI strings can affect tests and screenshots; update tests to English copy.

## Security Considerations
- API error messages stay generic and do not leak internals.

## Unresolved Questions
- None.

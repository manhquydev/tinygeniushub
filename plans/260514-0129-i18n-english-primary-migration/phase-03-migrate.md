# Phase 03 - Migrate

## Overview
- Priority: high
- Status: complete
- Replace Vietnamese hardcoded runtime strings module by module.

## Migration Modules
1. `layout-and-shared-ui` - complete
2. `public-marketing-and-legal-pages` - complete
3. `auth-parent-and-dashboard` - complete
4. `courses-and-kid-learning` - complete
5. `admin-and-teacher` - complete
6. `api-modules-workers-emails` - complete
7. `prisma-seeds-scripts-tests` - complete

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

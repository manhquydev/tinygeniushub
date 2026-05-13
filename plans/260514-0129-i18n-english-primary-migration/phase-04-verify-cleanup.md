# Phase 04 - Verify and Cleanup

## Overview
- Priority: high
- Status: pending
- Prove English default mode and clean repository state.

## Requirements
- Start full stack.
- Verify major UI screens with Playwright screenshots.
- Check API errors, email templates, validation, empty/loading/error states.
- Check console for missing i18n keys.
- Run lint/build and source grep.
- Push commits and create GitHub PR.

## Commands
- `pnpm lint`
- `pnpm build`
- `pnpm test`
- `pnpm exec playwright test` or focused i18n visual spec
- Source grep excluding `locales/`

## Success Criteria
- Lint exits 0.
- Build exits 0.
- Grep finds zero hardcoded Vietnamese strings in runtime source outside locale files.
- Screenshots show English default UI.
- Git status clean.
- Commits pushed.
- PR created with module list and evidence.

## Risk Assessment
- Full e2e suite may require seeded local accounts and full Docker stack.

## Security Considerations
- Do not commit `.env`, cookies, temp auth payloads, or generated secrets.

## Unresolved Questions
- None.

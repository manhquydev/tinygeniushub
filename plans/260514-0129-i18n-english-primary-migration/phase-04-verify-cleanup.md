# Phase 04 - Verify and Cleanup

## Overview
- Priority: high
- Status: blocked on `phase-03b-rewire-ui-surfaces.md`
- Prove English default mode AND VI locale switching, then clean repository state.
- Outcome 2026-05-14: EN default mode PASSES; VI locale switching FAILS across cookie banner, auth, marketing, legal, parent, kid, admin, API. See `reports/verification-report.md`. Phase 03b is the remediation track; Phase 04 will re-run after each 03b subphase commits.

## Re-verification trigger
After each 03b subphase ships, re-run:
- `node plans/260514-0129-i18n-english-primary-migration/reports/count-wired-files.mjs` — expect monotonic increase from 19 → ~150.
- `curl --cookie "tgh_locale=vi" http://localhost:3000/<route>` for that subphase — body diff must show VI.
- Playwright screenshot pair `<route>-en.png` vs `<route>-vi.png` for the surface.

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

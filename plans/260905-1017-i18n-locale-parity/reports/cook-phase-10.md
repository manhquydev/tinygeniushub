# Cook Phase 10 — E2E regression

**Plan:** `plans/260905-1017-i18n-locale-parity`  
**Date:** 2026-09-05

## Outcome

Specs added. Translator unit tests pass. `ignoreBuildErrors` attempted by p10e2e was **reverted**. `tsc --noEmit` clean after auth-form `t.rich` tag functions fix.

## Files

- Modify: `tests/e2e/language-switching.spec.ts` — 404 vi, login form vi, dashboard mix (skip if demo login fails), keep guest + route-preserve tests
- Modify: `src/i18n/translator.test.ts` — notFound, auth.form, activity.heading
- Modify: `src/components/auth-form.tsx` — `t.rich` values must be `RichTagsFunction`, not `Element` (TS2322; blocked next build/hydration)

## Verification

- `pnpm exec vitest run src/i18n/translator.test.ts` — 7 passed
- `pnpm exec tsc --noEmit` — 0 errors
- `pnpm check:i18n` — warnings only on pre-existing `scripts/i18n/*` and seed (not exclusive src UI)
- `pnpm test:e2e:i18n` — p10e2e first run 5 failed (missing Chromium, then HMR/hydration on `next dev`). Coordinator did not ignore TS errors. Full `next build` + Playwright not re-run in this turn after tsc fix.

## Unresolved

Playwright i18n e2e still needs a production `next start` after the auth-form type fix. Guest switcher tests require client hydration.

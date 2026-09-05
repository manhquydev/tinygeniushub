---
title: "Phase 10: E2E regression"
status: todo
priority: P1
effort: "3h"
dependencies: [1, 2, 3, 4, 5, 6, 7, 8, 9]
---

# Phase 10: E2E regression

## Overview
Extend `tests/e2e/language-switching.spec.ts`. Guest spec today has no parent login (`tests/e2e/language-switching.spec.ts:15-49`).

## Related Code Files
- Modify: `tests/e2e/language-switching.spec.ts`
- Modify: `src/i18n/translator.test.ts`
- Reuse demo parent from `tests/e2e/kid-course-lesson-flow.spec.ts` (`demo.parent@tinygeniushubvn.tech`) for dashboard test.

## Implementation Steps
1. Keep existing guest home switch.
2. Required: cookie vi + unknown URL → `specialPages.notFound.title` VI. 404 page has no switcher; set cookie via `context.addCookies`.
3. Required: `/auth/login` + vi → form copy from `auth.form`.
4. Required if demo parent works locally: `/parent/dashboard` + vi → activity heading VI. If login fixture fails, document skip — 404+login still gate the phase.
5. `pnpm test:e2e:i18n` and `pnpm check:i18n`. No full e2e suite.

## Todo
- [ ] 404 vi via addCookies
- [ ] login form vi
- [ ] dashboard mix if demo parent available
- [ ] check:i18n
- [ ] translator tests new keys

## Success Criteria
- [ ] `pnpm test:e2e:i18n` pass
- [ ] `pnpm check:i18n` pass

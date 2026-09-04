---
title: "Phase 5: Tests + doc cutover"
status: done
phase: 5
priority: P1
effort: "1d"
dependencies: [3, 4]
---

# Phase 5: Tests + doc cutover

## Overview

Remove dual-read on kernel lesson access. Tests for household ticket vs per-child progress. Docs already ADR-first; scrub remaining plan contradictions only.

## Requirements

- Functional: access = ticket only (plus `trialEnabled` lessons when household trial ticket ACTIVE)
- Tests: unit entitlement; webhook grant idempotency; complete 403 without ticket; two children independent completions
- Do not run full Playwright suite as a plan gate; `pnpm test` on touched files + existing learning/billing tests

## Architecture

Delete enrollment-OR in `assertCanLearn` from phase 3. Keep CourseEnrollment as purchase history, not gate.

Backfill must have run (phase 3 step 0). If count of ACTIVE enrollments without ticket > 0, fail cutover.

## Related Code Files

- Modify: entitlement assert helper from phase 3
- Tests: `src/modules/entitlement/__tests__/*`, learning completion tests
- Docs: only if code names differ from ADR — patch ADR field names, do not invent new decisions

## Implementation Steps

1. SQL/script: backfill leftover enrollments → tickets.
2. Flip assertCanLearn to ticket-only.
3. Tests listed above.
4. `pnpm test` for entitlement/learning/billing.

## Todo

- [x] Backfill
- [x] Remove dual-read
- [x] Tests
- [x] Align ADR field names if Prisma names drifted

## Success Criteria

- [x] No `CourseEnrollment` in canAccess implementation
- [x] `pnpm test` passes for new + modified tests
- [x] ADR still accepted and matches code symbols

## Risk Assessment

| Risk | Signal | Response |
|---|---|---|
| Backfill miss | 403 on paying parent | hold cutover; log unmatched enrollment ids |

## Security Considerations

Confirm Abeka POST still authed after refactors.

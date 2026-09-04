# Cook phase 03 — access cutover + Abeka auth

Date: 2026-09-04
Phase: `plans/260904-1103-platform-kernel/phase-03-access-cutover-learning.md` (status: done)
ADR: `docs/decisions/260904-1102-platform-kernel.md`

## Outcome

Kernel learn paths gate inside domain services. `kid/today/page.tsx:82` still calls `getRealKidGardenMission` directly; that function (and `getTodayMission`) now dual-read tickets / enrollment / trial. Watch + complete use `assertCanLearn`. Abeka POSTs need parent session. Unsigned package-subscription webhook HMAC-locked; no entitlement grants there.

## Files

Created:

- `src/modules/entitlement/assert-can-learn.ts` (142)
- `src/modules/entitlement/backfill-grants.ts` (60)
- `src/modules/content/mission-query.ts` (193)
- `src/lib/auth/require-parent-child.ts` (20)
- `scripts/backfill-entitlement-grants.ts` (11)
- tests: `assert-can-learn.test.ts`, `backfill-grants.test.ts`, `service.access.test.ts`, `package-subscription/route.test.ts`, `curriculum/complete/route.test.ts`, `require-parent-child.test.ts`

Modified:

- `src/modules/content/service.ts` (77) — `getTodayMission` + `getRealKidGardenMission` both `loadHouseholdLearnAccess` then union course window + track missions
- `src/modules/learning/completion-service.ts` — `assertCanLearn` before complete; subscription optional (retention default 90d)
- `src/modules/learning/video-watch-service.ts` — session start uses `assertCanLearn`
- `src/app/api/curriculum/complete/route.ts`, `src/app/api/abeka/progress/watch/route.ts`, `src/app/api/abeka/plans/journeys/route.ts` — `getParentFromRequest` via `requireParentAndOwnedChild`
- `src/app/api/webhooks/package-subscription/route.ts` — HMAC `x-provider-signature`; prod unsigned → 404; else 401

New domain files ≤200. `completion-service.ts` / `video-watch-service.ts` / webhook / curriculum complete already over 200 before this phase.

## Behavior

- Dual-read: live ticket (`canAccess`) OR `CourseEnrollment` for lesson's course OR (`trialEnabled` && household TRIALING/TRIAL). Trial + pass ticket still 403 `TRIAL_LESSON_RESTRICTED` on non-trial lessons. No ticket/enrollment/trial → 403 `LEARN_ACCESS_DENIED`.
- Household ticket: both children of same parent pass `assertCanLearn`; completions stay on `childId`.
- Today: `platform:pass` / track tickets fill track missions even with zero enrollments. Union entitled course ids (enrollment ∪ `course:*` tickets).
- Abeka POST complete/watch/journeys: no cookie → 401; child not owned → 403. GETs unchanged. No Abeka→Lesson importer.
- Backfill: ACTIVE enrollments → course offering ticket; TRIALING/ACTIVE_STANDARD/ACTIVE_FAMILYPLUS subscriptions → `platform-pass` (`validUntil` = period end). Idempotent via `grant*InTx`.
- Package-subscription webhook does **not** call grant helpers.

## Verification

```
pnpm exec vitest run \
  src/modules/entitlement/__tests__/assert-can-learn.test.ts \
  src/modules/entitlement/__tests__/backfill-grants.test.ts \
  src/modules/entitlement/__tests__/entitlement-service.test.ts \
  src/modules/entitlement/__tests__/grant-from-billing.test.ts \
  src/modules/content/__tests__/service.access.test.ts \
  src/modules/learning/__tests__/completion-service.test.ts \
  src/modules/learning/__tests__/video-watch-service.test.ts \
  src/app/api/webhooks/package-subscription/route.test.ts \
  src/app/api/curriculum/complete/route.test.ts \
  src/lib/auth/__tests__/require-parent-child.test.ts
✓ 60 tests
```

Project-wide lint/test/e2e skipped per request.

Reviewer (`reviewer`): overall_correctness=correct, confidence 0.86. Dual-read + today union + HMAC 401/404 + Abeka POST 401 + no Entitlement writes on package webhook. COOK go.

`code-reviewer` (Opus) rate-limited; used `reviewer`.

## Non-goals held

- No Abeka content → `Lesson`.
- No Stripe Billing `mode=subscription` (phase 4).
- No garden daily challenge.
- Dual-read kept (phase 5 removes enrollment OR after backfill count = 0).
- Abeka GET routes still unauthenticated.

## Unresolved questions

- Run `tsx scripts/backfill-entitlement-grants.ts` on live DBs before treating tickets as sole access?
- Split pre-existing >200 files (`completion-service.ts`, `video-watch-service.ts`, package-subscription webhook, curriculum complete) later?
- Auth Abeka GET watch/journeys in a later hardening pass?

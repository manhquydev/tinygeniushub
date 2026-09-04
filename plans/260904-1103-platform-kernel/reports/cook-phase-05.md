# Cook phase 05 — tests + doc cutover

Date: 2026-09-04
Phase: `plans/260904-1103-platform-kernel/phase-05-tests-doc-cutover.md` (status: done)
ADR: `docs/decisions/260904-1102-platform-kernel.md`

## Outcome

Kernel learn access is ticket-only. `CourseEnrollment` is purchase history, not a gate. `canAccess` / `assertCanLearn` have no `CourseEnrollment`. Today/kid missions use ticket `course:*` ids only. Trial: covering ticket + household TRIALING/TRIAL unlocks `trialEnabled` lessons; non-trial lessons stay 403 `TRIAL_LESSON_RESTRICTED`. Backfill leftover enrollments → course tickets; leftover count > 0 fails cutover (`CUTOVER_ENROLLMENTS_UNMATCHED`).

## Files

Modified:

- `src/modules/entitlement/assert-can-learn.ts` (124) — drop enrollment OR; `loadHouseholdLearnAccess.courseIds` from tickets only
- `src/modules/entitlement/backfill-grants.ts` (95) — after grants, fail if enrollment lacks live `course:*` ticket
- `src/modules/entitlement/__tests__/assert-can-learn.test.ts` — household share; deny without ticket; deny enrollment-only; trial ticket + `trialEnabled`
- `src/modules/entitlement/__tests__/backfill-grants.test.ts` — leftover unmatched fails cutover
- `src/modules/entitlement/__tests__/grant-from-billing.test.ts` — course grant does not duplicate live ticket
- `src/modules/learning/__tests__/completion-service.test.ts` — two children independent completions; 403 without ticket kept

ADR not patched: Prisma names (`Offering`, `Entitlement`, `CourseEnrollment`, `Lesson`) match. `CourseEnrollment` has no status field; all rows treated as live purchase history.

## Behavior

- Access: `canAccess` ticket covering the lesson. Trial household + ticket + `!trialEnabled` → 403 `TRIAL_LESSON_RESTRICTED`. No ticket → 403 `LEARN_ACCESS_DENIED`. Enrollment does not allow.
- Today: tracks from `platform:pass` / `track:*` tickets; course window from `course:*` tickets. Enrollment ids not unioned.
- Completions stay on `childId` (`childId_lessonId`). Household ticket shared.
- Backfill: enrollments → `grantCourseOfferingInTx`; live subscriptions → `grantPlanOfferingInTx`; then leftover check.
- Webhook grant still idempotent: duplicate `provider+eventId` skips create; live ticket extended not duplicated.
- Abeka POST complete/watch/journeys still `requireParentAndOwnedChild` (401 without session). Not refactored this phase.

## Verification

```
pnpm exec vitest run \
  src/modules/entitlement/__tests__/assert-can-learn.test.ts \
  src/modules/entitlement/__tests__/backfill-grants.test.ts \
  src/modules/entitlement/__tests__/entitlement-service.test.ts \
  src/modules/entitlement/__tests__/grant-from-billing.test.ts \
  src/modules/learning/__tests__/completion-service.test.ts \
  src/modules/learning/__tests__/video-watch-service.test.ts \
  src/modules/billing/__tests__/webhook-service.test.ts \
  src/modules/content/__tests__/service.access.test.ts \
  src/app/api/curriculum/complete/route.test.ts
✓ 69 tests
```

Full e2e skipped per request.

Reviewer (`reviewer`): overall_correctness=correct, confidence 0.86. Ticket-only access, leftover fail-closed, household share, per-child complete, 403 without ticket, grant idempotency, Abeka POST authed. COOK go.

## Non-goals held

- `CourseEnrollment` model kept (checkout/webhook/admin/certificates).
- No Abeka → `Lesson` importer.
- Abeka GET still unauthenticated.
- Did not run Playwright / full `pnpm test`.

## Unresolved questions

- Run `tsx scripts/backfill-entitlement-grants.ts` on live DBs before deploy; script now exits non-zero if unmatched enrollment ids remain.
- Auth Abeka GET watch/journeys in a later hardening pass?

# Cook phase 01 — entitlement schema + service

Date: 2026-09-04
Phase: `plans/260904-1103-platform-kernel/phase-01-start.md` (status: done)
ADR: `docs/decisions/260904-1102-platform-kernel.md`

## Outcome

Household ticket module landed. No HTTP cutover. Billing/learning routes untouched.

`canAccess({ parentId, lessonId, childId? })` is parent-scoped. `childId` only checks ownership. Progress not written here.

## Files

Created:

- `src/modules/entitlement/offering-types.ts` (21)
- `src/modules/entitlement/catalog-key.ts` (99)
- `src/modules/entitlement/entitlement-service.ts` (142)
- `src/modules/entitlement/__tests__/entitlement-service.test.ts` (144)
- `prisma/migrations/20260904110300_add_offering_entitlement/migration.sql`

Modified:

- `prisma/schema.prisma` — `OfferingKind`, `EntitlementStatus`, `Offering`, `Entitlement`; `ParentAccount.entitlements`; `PaymentRecord.entitlements`
- `prisma/seed.ts` — `seedOfferings()`: `platform:pass` RECURRING, `track:ENGLISH` / `track:MATH` ONE_TIME_PROGRAM

All listed TS files ≤200 lines.

## Behavior

- Grant: Serializable tx, P2034 retry ×3. Live unique `(parentId, offeringId)` for ACTIVE/GRACE. Expired then new row allowed.
- Expire: parent-scoped status → EXPIRED.
- List: all tickets for parent + offering.
- Catalog keys for existing Lesson: always `platform:pass`; `track:<TrackCode>` from `Lesson.unit.level.track.code`; `course:<id>` from `CourseLesson.courseId`; `course:<id>:level:<levelId>` from `Lesson.unit.level.id` (not `CourseLesson.orderNo`).
- Missing lesson → `[]` → deny.
- `platform:pass` covers all kernel Lesson ids.
- `course:<id>` covers `course:<id>:level:*`.
- Time window: `validFrom <= now` and (`validUntil` null or `> now`).

## Verification

```
pnpm exec vitest run src/modules/entitlement/__tests__/entitlement-service.test.ts
✓ 5 tests (household share, other parent denied, expiry, level id vs orderNo, grant-after-expire)
```

Project-wide lint/test skipped per request.

Reviewer (`reviewer`): overall_correctness=correct, confidence 0.91. Live unique + fail-closed + level id + no HTTP confirmed.

`prisma generate` succeeded after `pnpm install`. Migration SQL not applied to a live DB in this cook (no `migrate deploy`).

## Non-goals held

- No routes.
- No billing/learning route edits.
- Trial ENGLISH+MATH not hardcoded in `canAccess`.
- No child-scoped ticket column.

## Unresolved questions

- Apply `20260904110300_add_offering_entitlement` on local/dev DB before phase 2?
- Dual-write from billing webhooks is phase 2; existing `CourseEnrollment` still gates access until phase 3.

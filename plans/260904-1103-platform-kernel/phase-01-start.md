---
title: "Phase 1: Entitlement schema + service"
status: done
phase: 1
priority: P1
effort: "1d"
dependencies: []
---

# Phase 1: Entitlement schema + service

## Overview

Add `src/modules/entitlement/` and Prisma models. No HTTP cutover yet. Files ≤200 lines.

## Requirements

- Functional: household ticket CRUD; `canAccess({ parentId, lessonId })`; list tickets for parent
- Non-functional: no child-scoped ticket rows; ≤200 LOC per file

## Architecture

Models (names may match Prisma style):

- `Offering`: `id`, `code` unique, `kind` enum `RECURRING | ONE_TIME_PROGRAM | ONE_TIME_LEVEL`, `catalogKey` string (e.g. `platform:pass`, `track:ENGLISH`, `course:<id>`, `course:<id>:level:<id>`), `stripePriceId` nullable, `active` bool
- `Entitlement`: `id`, `parentId` → `ParentAccount`, `offeringId`, `status` `ACTIVE | GRACE | CANCELED | EXPIRED`, `validFrom`, `validUntil` nullable (null = no expiry), `sourcePaymentId` nullable
- Unique `(parentId, offeringId)` where status in active/grace — enforce in service with Serializable tx like `children-service.ts:31-71`

`canAccess`: session `parentId` must own the child if a childId is passed. Resolve lesson → keys: always `platform:pass`; plus `track:<TrackCode>` from `Lesson.unit.level.track.code` (`content/service.ts:50-58`); plus `course:<courseId>` from `CourseLesson.courseId` (`schema.prisma:1063-1066`); plus `course:<courseId>:level:<levelId>` using `Lesson.unit.level.id` (not `CourseLesson.orderNo`). True if any ACTIVE/GRACE entitlement matches `platform:pass` or an exact/prefix catalog key (`course:<id>` covers `course:<id>:level:*`).


Trial: do not hardcode ENGLISH+MATH in entitlement module; seed offerings.

## Related Code Files

- Create: `src/modules/entitlement/entitlement-service.ts`, `catalog-key.ts`, `offering-types.ts`, `__tests__/entitlement-service.test.ts`
- Modify: `prisma/schema.prisma` (append models; `ParentAccount` relation)
- Delete: none

## Implementation Steps

1. Add Prisma models + migrate.
2. Seed offerings: `platform:pass` RECURRING, `track:ENGLISH`, `track:MATH` ONE_TIME_PROGRAM (or covered by pass).
3. Implement grant/expire/`canAccess` with tests: two children same parent share ticket; other parent denied; expired denied; progress still per child (no write here).
4. Do not call from routes yet.

## Todo

- [x] Prisma models + migration
- [x] catalogKey resolver from Lesson
- [x] entitlement-service grant/canAccess/expire
- [x] unit tests household share + expiry

## Success Criteria

- [x] Tests prove parent-scoped ticket, child-agnostic access
- [x] No route behavior change

## Risk Assessment

| Risk | Signal | Response |
|---|---|---|
| Lesson has no track/course mapping | resolver returns [] | fail closed (deny) except explicit trial flag path in phase 3 |
| Unique constraint vs multiple historical tickets | grant of expired+new | allow new row; canAccess only ACTIVE/GRACE |

## Security Considerations

Tickets never granted from client-supplied parentId without the authenticated parent matching (enforced in phase 2 routes). Service still takes parentId explicitly.

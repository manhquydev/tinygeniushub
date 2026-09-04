---
title: "Phase 3: Access cutover + Abeka auth"
status: done
phase: 3
priority: P1
effort: "1d"
dependencies: [2]
---

# Phase 3: Access cutover + Abeka auth

## Overview

Kernel learn paths use `canAccess` **inside domain services**, not only HTTP routes. Kid RSC `src/app/(kid-app)/kid/today/page.tsx:82-85` calls `getRealKidGardenMission` directly and bypasses `/api/lessons/today`. Abeka mutating routes require parent session + child ownership. No Abeka→Lesson importer.

## Requirements

- Functional: learn access enforced in `getRealKidGardenMission` (`src/modules/content/service.ts:159-175` currently keys **only** `courseEnrollment`) and in watch/complete services
- Functional: Abeka POST complete/watch/journeys use `getParentFromRequest` (`src/lib/auth/session.ts:120`) + child.parentId check
- Functional: unsigned `POST /api/webhooks/package-subscription` (`route.ts:51-107`) must **not** grant entitlements; return 401/404 in production or require HMAC — do not leave as paid-access hole
- Non-functional: do not add `/api/abeka/*/complete` as a second learning kernel

## Architecture

Put `assertCanLearn` / ticket filter in:

- `getRealKidGardenMission` and `getTodayMission` (`src/modules/content/service.ts`) — **required**, because `kid/today/page.tsx:82` and `lessons/today/route.ts:20` both call the service
- `src/modules/learning/video-watch-service.ts` session start
- `src/modules/learning/completion-service.ts:183-246` before complete

Dual-read **only this phase**: allow if ticket OR (`CourseEnrollment` for that lesson's course) OR (`trialEnabled` && household trial ticket). Phase 5 removes enrollment OR **only after** backfill: count ACTIVE enrollments without ticket = 0.

Abeka: `src/app/api/curriculum/complete/route.ts:22-61` currently no session — add parent auth. Same for `src/app/api/abeka/progress/watch/route.ts`, `src/app/api/abeka/plans/journeys/route.ts`.

Today: if `platform:pass` or track tickets exist, union `getTodayMission` (`service.ts:68-129`) with entitled course window. Do not leave enrollment-only empty today for pass holders.

## Related Code Files

- Modify: `src/modules/content/service.ts`, `src/app/api/lessons/today/route.ts`, `src/app/(kid-app)/kid/today/page.tsx` (only if it duplicates logic — prefer service), `src/modules/learning/completion-service.ts`, `src/modules/learning/video-watch-service.ts`, Abeka/curriculum POST routes, `src/app/api/webhooks/package-subscription/route.ts`
- Tests: `src/modules/learning/__tests__/completion-service.test.ts`, `video-watch-service.test.ts`, new content-service access tests



## Implementation Steps

1. Backfill: for each ACTIVE `CourseEnrollment` and ACTIVE/TRIALING `Subscription`, grant matching ticket if missing.
2. Helper `assertCanLearn({ parentId, childId, lessonId })` — child belongs to parent, then canAccess (dual-read this phase).
3. Filter inside `getRealKidGardenMission` / `getTodayMission`; wire watch + complete.
4. Today: union entitled track missions + entitled course missions.
5. Auth Abeka writes; 401/403 without session.
6. Lock `package-subscription` webhook: HMAC required or 404 in production.
7. Do not implement garden daily challenge.


## Todo

- [x] assertCanLearn
- [x] watch/complete gates
- [x] today union
- [x] Abeka POST auth
- [x] tests deny without ticket

## Success Criteria

- [x] Complete without ticket → DomainError 403
- [x] Two children same parent: both can play if house has ticket; completions stay separate
- [x] Abeka complete without cookie → 401

## Risk Assessment

| Risk | Signal | Response |
|---|---|---|
| Today empty for enrolled-only users before grant backfill | no tickets on old parents | backfill job: for each ACTIVE CourseEnrollment/Subscription, grant matching ticket (phase 2.5 in this phase step 0) |
| Kid pages skip API | UI still shows locked lessons | gate API first; UI uses 403 |

## Security Considerations

IDOR: `childId` in body must match parent. Adaptive review-queue IDOR is out of scope unless touched; do not expand.

---
title: "Phase 4: plant journey + tests"
status: pending
phase: 4
priority: P1
effort: "4h"
dependencies: [1, 2, 3]
---

# Phase 4: Plant journey + tests

## Overview

Plant if parent owns child **and** `listLiveCourseIds` contains exact `courseId`. Enrollment not required. Do not drop `assertChildOwnedByParent`.

## Requirements

- Plant allowed: owned child + exact program ticket
- Level ticket for that course → 403
- No ticket → 403 `COURSE_TICKET_REQUIRED`
- Foreign `childId` → 404 `CHILD_NOT_FOUND`, no row
- `sourceEnrollmentId` attached only if `findFirst({ id, parentId, courseId })` hits; else ignore/400 — never persist client id unchecked
- Keep `assertChildOwnedByParent` in the same transaction

## Architecture

`src/modules/garden/assert-course-ticket.ts` wraps `listLiveCourseIds`. `createJourneyFromCourse` calls ownership + ticket assert; optional ledger attach.

## Related Code Files

- Create: `src/modules/garden/assert-course-ticket.ts` + test
- Modify: `src/modules/garden/journey-service.ts`

## Implementation Steps

1. Assert helper using exact course id.
2. Wire plant; keep ownership.
3. Slice vitest.

## Todo

- [ ] assert helper
- [ ] plant tickets + ownership + enrollment attach guard
- [ ] vitest slice green

## Success Criteria

- [ ] Plant ticket-only + owned child → journey
- [ ] Plant foreign child → 404
- [ ] Plant level-ticket → 403
- [ ] Foreign sourceEnrollmentId not attached

---
title: "Phase 1: ticket course-id helper"
status: pending
phase: 1
priority: P1
effort: "3h"
dependencies: []
---

# Phase 1: Ticket course-id helper

## Overview

Export `listLiveCourseIds(parentId)` from `src/modules/entitlement/course-tickets.ts`. Exact `course:{id}` keys only.

## Requirements

- Live ACTIVE/GRACE + `isCurrentlyValid(validFrom, validUntil)` same as `loadHouseholdLearnAccess`
- Include id only when `offering.catalogKey === courseCatalogKey(id)` (`course:{uuid}`)
- Exclude `course:{id}:level:{levelId}` — level ticket must not produce a Course id
- Exclude `platform:pass` and `track:*`
- Empty result: return `[]`. Never `findMany({ id: { in: [] } })` without short-circuit

## Architecture

Do not reuse sliced `loadHouseholdLearnAccess.courseIds` as the listing primitive (that slice is for lesson-window keys). New helper. Import `courseCatalogKey` from `catalog-key.ts`.

## Related Code Files

- Create: `src/modules/entitlement/course-tickets.ts`
- Create: `src/modules/entitlement/__tests__/course-tickets.test.ts`

## Implementation Steps

1. Implement helper.
2. Tests: program ticket → [id]; level ticket → []; expired → []; pass-only → [].

## Todo

- [ ] `listLiveCourseIds`
- [ ] unit tests

## Success Criteria

- [ ] Level ticket does not yield a course id
- [ ] File ≤200 lines

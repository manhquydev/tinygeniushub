---
title: "Phase 3: garden and parent lists"
status: pending
phase: 3
priority: P1
effort: "5h"
dependencies: [1]
---

# Phase 3: Garden and parent lists

## Overview

List **ticketed published courses as themselves**. Do not rewrite plot slug to `bundle.entryCourseSlug`. New DTO: course + child journey. No `enrollmentId` / `enrolledAt` / `completedAt`.

## Requirements

- One garden row per ticketed published course id (not per enrollment)
- Sort by ticket `validFrom` then title — not enrolledAt
- Plot `course.slug` is the ticketed course slug, never forced entry monolith
- GET `/api/courses/enrolled`: 404 unless child owned by parent
- Mock checkout: `grantCourseOfferingInTx` on **both** bundle loop and single-course `enrollParent` paths in `mock-success/route.ts`
- Mock checkout: `grantCourseOfferingInTx` in same tx as enrollment upsert

## Architecture

`src/modules/courses/entitled-course-lists.ts`. Garden page and enrolled API consume it. Parent courses page uses a parent DTO without ledger fields (`getParentEnrollments` remains for certificates/admin).

## Related Code Files

- Create: `src/modules/courses/entitled-course-lists.ts` + tests
- Modify: garden page, parent courses page, enrolled route, mock-success route

## Implementation Steps

1. List helper + DTO.
2. Switch call sites.
3. Mock-success grants.
4. Tests: ticket ids; unpublished excluded; empty in[]; mock grant.

## Todo

- [ ] list helpers without enrollment timestamps
- [ ] switch call sites
- [ ] mock-success grants
- [ ] tests

## Success Criteria

- [ ] Garden does not import `getEnrolledCoursesForKidDashboard`
- [ ] Parent courses listing not `getParentEnrollments`
- [ ] Mock checkout yields live `course:{id}` ticket

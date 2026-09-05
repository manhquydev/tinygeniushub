---
title: "Phase 2: kid course access APIs"
status: pending
phase: 2
priority: P1
effort: "4h"
dependencies: [1]
---

# Phase 2: Kid course access APIs

## Overview

`hasAccess` iff the **resolved course.id** is in `listLiveCourseIds`. Never OR other bundle members. Never remap a bundle-root slug onto the legacy monolith (`littlefox` / `abeka`) just because a split SKU is ticketed.

## Requirements

- Ticket for course A → hasAccess only on slug that resolves to A
- Ticket for A does **not** unlock sibling B or bundle-root monolith lessons
- Enrollment without ticket → hasAccess false
- Unpublished course: no access even with ticket (check `isPublished`)
- GET enrollment: `{ enrolled: hasAccess, enrollment: ledger | null }` — do not 403 on null ledger
- Lessons 403 code `LEARN_ACCESS_DENIED`
- Parent leftover player `src/app/(main)/courses/[slug]/lessons/page.tsx` also uses `listLiveCourseIds`; enrollment-only redirects away

## Architecture

Delete `courseEnrollment` queries in `kid-course-access.ts`. Keep slug→course lookup. If requested slug is a bundle root (`getCourseBundleByRootSlug`) **do not** swap to `entryCourseSlug` for lesson dump. Return `hasAccess: false` for bundle-root unless that root's own course id is ticketed.

## Related Code Files

- Modify: `src/modules/courses/kid-course-access.ts`
- Create: `src/modules/courses/__tests__/kid-course-access.test.ts`
- Modify: `src/app/api/courses/[slug]/lessons/route.ts` (error copy)
- Modify: `src/app/(main)/courses/[slug]/lessons/page.tsx`

## Implementation Steps

1. hasAccess = published && ids.has(course.id)
2. Tests: ticket A 403 slug B; split ticket does not return monolith lessons; enrollment-only deny; ticket-only allow.

## Todo

- [ ] resolveKidCourseAccess tickets, no bundle OR
- [ ] parent lessons page ticket gate
- [ ] tests

## Success Criteria

- [ ] No `prisma.courseEnrollment` in `kid-course-access.ts`
- [ ] Tests prove sibling SKU 403

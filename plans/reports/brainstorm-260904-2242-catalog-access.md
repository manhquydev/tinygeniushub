---
title: brainstorm-catalog-access
date: 2026-09-04
---

# Brainstorm: next kernel slice

## Contract

- **Outcome:** Household with a live `course:*` ticket can open kid garden, kid course garden, and parent courses without a `CourseEnrollment` row. Household without that ticket cannot.
- **Constraints:** ADR `260904-1102-platform-kernel`. Reuse `loadHouseholdLearnAccess.courseIds`. Files ≤200 for new/touched logic. Dual-write checkout stays. No VPS.
- **Non-goals:** Abeka adapter, seed fake course SKU, child login, `/pricing`, certificates rewrite, offering admin CMS.
- **Acceptance:**
  1. `resolveKidCourseAccess.hasAccess` true iff live ticket covers that course (or bundle member).
  2. Garden dashboard lists published courses from tickets, not enrollments.
  3. Parent `/parent/courses` lists ticket-covered courses.
  4. GET enrolled/lessons 403 without ticket.
  5. Enrollment-only (no ticket) denied.
  6. Unit tests for 1–5. CourseEnrollment still written on PayOS success.

## Options

| # | Approach | Worst case |
|---|---|---|
| A | Cutover list+access helpers to tickets; keep enrollment as ledger | Garden empty for trial (honest) |
| B | Dual-read ticket OR enrollment | Cutover never finishes; ADR violation |
| C | A + seed demo course ticket | Fake catalog in kernel seed; extra SKU |

**Recommend A.** B fails ADR. C is product, not kernel.

## Direction

Extract ticket course-id listing next to entitlement. Point garden/parent/kid-course-access at it. If `createJourneyFromCourse` still requires enrollment, gate plant with the same ticket helper or dual-write is already there for paid checkout — trial never plants a course.

## Unresolved

- Plant-journey without enrollment: include in this plan (yes if garden CTA plants) or leave for later.

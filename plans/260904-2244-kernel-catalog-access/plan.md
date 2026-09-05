---
title: "kernel-catalog-access"
description: "Cut kid garden, kid course pages, parent courses, and plant-journey over to household course tickets. CourseEnrollment stays purchase history."
status: done
priority: P1
effort: "2d"
tags: [kernel, entitlement, garden, courses]
blockedBy: [260904-1103-platform-kernel, 260904-1940-local-kernel-loop]
blocks: []
created: 2026-09-04
---

# kernel-catalog-access

## Overview

On main, today/player already use tickets. Kid garden, `/kid/courses/[slug]`, parent courses, enrolled APIs, and garden plant still key off `CourseEnrollment`. This plan makes those surfaces ticket-SoT. Checkout still dual-writes enrollment.

Authority: `docs/decisions/260904-1102-platform-kernel.md`. Brainstorm: `plans/reports/brainstorm-260904-2242-catalog-access.md`. Completeness: `plans/reports/260904-2242-kernel-completeness.md`.

## Goals

| # | Goal | Priority |
|---|------|----------|
| 1 | Live `course:*` ticket ⇔ kid course access | P1 |
| 2 | Garden + parent courses list from tickets | P1 |
| 3 | Plant journey requires ticket, not enrollment row | P1 |
| 4 | Enrollment-only denied; ticket-only allowed | P1 |

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | [Ticket course-id helper](./phase-01-start.md) | Done |
| 2 | [Kid course access APIs](./phase-02-kid-course-access.md) | Done |
| 3 | [Garden and parent lists](./phase-03-catalog-lists.md) | Done |
| 4 | [Plant journey + tests](./phase-04-plant-and-tests.md) | Done |

## Success Criteria

- [x] `resolveKidCourseAccess.hasAccess` uses live tickets for the resolved course id only
- [x] Garden lists tickets, not enrollments
- [x] Parent courses lists ticket-covered published courses
- [x] GET `/api/courses/enrolled` and `/api/courses/[slug]/lessons` ticket-gated
- [x] `createJourneyFromCourse` denies without ticket; does not require enrollment id
- [x] Tests: ticket-only allow, enrollment-only deny, sibling slug deny, pass does not unlock Course
- [x] `CourseEnrollment` still written on PayOS/course webhook (ledger)
- [x] Mock checkout dual-writes course tickets via grantCourseOfferingInTx

## Out of scope

Abeka adapter, seed demo Course SKU, certificates by enrollmentId, admin revenue, `/pricing`, child login, VPS.

<!-- slug: kernel-catalog-access -->

## Red Team Review

### Session — 2026-09-04
**Findings:** 15 (14 accepted, 1 rejected)
**Severity breakdown:** 4 Critical, 8 High, 3 Medium

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Mock checkout no ticket grant | Critical | Accept | Phase 3 |
| 2 | Enrolled API no child ownership | High | Accept | Phase 3 |
| 3 | Enrollment JSON null ledger | High | Accept | Phase 2 |
| 4 | Empty `in: []` | High | Accept | Phase 1 |
| 5 | Lessons 403 copy | Medium | Accept | Phase 2 |
| 6 | Adaptive review-queue IDOR | Medium | Reject | out of scope |
| 7 | SEC-01 sibling SKU via bundle OR | Critical | Accept | Phase 2 |
| 8 | SEC-02 bundle-root→monolith remap | Critical | Accept | Phase 2 |
| 9 | SEC-03 level key parsed as program | High | Accept | Phase 1/4 |
| 10 | SEC-04 plant foreign childId | High | Accept | Phase 4 |
| 11 | SEC-05 unowned sourceEnrollmentId | Medium | Accept | Phase 4 |
| 12 | SEC-06 parent lessons page enrollment SoT | High | Accept | Phase 2 |
| 13 | A2/F2 garden entry slug vs member ticket | Critical | Accept | Phase 3 |
| 14 | F1 plant still throws COURSE_ENROLLMENT_NOT_FOUND | Critical | Accept | Phase 4 |
| 15 | F3/F4 parent/kid DTO enrollment fields | High | Accept | Phase 3 |

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01..04 after session 2 applies
- Decision deltas: exact `courseCatalogKey`; no bundle sibling unlock; no monolith remap; ticket DTO without enrolledAt; plant keeps child ownership; mock grant both paths
- Unresolved contradictions: 0

## Validation Log

### Verification Results
- **Tier:** Standard (4 phases)
- **Claims checked:** 10
- **Verified:** 10 | **Failed:** 0 | **Unverified:** 0
- `resolveKidCourseAccess` enrollment `kid-course-access.ts:54`
- Garden `getEnrolledCoursesForKidDashboard` `garden/page.tsx:44`
- Parent `getParentEnrollments` `parent/courses/page.tsx:75`
- Enrolled API `enrolled/route.ts:25`
- Lessons `resolveKidCourseAccess` `lessons/route.ts:43`
- Plant `createJourneyFromCourse` `plant/route.ts:33`
- `courseIds` excludes `:level:` `assert-can-learn.ts:67-69`
- Mock no grant `mock-success/route.ts:240-257`
- Enrolled no child ownership `enrolled/route.ts:18-28`
- `listLiveCourseIds` does not exist yet (planned create)

Locked: ticket-SoT for catalog surfaces; CourseEnrollment ledger; no Abeka/seed Course SKU.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01..04 after red-team applies
- Unresolved contradictions: 0


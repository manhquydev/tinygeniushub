---
title: kernel-completeness
date: 2026-09-04
branch: main
head: e0f7d9b7
---

# Research Report: TinyGenius Hub completeness vs kernel ADR

Internal only. No external web search — authority is ADR + current main.

## Executive Summary

Kernel v1 on main: household tickets, today/watch/complete/player ticket-gated, seed demo parent has trial `platform-pass` + child. Product still presents **course-enrollment catalog UI** (`/kid/garden`, `/kid/courses/[slug]`, `/parent/courses`). That is the next ADR gap. Abeka leftover and Skill seed are out of this cutover.

## Completeness vs ADR

| ADR law | Status |
|---|---|
| Parent-only login, child profile | Done |
| Ticket parent-scoped, progress child-scoped | Done |
| `canAccess` for learn/play | Done for today/watch/complete/video-token/secure-playback |
| Player not CourseEnrollment | Done (player APIs) |
| Catalog surfaces not CourseEnrollment | **Open** — garden, kid course page, parent courses, enrolled APIs |
| Offerings grant tickets | Done (Stripe + PayOS dual-write) |
| Abeka adapter | Out of kernel; POST authed; GET leftover |
| Files ≤200 in modules | Debt: `course-service.ts` 658, garden journey 25kB |

## Next cut (recommended)

Ticket-source **course catalog access**: `resolveKidCourseAccess`, `getEnrolledCoursesForKidDashboard`, `getParentEnrollments`, GET `/api/courses/enrolled` and `/api/courses/[slug]/lessons`. Keep `CourseEnrollment` as purchase history.

Trial `platform-pass` does not include `course:*` tickets — garden stays empty until a course offering is purchased. Honest. Do not fake a demo course SKU unless product asks.

## Non-goals this slice

Abeka importer, garden zone keys, child login, VPS, offering CMS, certificates keyed by enrollmentId, admin revenue join.

## Unresolved

- Should `platform-pass` list any Course rows in garden? ADR: kernel does not know garden. No.
- Journey plant (`resolveCourseEnrollment`) still enrollment — garden may list a course then plant 404. Must include plant path or list-only without plant.

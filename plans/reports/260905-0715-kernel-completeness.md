---
title: kernel-completeness-next-scope
date: 2026-09-05
branch: feat/kernel-catalog-access
head: 3b9c3c9e
pr: https://github.com/manhquydev/tinygeniushub/pull/13
---

# Research: completeness vs kernel ADR

Internal only. No web search. Authority: `docs/decisions/260904-1102-platform-kernel.md`.

## Executive Summary

Kernel learn-path is ticket-SoT on this branch (today/player/garden/parent-courses/plant). Local demo still **does not show tickets** and **storefront still treats enrollment as owned**. Garden empty after seed is honest (no Course rows). Next cut: make the household ticket visible and use it for storefront `isOwned`. Do not seed a fake course unless product wants a garden plot.

## Methodology

- Sources: ADR, `docs/platform-kernel.md`, seed.ts, entitlement/courses/garden/adaptive/abeka routes
- Date: 2026-09-05
- Terms: ticket, CourseEnrollment, listEntitlements, isOwned, Abeka leftover

## Completeness matrix

| ADR law | Status |
|---|---|
| Parent-only login, child profile | Done |
| Ticket parent-scoped, progress childId | Done |
| today/player not CourseEnrollment | Done (#12 + this branch) |
| Garden/parent courses not enrollment access | Done on #13, **not on main until merge** |
| Support/parent sees household tickets | **Open** — `listEntitlements` test-only (`entitlement-service.ts:100`) |
| Storefront owned = ticket | **Open** — `/courses/[slug]` `isOwned` from enrollment (`page.tsx:119-129`) |
| Catalog plug-in Lesson+Skill | Partial — track lessons seeded; no LessonSkill; no Course catalog |
| Abeka leftover writes authed | POST yes; GET still unauth |
| Files ≤200 in modules | Debt: journey-service, course-service |

## Local demo after `db:seed`

- Login demo parent works (`emailVerified=true`)
- Child Kisu, 7-day `platform-pass`
- `/kid/today`: 2 trial track lessons, `videoSource` null
- Garden / parent courses: empty (no `course:*`, no Course rows)
- Billing: PaymentRecord only → 0₫, no ticket list
- Storefront `/courses`: empty catalog; if a course existed, ticket household still looks unpurchased

## Ranked leftover access (not ledger)

1. Storefront `isOwned` + GET `/api/courses/[slug]` `enrolled` flag — enrollment
2. `POST /api/courses/[slug]/complete` — enrollment required
3. Adaptive `review-queue` / `next-lesson` — no child ownership
4. Abeka GET catalog/progress — no session

## Recommendation

Next product slice after #13 merge: **household ticket UX + storefront owned-from-ticket**. Not Abeka, not fake Course seed.

## Unresolved

- Merge #13 before starting next branch?
- Does product want a seeded Course plot for garden demo?

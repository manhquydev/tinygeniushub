---
title: brainstorm-ticket-surface
date: 2026-09-05
---

# Brainstorm: next kernel slice

## Contract

- **Outcome:** Parent can see live household tickets in-app. Storefront treats a live `course:{id}` ticket as owned (Buy → Continue). No new catalog SKU required.
- **Constraints:** ADR kernel. Reuse `listEntitlements` / `listLiveCourseIds`. Files ≤200. #13 catalog-access should land first (or stack on this branch).
- **Non-goals:** Abeka adapter, seed Course/video, child login, VPS, certificates rewrite, adaptive IDOR unless touched.
- **Acceptance:**
  1. Parent billing or dashboard lists entitlements (code, catalogKey, status, validUntil)
  2. Trial demo parent sees `platform-pass` ACTIVE after seed
  3. `/courses/[slug]` `isOwned` true iff `listLiveCourseIds` contains course.id
  4. GET `/api/courses/[slug]` `enrolled` uses tickets, not getEnrollment
  5. Enrollment-only household still not owned
  6. Unit tests for 3–5

## Options

| # | Approach | Worst case |
|---|---|---|
| A | Ticket list + storefront isOwned from tickets | Garden still empty (honest) |
| B | Seed demo Course + offering + ticket so garden has a plot | Fake SKU in kernel seed; catalog coupling |
| C | Auth Abeka GET leftover | Kernel demo unchanged |

**Recommend A.** Smallest ADR honesty. B is product demo, not kernel. C leftover.

Assumption A depends on: parent billing is the right surface (vs new `/parent/tickets`). Fails if billing copy stays “per-course purchase only” without a ticket section.

## Direction

After #13 merge (or continue this branch): add ticket panel via `listEntitlements`; flip storefront owned flag to `listLiveCourseIds`. Keep CourseEnrollment as ledger.

## Unresolved

- Billing panel vs dashboard widget vs both?
- Stack on #13 vs wait for merge?

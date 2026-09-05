---
title: "ticket-surface"
description: "Show household tickets on parent billing; storefront isOwned from tickets; continue studying goes to /kid/today."
status: done
priority: P1
blockedBy: [260904-2244-kernel-catalog-access]
created: 2026-09-05
---

# ticket-surface

Brainstorm: `plans/reports/brainstorm-260905-0715-ticket-surface.md`. Stack on `feat/kernel-catalog-access` (#13).

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | Continue studying → `/kid/today` | Done |
| 2 | Billing lists `listEntitlements` | Done |
| 3 | Storefront `isOwned` / GET enrolled from `listLiveCourseIds` | Done |

## Success criteria

- [x] Child card continue → `/kid/today?childId=`
- [x] Billing shows offering code, catalogKey, status, validUntil
- [x] `/courses/[slug]` owned iff live course ticket
- [x] GET `/api/courses/[slug]` `enrolled` from tickets
- [x] Enrollment-only is not owned
- [x] Tests for storefront owned flag

## Out of scope

Abeka, seed Course, certificates, adaptive IDOR.

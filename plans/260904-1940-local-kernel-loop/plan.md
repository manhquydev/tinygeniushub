---
title: "local-kernel-loop"
description: "Make the kernel learning loop playable in local/dev: seed ticket+child, player uses canAccess, kid entry is /kid/today, profile slots follow subscription."
status: done
priority: P1
effort: "1d"
tags: [kernel, entitlement, seed, player]
blockedBy: [260904-1103-platform-kernel]
blocks: []
created: 2026-09-04
---

# Local kernel loop

## Outcome

Docker/seed demo parent can open `/kid/today`, see trial EN+MATH missions, and play/complete without live Stripe/PayOS/VPS.

## Constraints

- ADR `docs/decisions/260904-1102-platform-kernel.md`
- No VPS, no live providers
- Files ≤200 lines; domain logic in `src/modules/*`
- Do not create child login, Abeka importer, offering CMS

## Non-goals

Course garden rewrite, Abeka GET auth, package-subscription ticket grant, `/pricing`, Sentry, email-verify for new signups.

## Scout (2026-09-04)

- `seedDemoParent` writes TRIALING subscription, no `Entitlement`, no `ChildProfile`
- `registerParent` grants 7-day `platform-pass`; seed parent is the local login
- `/kid` → `/kid/garden` (CourseEnrollment, empty for trial)
- `/kid/today` is ticket-aware but unlinked
- `video-token` / `secure-playback` gate `isParentEnrolledForLesson`
- `CHILD_PROFILE_LIMIT = 1` vs trial `childProfileLimit: 3`

## Phases

| # | Phase | Status |
|---|-------|--------|
| 1 | Seed trial ticket + demo child | Done |
| 2 | Player APIs ticket gate | Done |
| 3 | Kid entry + parent play links → today; slots from subscription | Done |

## Success criteria

- [x] Re-seed grants ACTIVE `platform-pass` ticket and one child for demo parent
- [x] Parent with ticket and no CourseEnrollment can get video-token (trialEnabled lessons)
- [x] Parent without ticket cannot (unless public preview)
- [x] `/kid` redirects to `/kid/today`
- [x] Parent enter-kid / children play links go to `/kid/today?childId=`
- [x] `createChildProfile` uses `Subscription.childProfileLimit` (fallback 1)

# ADR-001: Platform kernel (course-agnostic)

- **Status:** accepted
- **Date:** 2026-09-04
- **Deciders:** product owner (BA session), engineering

Authority for implementation. If README / PDR / codebase-summary disagree, this ADR wins.

## Context

The app grew three content products (Track→Lesson, Course storefront, Abeka tables) and two money rails (Stripe subscription-shaped checkout, PayOS course checkout). Access, player, and “today” mixed those products. The product intent is a **framework** that later catalogs plug into — not a system that exists for one course.

## Decision

### 1. Kernel vs catalog

TinyGenius Hub is a **learning platform kernel**. A course, Abeka, or partner pack is a **catalog** plugged into the kernel.

Kernel knows: household, child profile, ticket (entitlement), lesson, skill, player, report, payment ledger.

Kernel does **not** know: course slug, Abeka grade, garden zone, Family+ marketing names.

### 2. Users

- **Login user = parent (household) only.** Admin and Reader stay separate products.
- **Child is a profile, not a user.** No child password, session, or PIN in this ADR.
- Kid UI uses the parent session and a selected `childId`.

### 3. Tickets vs progress

- **Ticket (what the house may learn)** attaches to the **parent**. Every child profile in that house shares it.
- **Progress (what a child finished)** attaches to the **child profile**. Completing a lesson for child A does not complete it for child B.

“More children” is extra **profile slots**, not extra users and not extra tickets.

### 4. Canonical learning units

- **Lesson** = playable unit (video, activities, watch, complete, evidence).
- **Skill** = mastery unit (tree, attempts, review). Many lessons may map to one skill (`LessonSkill`).

Today-mission, player, and adaptive sequencing consume these units — not `Course` or `AbekaLesson`.

### 5. Commerce: offerings, not “a Course table”

One **Offering** on the shelf:

| Kind | Money | Ticket |
|---|---|---|
| Recurring pass | Stripe Billing auto-charge (not one-shot `mode=payment`) | Time-bounded household ticket; dunning → grace → cut |
| One-time program | PayOS or Stripe one-shot | Household ticket for that catalog (no expiry or long expiry) |
| One-time level | Same as program | Household ticket for that level only |

Payment providers only **collect money**. Webhooks **grant or extend tickets**. Player never reads `CourseEnrollment` or `PackageSubscription` as the access source of truth once cutover completes.

PayOS does not auto-recurring. Recurring = Stripe. One-time = PayOS and/or Stripe payment.

### 6. Catalog adapter

A catalog implements: import/map content → `Lesson` + `Skill`; declare offerings; never owns `complete` / watch / streak APIs.

Abeka remains a **non-kernel leftover** until it implements the adapter. Until then, Abeka write APIs must be parent-authenticated or unpublished. They must not be the learning kernel.

## Consequences

### Positive

- New catalog does not add payment tables or a second complete API.
- Matches current auth: parent session only.
- Support sees one household ticket list.

### Negative

- Cannot sell “Abeka for child A only”.
- Stripe Billing + dunning is real ops (grace, failed charge, cancel-at-period-end).
- Existing `CourseEnrollment` / Abeka access checks must cut over; dual-read during migration only.

## Alternatives considered

### Per-child login users

- **Rejected:** more auth surface; code already has no child user. Owner chose household simplicity.

### Course as the only content type

- **Rejected:** locks the kernel to storefront SKUs; contradicts “not dependent on any course”.

### Keep two money products (subscription table vs course checkout)

- **Rejected:** two ledgers, two access checks; cannot add a third catalog without a third path.

## Implementation laws (DO / DON'T)

**DO**

- Gate learn/play with `entitlementService.canAccess({ parentId, lessonId })`.
- Write progress with `childId`.
- Add catalogs as modules that map into `Lesson`/`Skill` + `Offering`.
- Keep files ≤200 lines; put domain logic in `src/modules/*`.

**DON'T**

- Create `ChildUser` / child session.
- Add `POST /api/<catalog>/complete` that bypasses `learning/completion-service`.
- Let `/kid/today` or player key off `CourseEnrollment` after cutover.
- Use Stripe Checkout `mode=payment` for the recurring pass.
- Treat PDR “delivered ✓” as ground truth (see audit `plans/reports/codebase-audit-2026-09-04/`).

## References

- Contract: `docs/platform-kernel.md`
- Architecture: `docs/system-architecture.md`
- Audit: `plans/reports/codebase-audit-2026-09-04/report.md`

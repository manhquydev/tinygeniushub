---
title: "Two-Track Plan: Notification Fix + Courses Clarity"
description: "Diagnose notification click issue and improve value clarity on /courses and /courses/[slug]."
status: pending
priority: P1
effort: 18h
branch: main
tags: [bugfix, frontend, courses, ux, analytics]
created: 2026-03-20
---

# Goal
Deliver two parallel tracks in one implementation cycle:
1) fix notification center interaction end-to-end, 2) make course value communication specific and decision-friendly based on handover package `docs/handover/packages/2026-03-18-course-split-executive-package`.

# Prioritized Execution

## P0 - Track A: Notification center click shows no usable result
1. Reproduce and isolate root cause (UI vs API vs layering).
   - Targets:
     - `src/components/parent-notification-center.tsx`
     - `src/components/app-nav-client.tsx`
     - `src/app/globals.css`
     - `src/app/api/notifications/route.ts`
     - `src/app/api/notifications/[id]/read/route.ts`
2. Add focused diagnostics before editing behavior.
   - Validate:
     - open state toggles on bell click
     - panel visibility not clipped/covered by nav/stacking contexts
     - read-mark API works and updates unread badge
3. Implement fix path based on observed failure mode.
   - Expected code touch:
     - interaction guards in `parent-notification-center.tsx` (open/close event handling)
     - z-index/overflow corrections in `globals.css` or nav wrapper in `app-nav-client.tsx`
     - API error resilience in `notifications` routes (consistent payloads/status for UI handling)
4. Add regression tests.
   - Targets:
     - `src/components/app-nav-client.test.tsx` (nav-level interaction expectation)
     - new: `src/components/parent-notification-center.test.tsx` (open panel + read flow)
     - optional e2e: `tests/e2e/parent-notification-center.spec.ts`

## P1 - Track B: Improve clarity and value communication on /courses and /courses/[slug]
1. Align external messaging to outcome-language policy from handover.
   - Sources:
     - `docs/handover/packages/2026-03-18-course-split-executive-package/01-executive/full-handover.md`
     - `docs/handover/packages/2026-03-18-course-split-executive-package/02-assessment/curriculum-split-validation.md`
   - Data model target:
     - `src/modules/courses/course-storefront-content.ts`
2. Strengthen listing card clarity (replace generic "Ket qua" line with concrete parent-visible outcomes).
   - Targets:
     - `src/components/courses/course-card.tsx`
     - `src/app/(main)/courses/page.tsx`
     - `src/components/courses/course-filter-sidebar.tsx`
   - Output behavior:
     - card answers: for who, expected visible progress window, workload, and next step
     - keep sticky filter behavior under nav (`top: calc(var(--app-nav-height) + ...)`)
3. Tighten detail page persuasion with evidence-oriented structure.
   - Targets:
     - `src/app/(main)/courses/[slug]/page.tsx`
     - `src/app/(main)/courses/[slug]/course-detail-hero.tsx`
     - `src/app/(main)/courses/[slug]/course-detail-fit-checklist.tsx`
     - `src/app/(main)/courses/[slug]/course-detail-timeline.tsx`
     - `src/app/(main)/courses/[slug]/course-detail-difference.tsx`
     - `src/app/(main)/courses/[slug]/course-detail-data.ts`
   - Output behavior:
     - explicit "fit/not fit" + measurable timeline + adjacent-course difference
     - map to `parentProblem`, `outcomes`, `parentVisibleValue` consistently
4. Confirm instrumentation is usable for comparison reads.
   - Targets:
     - `src/components/courses/course-storefront-tracking.tsx`
     - `src/lib/analytics/track-event.ts`
     - `src/proxy.ts` and `src/lib/ab-test-constants.ts` (sanity check for `ab_courses_v` propagation)

# Suggested Agent Team Split
- `debugger` lane: Track A root-cause + fix + focused tests.
- `researcher/ui-ux` lane: handover-to-copy matrix for Track B.
- `frontend-dev` lane: Track B implementation and responsive polish.
- `tester` lane: e2e smoke and regression pass for both tracks.

# Risks
- Unknown interaction bug source in notification flow (event handling vs layering) can cause false fix.
- Course copy improvements may drift from curriculum truth if not bound to `course-storefront-content`.
- Sticky filter offsets can regress on mobile/tablet if nav height changes.
- A/B attribution noise can hide impact of clarity changes if variant capture is inconsistent.

# Validation Checklist
- Notification:
  - [ ] Bell click opens panel on desktop and mobile nav contexts.
  - [ ] Unread badge decrements after single and mark-all read.
  - [ ] Notification link click navigates and persists read state after refresh.
  - [ ] No clipped panel under fixed nav or overlapping layers.
- Courses listing:
  - [ ] Every card communicates concrete value (not generic outcome text).
  - [ ] Sticky filter remains visible and usable while deep scrolling.
  - [ ] Filters + sort + pagination retain expected query behavior.
- Course detail:
  - [ ] Hero + fit + timeline + difference blocks provide non-overlapping decision info.
  - [ ] Messaging maps to bundle source data consistently.
  - [ ] CTA and tracking events still fire with valid variant metadata.
- Quality gates:
  - [ ] `pnpm lint`
  - [ ] `pnpm type-check`
  - [ ] related unit tests
  - [ ] related e2e smoke (`courses` + notification interaction)

---
title: "Course Pages Redesign: SEO + UX"
description: "9-phase plan covering SEO, parent-friendly copy, mobile filter drawer, sticky header, card cleanup"
status: in-progress
priority: P1
effort: 17h
branch: main
tags: [seo, ux, courses, conversion, mobile]
created: 2026-03-19
---

# Course Pages Redesign: SEO + UX

## Goal
Increase organic traffic from Vietnamese parents, improve conversion rate, reduce decision confusion. Make listing + detail pages parent-friendly with proper mobile usability.

## Phases

| # | Phase | Status | Effort | File |
|---|-------|--------|--------|------|
| 1 | Bug Fix + Validation | DONE | 1h | [phase-01](./phase-01-bug-fix-validation.md) |
| 2 | SEO Foundation | completed | 4h | [phase-02](./phase-02-seo-foundation.md) |
| 3 | Course Card + Listing UX | completed | 4h | [phase-03](./phase-03-course-card-listing-ux.md) |
| 4 | Detail Page UX + Design Sync | partial | 3h | [phase-04](./phase-04-detail-page-design-sync.md) |
| 5 | Copy Rename + Section Cleanup (P0) | pending | 30m | [phase-05](./phase-05-copy-rename-cleanup.md) |
| 6 | Track Position Badge (P0) | pending | 30m | [phase-06](./phase-06-track-position-badge.md) |
| 7 | Mobile Filter Drawer (P1) | pending | 1.5h | [phase-07](./phase-07-mobile-filter-drawer.md) |
| 8 | Sticky Mini-Header Desktop (P1) | pending | 1.5h | [phase-08](./phase-08-sticky-mini-header.md) |
| 9 | Course Card Layout Simplify (P1) | pending | 1h | [phase-09](./phase-09-course-card-simplify.md) |

## Key Constraints
- No new DB schema changes; use existing fields
- No new API routes needed
- Preserve A/B testing logic (`coursesVariant` A/B)
- Preserve all analytics tracking (view trackers, tracked links)
- Files > 200 lines must be modularized
- Sheet component already exists at `src/components/ui/sheet.tsx`

## Key Files
- `src/app/(main)/courses/page.tsx` (391 lines)
- `src/app/(main)/courses/[slug]/page.tsx` (249 lines)
- `src/app/(main)/courses/[slug]/course-detail-hero.tsx` (123 lines)
- `src/components/courses/course-card.tsx` (133 lines)
- `src/components/courses/course-filter-sidebar.tsx` (151 lines)
- `src/components/courses/course-detail-sidebar.tsx` (130 lines)
- `src/modules/courses/course-bundles.ts` (145 lines)
- `src/modules/courses/course-storefront-content.ts` (235 lines)

## Dependencies
- Phases 1-3: DONE
- Phase 4: partial (mobile sticky CTA, FAQ done; /pricing sync, mobile filter still pending)
- Phases 5-6: P0 quick wins, no dependencies, can run in parallel
- Phase 7: independent (mobile filter drawer)
- Phase 8: independent (desktop sticky header)
- Phase 9: independent (card simplification)
- Phases 5-9 can all be implemented in parallel since they touch different files/sections

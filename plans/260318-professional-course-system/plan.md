---
title: "Professional Course System Redesign"
description: "Add filtering, hover effects, sticky CTA, reviews, and related courses to the course pages"
status: pending
priority: P2
effort: 22h
branch: main
tags: [feature, frontend, backend, database]
created: 2026-03-18
---

# Professional Course System Redesign

## Summary

Upgrade `/courses` listing and `/courses/[slug]` detail pages with: sidebar filtering (subject, age, price, duration), card hover animations, sticky CTA sidebar, ratings/reviews system, and related courses carousel.

## Research Reports

- [Brainstorm Summary](../reports/brainstorm-260318-course-system-professional.md)
- [Listing UX Patterns](../reports/researcher-260318-course-listing-ux-patterns.md)
- [Detail Page Patterns](../reports/researcher-260318-course-detail-page-patterns.md)
- [Schema & Filter Design](../reports/researcher-260318-course-schema-filter-design.md)

## Architecture Decisions

- **URL searchParams** as filter state source of truth (bookmarkable, SEO-friendly)
- **Server Component** fetches filtered data; Client Components manage filter UI
- **Tailwind-only** animations (no Framer Motion) -- KISS
- **Prisma enums** for subject/ageGroup (type-safe, DB-enforced)
- **Denormalized** reviewAverageRating/reviewCount on Course (fast reads)
- **Admin moderation** for reviews (isApproved default false)

## Phases

| Phase | Name | Effort | Status | Depends On |
|-------|------|--------|--------|------------|
| 1 | [Schema Migration](./phase-01-schema-migration.md) | 3h | pending | -- |
| 2 | [Listing Page + Filters + Hover](./phase-02-listing-page-filter-hover.md) | 8h | pending | Phase 1 |
| 3 | [Detail Page + Sticky CTA + Related](./phase-03-detail-page-sticky-related.md) | 6h | pending | Phase 1 |
| 4 | [Reviews System](./phase-04-reviews-system.md) | 5h | pending | Phase 1 |

**Execution:** Phase 1 first (blocking). Phases 2, 3, 4 can run in parallel after Phase 1.

## Key Constraints

- All files under 200 lines -- split if needed
- Kebab-case filenames
- Reuse existing AgeGroup enum (extend with new values)
- Zero breaking changes on migration (all new fields nullable/default)
- No over-engineering -- <50 courses, simple Prisma WHERE is enough

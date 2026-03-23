---
title: "Admin Frontend Full Rebuild"
description: "Rebuild 13 admin modules with shadcn/ui, Dark Pro style (Vercel/Linear)"
status: in-progress
priority: P1
effort: 40h
branch: main
tags: [frontend, refactor, admin, ui]
created: 2026-03-18
---

# Admin Frontend Full Rebuild with shadcn/ui

## Goal
Replace ~800 custom CSS admin classes with shadcn/ui component system. Dark Pro style: dark sidebar (#0f1117) + light content (#f8fafc). All business logic hooks/controllers untouched.

## Stack
shadcn/ui (@canary) + existing recharts@3.7.0 + existing framer-motion@12.35.2 + Tailwind v4

## Reports
- [Brainstorm](../reports/brainstorm-2026-03-18-admin-ui-full-rebuild.md)
- [Research](../reports/researcher-2026-03-18-admin-ui-rebuild.md)

## Phase Plan

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | shadcn/ui Setup + Design Tokens | 3h | complete | [phase-01](phase-01-shadcnui-setup-design-tokens.md) |
| 2 | Admin Shell Rebuild | 5h | complete | [phase-02](phase-02-admin-shell-rebuild.md) |
| 3 | Shared Components Library | 5h | complete | [phase-03](phase-03-shared-components-library.md) |
| 4 | Overview + Analytics Pages | 5h | complete | [phase-04](phase-04-overview-analytics-pages.md) |
| 5 | Users + Content Pages | 6h | complete | [phase-05](phase-05-users-content-pages.md) |
| 6 | Operations + Security + Gift Codes + Courses | 6h | complete* | [phase-06](phase-06-operations-security-giftcodes-courses.md) |
| 7 | Blog CMS + Staff + Log + Organizations | 6h | complete* | [phase-07](phase-07-blog-staff-log-organizations.md) |
| 8 | Visual Polish + CSS Cleanup + Tests | 4h | pending | [phase-08](phase-08-polish-cleanup-tests.md) |

> \* complete with open issues — see [review report](../reports/reviewer-2026-03-18-admin-ui-full-rebuild.md)

## Key Constraints
- Business logic hooks in `src/components/admin/*/use-admin-*-controller.ts` — DO NOT TOUCH
- Vietnamese UI text — preserve all
- Role-based access (Super Admin vs Staff Admin) — preserve logic
- Delete old CSS classes only after component rebuilt (incremental cleanup)
- Each phase must compile before proceeding to next

## Dependencies
- Phase 1 must complete before all others
- Phase 2 depends on Phase 1 (shadcn Sidebar component)
- Phase 3 depends on Phase 1 (shared ui components)
- Phases 4-7 depend on Phases 2+3 (shell + shared library)
- Phase 8 depends on all prior phases

## Success Criteria
- All 13 modules visually consistent with Dark Pro style
- Mobile responsive
- Zero build errors, all tests pass
- No functional regression

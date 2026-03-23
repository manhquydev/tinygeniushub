# Plan - Admin System Reassessment + UI Rebuild (2026-03-17)

## Objective
- Reassess admin completeness by module.
- Rebuild admin UI shell + information architecture without breaking existing API flows.
- Keep scope in-session: shell/nav/overview + shared admin visual system + module map.

## Context links
- [API audit](./reports/researcher-api-functionality-audit.md)
- `src/app/(main)/admin/**`
- `src/components/admin-*.tsx`
- `src/modules/admin/**`

## Phase status
- [x] Phase 01 - Baseline audit (API/service/UI map)
- [ ] Phase 02 - Module decomposition + navigation architecture
- [ ] Phase 03 - Admin shell UI rebuild (layout + nav)
- [ ] Phase 04 - Overview/dashboard redesign (module completeness view)
- [ ] Phase 05 - Global admin style layer (tables/forms/cards consistency)
- [ ] Phase 06 - Validation (`type-check`, lint subset, `check:i18n`)

## Module decomposition (target)
- Core Control: Overview, Analytics, Users, Courses
- Operations: Payments, Webhooks, Coupons, Gift Codes, Content
- Publishing: Blog, Announcements, Newsletter
- Governance: Staff, Security, Audit Logs, Feature Flags
- Expansion: Organizations, Impersonation, Skills

## Files to modify (planned)
- `src/app/(main)/admin/layout.tsx`
- `src/components/admin-shell-nav.tsx`
- `src/app/(main)/admin/overview/page.tsx`
- `src/components/admin-stats-header.tsx`
- `src/app/globals.css`

## Files to create (planned)
- `src/components/admin/admin-module-catalog.ts`
- `src/components/admin/admin-module-health-grid.tsx`
- `src/components/admin/admin-page-header.tsx`

## Execution checklist
- [ ] Add module catalog as single source for nav + overview cards.
- [ ] Refactor admin shell nav to use module catalog + role guards.
- [ ] Upgrade layout with modern mobile-first workspace shell.
- [ ] Redesign overview into executive summary + module health + quick actions.
- [ ] Add scoped `.admin-workspace` styles for consistent visual system.
- [ ] Run compile/type validation + i18n check.

## Success criteria
- Admin navigation reflects full module map and role visibility.
- Overview communicates system state and module completeness at a glance.
- Visual quality materially improved (spacing, hierarchy, typography, interaction states).
- No regression in route access/auth gate.

## Risks
- Large legacy panel files can limit full redesign in one session.
- Global CSS changes may leak into non-admin pages if not scoped.

## Unresolved questions
1. Should `Impersonation` and `Skills` appear in navigation now or stay hidden?
2. Need dedicated export page this cycle or keep action-level export in operations?
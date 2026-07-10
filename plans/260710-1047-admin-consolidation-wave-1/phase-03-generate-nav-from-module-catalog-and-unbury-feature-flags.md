---
phase: 3
title: "Generate nav from module catalog and unbury feature flags"
status: pending
priority: P1
dependencies: [2]
effort: "5h"
---

# Phase 3: Generate nav from module catalog and unbury feature flags

## Overview

Make `admin-module-catalog.ts` the single source of truth: sidebar nav generated from it, stale entries refreshed, phantom links removed. Give feature-flags its own page (currently buried inside Security). Fixes the two orphan pages (`/admin/skills`, `/admin/impersonation`) becoming reachable.

## Context Links

- Audit evidence: brainstorm report §B.1-B.2; UI audit answer 1 (catalog vs NAV_GROUPS divergence)
- Catalog: `src/components/admin/admin-module-catalog.ts` — exports `ADMIN_MODULE_CATALOG` (15 modules), `ADMIN_NAV_GROUPS` (core-control/operations/publishing/governance), `getVisibleAdminModules(role)`
- Current hardcoded nav: `src/components/admin-shell-nav.tsx:59-104` (`NAV_GROUPS`)

## Requirements

- Functional: sidebar renders groups/items/role-visibility from catalog; blog child-submenu preserved; skills + impersonation appear in nav; feature-flags at `/admin/feature-flags` with nav entry; Security page no longer embeds flags panel
- Non-functional: one source of truth — deleting hardcoded `NAV_GROUPS`; nav labels come through i18n `translate()` keys (labels currently machine-English hardcoded — route them via `admin.nav.*` keys, EN primary)

## Related Code Files

**Modify:**
- `src/components/admin/admin-module-catalog.ts`: fix stale entries — set real `href` for `impersonation` + `skills-mapping`, update `health` from "gap", remove/repoint phantom `clarity` module (`/admin/analytics/clarity` page does not exist; Phase 1 deletes its route), remove newsletter refs (Phase 2), decide group placement for every module currently in sidebar (`overview`, `analytics`, `users`, `courses`, `organizations`, `operations`, `gift-codes`, `content`, `site-settings`, `blog`+children, `staff`, `security`, `log`, `feature-flags`, `skills`, `impersonation`)
- `src/components/admin-shell-nav.tsx`: delete hardcoded `NAV_GROUPS`; consume catalog via `getVisibleAdminModules(role)` + group mapping; keep icon/collapsible/active-state rendering
- `src/app/(main)/admin/security/page.tsx`: remove `AdminFeatureFlagsPanel` embed
- `locales/en/translation.json` + `locales/vi/translation.json`: `admin.nav.*` keys

**Create:**
- `src/app/(main)/admin/feature-flags/page.tsx`: new-pattern page (`AdminPageHeader` + `translate()`, mirror `admin/skills/page.tsx` structure) hosting existing `AdminFeatureFlagsPanel`

**Delete:** nothing beyond the inline `NAV_GROUPS` constant

## Implementation Steps (TDD)

1. **Tests first — lock nav visibility contract:** vitest component/unit tests for the INTENDED end-state per role: SUPER_ADMIN sees all groups incl. staff/security/log/feature-flags/impersonation; staff admin does NOT see superAdminOnly items; blog submenu children present; skills + impersonation present. Write against catalog helper (`getVisibleAdminModules`) + a pure "nav model" function extracted from the render component. Tests RED initially (catalog stale) — this is the TDD target, since current behavior (orphan pages, divergence) is the bug being fixed. Additionally snapshot CURRENT sidebar items per role first as a before/after diff record.
2. Refresh catalog entries (hrefs, health, groups, remove phantom clarity + newsletter). Tests for catalog helpers go green.
3. Extract nav-model builder (catalog → groups/items with role filter) as pure function; wire `AdminShellNav` to it; delete `NAV_GROUPS`. Component keeps rendering behavior (collapsible blog submenu, active states).
4. Route nav labels through `translate()` with `admin.nav.*` keys (EN primary, VI fallback) — fixes "Diary"/"Human resources" machine-English at the same time.
5. Create `/admin/feature-flags/page.tsx`; move panel out of Security page; add catalog entry (superAdminOnly, governance group).
6. Full gate: `pnpm lint && pnpm type-check && pnpm test`; manual: click every nav item as super admin (`demo.admin@...`), verify 22+2 pages load; verify staff-role nav hides superAdminOnly items.

## Success Criteria

- [ ] Nav-model tests (per-role visibility) green; hardcoded `NAV_GROUPS` deleted
- [ ] `/admin/skills`, `/admin/impersonation`, `/admin/feature-flags` reachable via sidebar
- [ ] Catalog has no `href: null` stale entries, no phantom routes
- [ ] Nav labels via i18n keys, EN/VI parity check passes (`pnpm check:i18n` if applicable)
- [ ] `pnpm lint && pnpm type-check && pnpm test` green

## Risk Assessment

- **Catalog groups ≠ current sidebar groups** (core-control/operations/publishing/governance vs Overview/Data/Operate/System): user-visible regrouping — acceptable for solo-founder admin; note in PR. If grouping feels wrong during review, adjust catalog groups, not the component
- **Blog submenu structure** not modeled in catalog today → extend catalog schema with `children` rather than special-casing in component
- **Exposing under-gated pages (red-team):** `/admin/impersonation` currently checks only `requireAdminParent()` (any admin role) at `impersonation/page.tsx:9`, and staff/security/log pages have NO page-level role check — adding nav links makes them more discoverable to staff admins before Phase 4's layout gate lands. Mitigation: either land Phase 4's `checkAdminPageAccess` layout gate before/with this phase's nav exposure, or add an interim skills-style role redirect (`skills/page.tsx:13` pattern) to impersonation when wiring its nav entry

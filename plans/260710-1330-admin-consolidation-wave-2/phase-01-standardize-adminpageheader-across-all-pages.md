---
phase: 1
title: "Standardize AdminPageHeader across all pages"
status: pending
priority: P2
dependencies: []
effort: "3h"
---

# Phase 1: Standardize AdminPageHeader across all pages

## Overview

Every admin page uses the same `AdminPageHeader` (`src/components/admin/admin-page-header.tsx`) — eliminate the 3 other header treatments (page-local `<h1>`, panel self-header, no header).

## Related Code Files

- Reference: `src/components/admin/admin-page-header.tsx`; good examples `admin/overview/page.tsx`, `admin/skills/page.tsx`.
- Pages with bespoke `<h1>`: blog dashboard + all blog subpages (`admin/blog/**/page.tsx`), `admin/courses` client.
- Pages with panel self-rendered header: `admin/staff`, `admin/organizations`, `admin/log`, `admin/gift-codes` (headers live inside `admin-staff-panel.tsx` / `admin-organizations-panel.tsx` / `admin-action-log-panel.tsx` / `admin-gift-code-panel.tsx`).
- Pages with no header: `admin/users`, `admin/content`.

## Implementation Steps

1. Inventory: grep each `admin/**/page.tsx` for its header style; list the ~15 non-conforming pages.
2. For each, render `<AdminPageHeader title/description/icon/eyebrow>` at the top; remove the bespoke `<h1>` or panel-internal header markup.
3. Titles/descriptions via `translate()`/`useTranslations` keys (reuse `admin.nav.*` where sensible or add `admin.<page>.header.*`).
4. `pnpm type-check` + `pnpm test` after each batch.

## Success Criteria

- [ ] Every `admin/**/page.tsx` renders `AdminPageHeader`; grep finds no bespoke admin `<h1>`/`<h2>` page headers and no panel-internal headers.
- [ ] `pnpm lint && pnpm type-check && pnpm test` green.

## Risk Assessment

- Panel-internal headers may carry layout the page relied on — verify spacing after extraction. Low risk; cosmetic.

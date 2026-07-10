---
title: "Admin Consolidation Wave 2 - UI Shell and i18n Panel Standardization"
description: "Standardize the admin UI shell (single header, one component generation, i18n panel bodies, unified tokens) after Wave 1's structural cleanup."
status: pending
priority: P2
branch: "plan/admin-consolidation-wave-2"
tags: [admin, ui, i18n, refactor]
blockedBy: [260710-1047-admin-consolidation-wave-1]
blocks: []
created: "2026-07-10T06:55:42.680Z"
createdBy: "ck:plan"
source: skill
---

# Admin Consolidation Wave 2 - UI Shell and i18n Panel Standardization

## Overview

Wave 2 of the admin consolidation roadmap. Wave 1 removed dead code, unified nav, and centralized authz (structure). Wave 2 makes the admin surface *look and read* like one system: a single page-header component, one component generation, i18n-wired panel bodies (fixing machine-English + Vietnamese leftovers), and unified design tokens.

**Source:** UI consistency audit in `plans/reports/brainstorm-260710-1047-admin-consolidation-audit-and-action-roadmap.md` §B (findings B.3 i18n-only-at-shells, B.4 four header treatments, B.6 two component generations).

**Blocked by** Wave 1 (`plans/260710-1047-admin-consolidation-wave-1/`) — Wave 2 restyles the same pages/panels Wave 1 restructured; run after Wave 1 merges to avoid churn/conflicts.

## Problem (evidence from Wave 1 audit)

- **4 header treatments** across ~22 pages: `AdminPageHeader` component, page-local bespoke `<h1>`, panel self-rendered header, and no header. Typography/radius/accent all drift (teal vs violet vs hardcoded hex).
- **i18n stops at the page shell**: every panel body (both generations) hardcodes strings — pages marked "i18n done" only translate the title. Machine-English + untranslated Vietnamese leftovers in bodies (e.g. `admin-users-list-pane.tsx` "Tham gia", "Page sau", "Plan gradually reduced").
- **Two component generations** coexist: 27 flat `src/components/admin-*.tsx` (old) vs `src/components/admin/**` (new).

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Standardize AdminPageHeader across all pages](./phase-01-standardize-adminpageheader-across-all-pages.md) | Pending |
| 2 | [Migrate flat admin panels into admin module structure](./phase-02-migrate-flat-admin-panels-into-admin-module-structure.md) | Pending |
| 3 | [Wire panel bodies to i18n and fix machine-English strings](./phase-03-wire-panel-bodies-to-i18n-and-fix-machine-english-strings.md) | Pending |
| 4 | [Normalize design tokens](./phase-04-normalize-design-tokens.md) | Pending |

Suggested order: 1 (header) → 2 (structure move) → 3 (i18n, easiest once panels are consolidated) → 4 (tokens, final polish). Phases 1-2 are mechanical/low-risk; 3 is the largest (content); 4 is cosmetic.

## Dependencies

- `blockedBy: 260710-1047-admin-consolidation-wave-1`
- Per-phase gate: `pnpm lint && pnpm type-check && pnpm test`
- Visual verification needs a running stack (currently unprovisioned locally — see Wave 1 journal); until then, rely on type-check + component tests + code review.

## Acceptance (Wave-level)

- One page-header component on all admin pages; zero bespoke/absent headers.
- Zero flat `src/components/admin-*.tsx` files (all migrated into `src/components/admin/**`).
- Zero hardcoded user-facing strings in admin panel bodies; no Vietnamese leftovers in EN-primary output; EN/VI key parity holds.
- Single accent (teal) + consistent radius/typography scale across admin.

## Notes / Out of scope

- Business-logic completion (coupons→checkout, newsletter, Jules admin UI) is Wave 3, not here.
- This wave is presentation/i18n only — no route, schema, or authz changes.

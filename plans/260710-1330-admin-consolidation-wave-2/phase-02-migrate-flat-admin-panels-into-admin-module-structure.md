---
phase: 2
title: "Migrate flat admin panels into admin module structure"
status: pending
priority: P2
dependencies: [1]
effort: "4h"
---

# Phase 2: Migrate flat admin panels into admin module structure

## Overview

Move the old flat `src/components/admin-*.tsx` panels into the newer `src/components/admin/**` structure so there is one component generation. Pure relocation + import updates — no behavior change.

## Related Code Files

- Old flat panels (~27): `src/components/admin-*.tsx` (e.g. `admin-staff-panel.tsx`, `admin-security-panel.tsx`, `admin-organizations-panel.tsx`, `admin-operations-tabs.tsx`, `admin-gift-code-panel.tsx`, `admin-coupon-panel.tsx`, `admin-blog-*`, `admin-action-log-panel.tsx`, `admin-feature-flags-panel.tsx`, `admin-shell-nav.tsx`, ...).
- Target: group under `src/components/admin/<domain>/` (e.g. `admin/staff/`, `admin/security/`, `admin/blog/`, `admin/operations/`) matching the existing `admin/**` convention.
- Consumers: the `admin/**/page.tsx` files + any cross-imports.

## Implementation Steps

1. Group flat files by domain; decide target subdir per group (match existing `admin/**` layout).
2. Move file-by-file (or per group): `git mv` to the new path, update every import (grep the old path). Prefer `gitnexus_rename` / careful find-replace of the import specifier.
3. Keep filenames descriptive; drop the redundant `admin-` prefix only if the new path already encodes it (`admin/staff/staff-panel.tsx`).
4. `pnpm type-check` after each group (catches missed imports).

## Success Criteria

- [ ] Zero `src/components/admin-*.tsx` files remain (all under `src/components/admin/**`).
- [ ] No broken imports; `pnpm lint && pnpm type-check && pnpm test` green.

## Risk Assessment

- Import churn across many files — do it in small grouped commits, type-check each. Windows path/case sensitivity: verify `git mv` records the rename (avoid case-only collisions).
- `admin-shell-nav.tsx` was touched heavily in Wave 1 — move last, re-verify nav renders.

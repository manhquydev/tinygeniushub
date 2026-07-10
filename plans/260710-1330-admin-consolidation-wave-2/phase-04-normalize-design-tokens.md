---
phase: 4
title: "Normalize design tokens"
status: pending
priority: P3
dependencies: [3]
effort: "3h"
---

# Phase 4: Normalize design tokens

## Overview

Final polish: one accent color, one radius scale, one typography scale across admin. Removes the teal/violet/hardcoded-hex drift the audit flagged.

## Related Code Files

- `src/components/admin/admin-page-header.tsx` (teal accent + gradient — the intended system accent).
- Drift to fix: blog dashboard (violet icon chip), blog analytics charts (hardcoded `#3b82f6`/`#0ea5e9`), blog subpages (`rounded-3xl`/`rounded-2xl` vs system `rounded-xl`), header typography (`text-3xl font-black` vs `text-xl font-semibold`).
- Token source: Tailwind config / CSS variables (`--admin-*`), `globals.css`.

## Implementation Steps

1. Define/confirm admin tokens: accent = teal (existing `--admin-*` vars), radius scale, type scale, card pattern.
2. Replace hardcoded hex chart colors with token references (chart palette derived from accent).
3. Normalize radius (`rounded-xl` for cards) and header typography to the `AdminPageHeader` scale across blog subpages and any outliers.
4. Visual check (needs running stack) + `pnpm lint && pnpm type-check && pnpm test`.

## Success Criteria

- [ ] No hardcoded hex colors in admin components (grep `#[0-9a-fA-F]{6}` in `src/components/admin/**` → only token definitions).
- [ ] Single accent (teal), consistent radius + type scale; `pnpm lint && pnpm type-check && pnpm test` green.

## Risk Assessment

- Purely cosmetic; lowest risk. Chart color changes need a visual pass — defer final sign-off to when the local stack renders (Wave 1 flagged the stack isn't provisioned locally).

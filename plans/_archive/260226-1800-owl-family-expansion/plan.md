---
status: pending
created: 2026-02-26
title: Owl Family Expansion - 3 New Characters
brainstorm: plans/reports/brainstorm-20260226-owl-family-character-design.md
---

# Owl Family Expansion — Cú Bố, Cú Chị, Cú Em

## Summary

Expand mascot system from 2 to 5 characters. Add DadOwl (emerald), SisterOwl (violet), BabyOwl (orange) following existing BigOwl/SmallOwl patterns exactly.

## Phases

| # | Phase | Status | Effort | Files |
|---|-------|--------|--------|-------|
| 1 | Types & Expressions | pending | S | 2 files |
| 2 | DadOwl Component | pending | M | 1 file |
| 3 | SisterOwl Component | pending | M | 1 file |
| 4 | BabyOwl Component | pending | M | 1 file |
| 5 | Mascot Integration | pending | L | 3 files |
| 6 | Showcase & Tests | pending | M | 2 files |

## Dependencies

```
Phase 1 → Phase 2, 3, 4 (parallel)
Phase 2, 3, 4 → Phase 5
Phase 5 → Phase 6
```

## Key Decisions

- New variants: `"dad"`, `"sister"`, `"baby"`
- Combo variants: `"family"` (all 5), keep existing `"duo"` unchanged
- Each character needs own expression path set (scaled per character size)
- ActionPropLayer target: add `"dad"`, `"sister"`, `"baby"` targets
- Reuse existing 14 states + expression system — no new states needed

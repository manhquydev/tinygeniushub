---
title: "i18n audit leftovers"
description: "Close nghiệm thu gaps: daily-plan chrome, homepage JSON-LD locale, check:i18n fixture allowlist."
status: completed
priority: P1
effort: "0.5d"
tags: [i18n, audit]
created: 2026-09-06
blockedBy: [260905-2104-i18n-residual-close]
---

# i18n audit leftovers

Brainstorm: `plans/reports/260906-0723-brainstorm-i18n-audit-leftovers.md`

## Contract

- **Outcome:** Daily-plan chrome + homepage JSON-LD follow `tgh_locale`. `check:i18n` exit 0 without allowing production `src/` diacritics.
- **Constraints:** Cookie locale. Catalog parity. No src diacritics. No URL prefix.
- **Non-goals:** Email, CMS titleVi, admin CRUD, locale prefixes, generated homepage H1, full Abeka module.
- **Acceptance:** See brainstorm report.

## Phases

| # | Phase | Status |
|---|---|---|
| 1 | Catalog keys | Done |
| 2 | Wire daily-plan + JSON-LD | Done |
| 3 | check:i18n allowlist | Done |
| 4 | Verify | Done |

## Keys

`curriculum.dailyPlan.*`, `curriculum.subjects.*`, `metadata.jsonLd.*`

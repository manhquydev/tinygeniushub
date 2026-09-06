---
title: "i18n residual close"
description: "Acceptance-close leftover-mix; wire remaining mixed literals and locale homepage metadata; sync stale docs."
status: completed
priority: P1
effort: "0.5d"
branch: main
tags: [i18n, residual]
created: 2026-09-05
---

# i18n residual close

## Brainstorm contract

- **Outcome:** Leftover-mix treated shipped. Residual mixed EN/VI literals follow `tgh_locale`. Homepage `<title>`/description/OG locale follow cookie. Docs match merged PR #23.
- **Constraints:** Cookie locale. No URL prefix. No `generated.*` rewrite. Files ≤200 lines except pre-oversize `daily-plan-view.tsx`. Catalogs stay key-parity. No diacritics in `src/`.
- **Non-goals:** `/en` `/vi` routing; homepage `generated.*` H1 rewrite; blog CMS `titleVi`; admin CRUD/date rewrite; email HTML (no stored parent locale); `check:i18n` fixtures in tests/scripts.
- **Acceptance:**
  - Drawing "Xong ✓", daily-plan "Xong", admin true/false "Sai" use catalog.
  - Homepage `generateMetadata` title/description/og locale from `tgh_locale`.
  - Root layout description + `openGraph.locale` from locale.
  - README + codebase-summary no longer claim PR #23 unmerged.
  - Leftover-mix `plan.md` status completed.
  - `translator.test.ts` covers new keys; `pnpm exec vitest run src/i18n/translator.test.ts` pass.
  - `pnpm test:e2e:i18n` attempted.

## Phases

| # | Phase | Status |
|---|---|---|
| 1 | Catalog keys | Done |
| 2 | Wire leftovers + metadata | Done |
| 3 | Docs + leftover-mix status | Done |
| 4 | Verify | Done |

## Keys

- `common.actions.done` — Done / Xong
- `kid.lesson.renderer.done` — Done / Xong
- `admin.contentActivity.trueFalse.{heading,correct,incorrect}`
- `metadata.homeTitle|homeDescription|homeOgDescription|homeTwitterDescription|homeImageAlt`

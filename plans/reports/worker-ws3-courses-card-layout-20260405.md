# WS3 Courses card layout

Docs impact: none

## What changed
- Normalized `/courses` cards into a full-height flex layout so each card stretches evenly in the grid.
- Replaced variable content blocks with fixed fields:
  - track label
  - lesson count
  - duration
  - pricing or `Miễn phí` badge
- Clamped title/description blocks and pinned CTA to bottom to reduce row height drift from long/short copy.
- Kept mobile behavior intact; grid still collapses cleanly and metadata stacks on small screens.

## Files modified
- `src/components/courses/course-card.tsx`
- `src/app/(main)/courses/page.tsx`

## Before / After
- Before: card height changed with title/description length and the footer sat inside a variable-height flow.
- After: card body uses fixed content zones, the footer is anchored with `mt-auto`, and the grid items stretch consistently.

## Validation
- `pnpm type-check` OK
- `pnpm exec eslint src/components/courses/course-card.tsx "src/app/(main)/courses/page.tsx"` OK
- `pnpm lint` still fails repo-wide on pre-existing unrelated files in `.claude/hooks/**` and other untouched modules

## Notes
- `detect_changes` reported high risk because the worktree already has unrelated modified files. I left those untouched.

Unresolved questions: none.

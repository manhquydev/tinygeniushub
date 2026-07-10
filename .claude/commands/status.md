---
description: 📊 Real project status — git, docs/plan state, runtime health, blockers — for task delegation
argument-hint: [--full]
---

Give me an accurate, delegation-ready snapshot of this project's real state. Do not implement anything — this is a read-only report.

<mode>$1</mode>

## Workflow

1. **Git State**
   - Current branch, ahead/behind `origin`, uncommitted file counts (modified/added/deleted/untracked)
   - Last 5-10 commit subjects (`git log --oneline -10`)

2. **Docs/Plan State**
   - Read `docs/project-roadmap.md` (current work section) and `docs/project-changelog.md` (most recent entries)
   - Scan `plans/*/plan.md` (skip `_archive/`, `templates/`, `reports/`) for `status:` frontmatter and `## Status` sections
   - Explicitly surface discrepancies between claimed status and what phase files/reports actually say (e.g. a phase marked "done" in one place but "partial"/"misreported" in another) — do not paper over them

3. **Runtime Health**
   - Run `pnpm lint`, `pnpm type-check`, `pnpm test` — report pass/fail and error counts, not full output
   - If `<mode>` is `--full`, also run `pnpm test:e2e` and `pnpm test:e2e:full` (slow — only when explicitly requested)
   - If a check fails, name the failing files/tests, don't just say "failed"

4. **Blockers / Open Items**
   - Grep `TODO`/`FIXME` in `src/` (cap at ~20, prioritize by recency of the file)
   - Pull "Unresolved Questions" sections from the most recently modified files under `plans/*/reports/` and active `plans/*/phase-*.md`

## Output Format

Chat output only — do not write a report file to `plans/reports/`.

```
## Snapshot
Branch: <branch> | Uncommitted: <counts> | Health: lint=<pass/fail> type=<pass/fail> test=<pass/fail>

## Shipped / Done
- ...

## In Progress (claimed vs verified)
- ...

## Blocked / Needs Decision
- ...

## Ready to Delegate
- concrete, assignable task bullets derived from pending phase items / TODOs
```

Keep it concise — bullets, not prose. Sacrifice grammar for concision. List unresolved questions at the end if any remain unresolved after the scan.

## Examples
```
/status
/status --full
```

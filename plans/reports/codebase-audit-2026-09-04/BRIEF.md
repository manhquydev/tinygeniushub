# TinyGenius Hub — Codebase Quality + Completeness Audit

Coordinator: herdr omp grok-4.6 --advisor
Repo: `/home/manhquy/Downloads/tinygeniushub`
Date: 2026-09-04

## Mission

Evidence-backed evaluation of (1) code quality and (2) system completeness.
Do NOT implement, refactor, commit, or edit product source.
ONLY writable path: your assigned report file under this directory.

## Ground truth (do not trust docs blindly)

Docs/README/PDR/codebase-summary may over-claim. Verify against current source.
User-reported product: Vietnamese EdTech ages 2–6, Next.js 16 + React 19 + Prisma + PostgreSQL + Redis + BullMQ.

Primary docs to compare (then verify in code):
- `README.md`
- `docs/codebase-summary.md`
- `docs/project-overview-pdr.md`
- `docs/system-architecture.md`
- `docs/handover/handover-master-agent-ready.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/plan.md` and phase-01..12
- `AGENTS.md`

## Method

1. Scout real files first (src/modules, src/app, prisma, tests, workers, CI).
2. Every finding needs `path:line` or command output.
3. Mark `[INFERENCE]` when not observed.
4. Compare claimed vs implemented: Done / Partial / Missing / Doc-lie.
5. Severity: Critical / High / Medium / Low.
6. Ignore style nits unless they hide bugs.

## Report format (exact)

Write Markdown to your assigned file. English. Concise. No filler.

```
# Slice: <id>
# Agent: <herdr-name>
# Model: grok-4.6 + --advisor

## Verdict
healthy | mixed | weak | missing

## Completeness score
N/100 — one-sentence rationale

## Quality score
N/100 — one-sentence rationale

## What is actually implemented
- bullet + evidence path

## Gaps vs claimed docs
| Claim | Source | Reality | Status |
| ... | ... | ... | Done/Partial/Missing/Doc-lie |

## Findings
### Critical
- [title] `file:line` — evidence — impact — suggested fix (no code)

### High
### Medium
### Low

## Tests covering this slice
- file — what it proves — holes

## Production-readiness blockers
- only items that should block ship

## Unresolved questions
- none or concrete questions
```

When finished: write the file, then print exactly:
`AUDIT_DONE <relative-report-path>`

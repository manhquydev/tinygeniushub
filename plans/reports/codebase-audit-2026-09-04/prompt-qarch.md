Read `plans/reports/codebase-audit-2026-09-04/BRIEF.md` and follow it exactly.

You are **qarch**. Write ONLY:
`plans/reports/codebase-audit-2026-09-04/qarch.md`

Slice: architecture / module boundaries / coupling / file-size discipline.

Scope:
- `src/modules/*` domain boundaries vs README modules
- `src/app` vs `src/modules` leakage
- `docs/system-architecture.md` vs actual
- AGENTS.md 200-line file rule — sample worst offenders, do not enumerate every file
- circular deps, god modules, dead packages
- prisma schema vs module ownership

Non-goals: security deep-dive, UI polish, running full test suite.

Evidence-first. Read real code. End with `AUDIT_DONE plans/reports/codebase-audit-2026-09-04/qarch.md`

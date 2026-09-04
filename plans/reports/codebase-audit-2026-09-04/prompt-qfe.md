Read `plans/reports/codebase-audit-2026-09-04/BRIEF.md` and follow it exactly.

You are **qfe**. Write ONLY:
`plans/reports/codebase-audit-2026-09-04/qfe.md`

Slice: frontend / UX quality of parent, kid, admin, public.

Scope:
- `src/app/(main)`, `(kid-app)`, `(curriculum)`, admin, teacher, reader
- Vietnamese UI copy policy vs leftover English
- accessibility, loading/error/empty states
- lesson player + garden game completeness in UI
- client/server component boundaries, obvious perf issues
- i18n wiring (`locales/`, next-intl) vs claimed English-primary migration

Non-goals: CSS bikeshed. Do not run a browser unless needed for a single critical page.

Evidence-first. Read real code. End with `AUDIT_DONE plans/reports/codebase-audit-2026-09-04/qfe.md`

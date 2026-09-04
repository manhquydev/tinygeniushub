Read `plans/reports/codebase-audit-2026-09-04/BRIEF.md` and follow it exactly.

You are **qbe**. Write ONLY:
`plans/reports/codebase-audit-2026-09-04/qbe.md`

Slice: backend correctness of core domains.

Scope:
- identity/children plan limits
- learning watch-session/heartbeat/complete idempotency + reward grant once
- billing webhook idempotency + checkout adapter
- reports generation + email opt-in
- prisma transactions, race conditions, unique constraints
- worker job processors vs enqueue sites
- API error handling / validation

Non-goals: frontend, security-only findings unless they break correctness.

Evidence-first. Read real code. End with `AUDIT_DONE plans/reports/codebase-audit-2026-09-04/qbe.md`

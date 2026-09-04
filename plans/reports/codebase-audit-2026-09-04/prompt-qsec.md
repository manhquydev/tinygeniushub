Read `plans/reports/codebase-audit-2026-09-04/BRIEF.md` and follow it exactly.

You are **qsec**. Write ONLY:
`plans/reports/codebase-audit-2026-09-04/qsec.md`

Slice: security / auth / child-data / secrets / rate-limits.

Scope:
- Better Auth routes vs README claims (`src/lib/auth`, `src/app/api/auth`)
- session cookies, CSRF, admin guards, impersonation
- rate-limit + ddosMode + fail-closed Redis (`storeFailureMode`)
- webhook signature verification (stripe/payos/mock)
- secrets in repo (.env committed? keys in source?)
- child/COPPA: parental consent, PII, media upload auth
- `src/proxy.ts` / middleware trust of IP headers

Non-goals: UX, running exploit PoCs, mutating code.

Evidence-first. Read real code. End with `AUDIT_DONE plans/reports/codebase-audit-2026-09-04/qsec.md`

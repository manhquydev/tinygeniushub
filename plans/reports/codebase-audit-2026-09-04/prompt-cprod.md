Read `plans/reports/codebase-audit-2026-09-04/BRIEF.md` and follow it exactly.

You are **cprod**. Write ONLY:
`plans/reports/codebase-audit-2026-09-04/cprod.md`

Slice: product-flow completeness vs README + PDR.

Scope — verify each claimed flow exists end-to-end (UI + API + module):
- parent signup/login/logout
- child profile CRUD + plan limits 3/5
- trial lesson English+Math + completion
- weekly report in-app + email pipeline
- billing checkout + webhooks
- referral
- notifications
- health/ready

Compare `README.md` Implemented Scope and Core Endpoints to actual routes under `src/app/api` and pages. Flag doc-lies.

Evidence-first. End with `AUDIT_DONE plans/reports/codebase-audit-2026-09-04/cprod.md`

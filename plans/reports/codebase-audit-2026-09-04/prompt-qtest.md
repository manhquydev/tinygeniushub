Read `plans/reports/codebase-audit-2026-09-04/BRIEF.md` and follow it exactly.

You are **qtest**. Write ONLY:
`plans/reports/codebase-audit-2026-09-04/qtest.md`

Slice: tests / CI / verification gaps.

Scope:
- Vitest unit/integration locations and what they actually cover
- Playwright e2e specs vs README quality commands
- CI workflows (lint/type-check/test/e2e/security/deploy)
- claimed ~110 unit + ~19 e2e vs reality (count files/tests)
- P0 journey coverage holes
- flaky patterns, skipped tests, empty asserts
- release:check / security:baseline / nightly

Do NOT run full e2e or full test suite. Inspect files, package.json scripts, GitHub workflows. Optional: `pnpm test -- --list` or similar cheap listing only.

Evidence-first. End with `AUDIT_DONE plans/reports/codebase-audit-2026-09-04/qtest.md`

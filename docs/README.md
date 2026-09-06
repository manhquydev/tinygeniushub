# TinyGenius Hub - Documentation Index

## Official Handover Document (Single File)
- `docs/handover/handover-master-agent-ready.md`
- `docs/implementation-plan.md` (current execution snapshot and links to active plan files)

## Security Operations
- `docs/security/ddos-abuse-runbook.md` (endpoint abuse matrix + incident response checklist)
- `docs/security/admin-security-policy-research.md` (research-backed rationale for admin security policy design)

## Testing And Readiness
- `docs/testing/auth-test-checklist.md` (auth test cases from basic to advanced)
- `docs/testing/backend-production-readiness-matrix.md` (backend readiness vs handover + production gaps)

## Language Policy
1. Documentation is maintained in English.
2. Runtime default locale is `en` (`src/i18n/locales.ts`); `vi` catalog exists. Leftover EN/VI mix is unmerged PR #23.

## Notes
1. For historical onboarding, the master handover file is supporting context only.
2. Other files under `docs/` are supporting references and may be outdated unless explicitly synchronized.
3. If a conflict exists, `docs/decisions/260904-1102-platform-kernel.md` wins, then current source. Handover/PDR checkboxes do not.

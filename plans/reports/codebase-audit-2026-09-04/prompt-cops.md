Read `plans/reports/codebase-audit-2026-09-04/BRIEF.md` and follow it exactly.

You are **cops**. Write ONLY:
`plans/reports/codebase-audit-2026-09-04/cops.md`

Slice: ops / deploy / observability / content-platform completeness.

Scope vs docs:
- docker-compose web+worker+postgres+redis
- DigitalOcean SSH deploy workflow
- health/ready, structured logs, Sentry (claimed)
- backup/restore commands + runbook
- BullMQ workers (10 queues claimed — count real)
- blog + reader portal (separate auth?)
- i18n en/vi
- cron (vercel.json + /api/cron)
- R2 + Bunny Stream
- email providers resend/brevo/mock

Status each Done / Partial / Missing / Scaffold.

Do not hit production. Read configs/code only.

Evidence-first. End with `AUDIT_DONE plans/reports/codebase-audit-2026-09-04/cops.md`

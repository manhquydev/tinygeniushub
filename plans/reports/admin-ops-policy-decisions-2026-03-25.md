# Admin Ops Policy Decisions - 2026-03-25

## Context
- User goal: recover/migrate server fastest possible.
- Current stack: Next.js + Postgres + Redis + BullMQ + Docker Compose + PM2 + Nginx.

## Decision 1 - Backup scope for fastest recovery
- Selected: Hybrid strategy.
1. VPS snapshot (fast full-host restore path).
2. Postgres dump backup + checksum verify (portable cross-VPS/provider).
3. Redis persistence + backup (reduce queue/runtime loss).
4. Offsite encrypted storage + regular restore drills.

## Decision 2 - Restore policy
- Staging: self-serve restore allowed.
- Production: guarded approval (2-person rule), break-glass only for Sev-1.
- Reason: minimize blast radius while preserving MTTR in real incidents.

## Decision 3 - `/admin/log` access policy
- Selected now: `SUPER_ADMIN` only.
- Reason: log payloads include forensic details and free-form metadata; keep strict least privilege.
- Future option: split visibility for `SUPPORT_AGENT` with redaction if needed.

## Decision 4 - Incident panel source
- Primary: internal DB/event logs (`AuditLog`, `AdminActionLog`, webhook/payment tables).
- Secondary: Sentry later for exception grouping and alert routing.

## Implemented in this session
- Single-super-admin enforcement:
  - API guard in staff create/update.
  - DB migration partial unique index for `SUPER_ADMIN`.
  - seed script auto-normalizes duplicate super admins.
- Backup foundation:
  - `backup:create`, `backup:verify`, `backup:restore`.
  - runbook: `docs/deployment/backup-restore-runbook.md`.

## Unresolved Questions
1. Offsite backup backend: R2 hay S3?
2. Restore drill cadence: weekly hay monthly?
3. Need immutable object lock (WORM) ngay phase hiện tại hay phase sau?

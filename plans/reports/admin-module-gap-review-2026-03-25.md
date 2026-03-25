# Admin Module Gap Review - 2026-03-25

## Scope
- Review current admin surface from:
  - `src/app/(main)/admin/*`
  - `src/app/api/admin/*`
  - `src/components/admin/admin-module-catalog.ts`
- Focus: missing operational modules, esp. backup/restore.

## Snapshot (Current)
- UI modules present: `overview`, `analytics`, `users`, `courses`, `content`, `operations`, `gift-codes`, `blog`, `organizations`, `staff`, `security`, `log`, `impersonation`, `skills`.
- API groups present: `analytics`, `auth`, `blog`, `content`, `courses`, `coupons`, `feature-flags`, `gift-codes`, `impersonate`, `log`, `organizations`, `payments`, `security`, `site-settings`, `staff`, `users`, `videos`, `webhooks`.
- Catalog health flags already mark:
  - `complete`: overview, analytics, users, content, blog, staff, audit-log.
  - `partial`: courses, operations, gift-codes, organizations, security.
  - `gap`: impersonation UI, skills mapping UI.

## Key Gaps (Prioritized)

### P0 - Critical Ops/SRE
1. Backup & Restore module: missing
- No admin UI/API to trigger DB backup, verify backup status, or run restore drill.
- No visible backup retention policy/status dashboard in admin.

2. Queue/Job operations module: missing
- System uses BullMQ workers, but no admin panel for:
  - queue depth
  - failed jobs
  - retry/dead-letter actions
  - worker health

3. Incident timeline / unified logs: partial
- `/admin/log` only shows `AdminActionLog`.
- No filter/search/export, no merge with `AuditLog`, no correlation with webhook/payment events.

### P1 - Governance/Safety
4. RBAC consistency: partial
- Role taxonomy in code had drift risk; must keep one canonical role set and permission matrix tests.

5. Disaster readiness module: missing
- No admin runbook UI for:
  - maintenance mode
  - degraded mode toggles
  - recovery checklist/progress.

6. Data lifecycle ops: partial
- No dedicated admin UI for retention execution status, deletion jobs, legal export/delete requests.

### P2 - Efficiency/Scale
7. Config/secret observability: missing
- No admin diagnostics for critical env/provider connectivity checks.

8. Audit quality KPIs: missing
- No SLA panel for webhook lag, reconcile backlog, failed action rates.

## Recommended Plan

### Phase 1 (P0) - Backup/Restore + Queue Ops
- Deliver:
  - `System Backup` module (dashboard + trigger + history + restore drill log).
  - `Job Operations` module (BullMQ queue health, failed job retry).
- Done when:
  - Manual backup + restore drill evidence available.
  - Failed job retry works from admin UI.

### Phase 2 (P0/P1) - Unified Audit & Incident Ops
- Deliver:
  - Upgrade `/admin/log` with search/filter/export.
  - Merge view: `AdminActionLog` + `AuditLog` + key system events.
  - Incident timeline panel for payment/webhook anomalies.
- Done when:
  - On-call can trace one incident end-to-end in one screen.

### Phase 3 (P1) - Governance Hardening
- Deliver:
  - Permission matrix tests by role.
  - Role-policy registry doc + enforcement checks.
  - Data lifecycle operations panel (retention/delete/export job status).
- Done when:
  - Every admin API has explicit role tests.

### Phase 4 (P2) - Reliability Dashboard
- Deliver:
  - SLO panel: webhook latency, failed reconcile, queue lag, provider outage flags.
  - Provider diagnostics checks (email/payment/storage/video).
- Done when:
  - Operational health visible without external tools for day-to-day triage.

## Suggested Execution Order
1. Backup/Restore
2. Queue/Job Operations
3. `/admin/log` v2 (unified + filters/export)
4. RBAC matrix + retention ops
5. Reliability dashboard

## Unresolved Questions
1. Backup target: PostgreSQL only, hay cả Redis + object storage metadata snapshot?
2. Restore policy: cho phép self-serve restore ở staging only hay production guarded by approval?
3. `/admin/log` audience: all admin roles hay chỉ `SUPER_ADMIN`?
4. Có dùng Sentry làm source chính cho incident panel, hay chỉ đọc từ DB logs nội bộ?

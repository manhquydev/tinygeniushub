# Ops Decision Report - Restore Drill Cadence + WORM

Date: 2026-03-25  
Work context: `D:/project/cungcontuhoc`

## Context Snapshot (why this decision)
- Backup/restore CLI just landed today (`0.4.3`, 2026-03-25): `backup:create|verify|restore`.
- Runbook exists but still has unresolved policy questions (`docs/deployment/backup-restore-runbook.md`).
- No committed backup artifacts seen in workspace (`backups/` absent) -> likely low empirical restore evidence.
- Admin backup/restore UI and artifact registry still backlog (`docs/project-roadmap.md`, `admin-module-gap-review-2026-03-25.md`).
- Team capacity appears very lean (single primary committer in recent window).
- Engineering quality maturity is strong (release gate + nightly full regression CI).

## Explicit Decisions
1. Weekly restore drill cadence now? **No**.
2. Monthly restore drill cadence now? **Yes**.
3. Enable immutable object lock (WORM) now? **Yes (scoped)**.

## Why These Calls

### Cadence: monthly full restore (not weekly full restore)
- Tradeoff:
  - Weekly full drill gives earlier detection, but high operator time + environment prep burden for current team size.
  - Monthly full drill is sustainable and less likely to degrade into skipped/compliance theater.
- Risk accepted:
  - Detection latency can be up to 30 days for full recovery regressions.
- Compensating controls:
  - Weekly lightweight checks (non-full drill): backup creation, checksum verification, dump readability (`pg_restore --list`), offsite replication freshness.

### WORM: enable now, but only for backup bucket/path
- Tradeoff:
  - Immediate ransomware/malicious-delete protection for backups vs less flexibility for mistaken uploads and retention mistakes.
- Reason to do now:
  - Past production ransomware incident indicates threat is real, not theoretical.
  - Scope-limited WORM adds high protection with moderate ops cost.
- Scope boundary now:
  - Apply WORM to **offsite backup objects only** (DB dumps, manifests, WAL/base backup when enabled).
  - Do **not** apply WORM to product media bucket/paths.

## Phased Rollout (Now vs Later)

### Now (Week 0-2)
- Cadence:
  - Run **1 full staging restore drill per month**.
  - Run **weekly lightweight backup health checks**.
- WORM:
  - Turn on WORM for backup bucket/path with short retention (start 14 days).
  - Use governance mode first if platform supports it; avoid irreversible compliance mode at this stage.
- Evidence:
  - Store drill record in `plans/reports/` + include RTO, data loss window, failed steps, fix actions.

### Later (Week 3-8)
- Raise maturity:
  - Add automated offsite sync and job status alerts.
  - Add backup artifact registry + drill log UI in admin ops module.
  - Enable WAL/base-backup flow for near-5m RPO target.
- Review cadence decision:
  - Move to weekly full drill only if two consecutive months miss SLOs or change velocity/risk increases materially.

## Measurable SLO Checks
- **SLO-1 Backup Job Success**: >= 99% successful scheduled backup jobs per 30 days.
- **SLO-2 Backup Verifiability**: 100% weekly sampled artifacts pass checksum + `pg_restore --list`.
- **SLO-3 Offsite Freshness**: newest offsite backup age <= 6h (critical DB path).
- **SLO-4 Restore Time (RTO)**: monthly full staging restore <= 90 minutes (target <= 60 later).
- **SLO-5 Data Loss Window (RPO)**:
  - Current logical-dump phase: <= 6h.
  - Post WAL/base-backup phase: <= 15m initially, then <= 5m target.
- **SLO-6 Drill Reliability**: 100% of scheduled monthly drills executed; 0 skipped months.
- **SLO-7 Recovery Smoke**: post-restore `/api/health` and `/api/health/ready` both pass, plus auth + webhook + queue smoke checks pass.

## Unresolved Questions
1. Final offsite target: Cloudflare R2 or AWS S3 (and region)?
2. Which WORM capability is available on chosen provider (governance/compliance, retention controls)?
3. Required legal retention window for backups (14d/30d/90d)?
4. Is Redis/BullMQ recovery strict requirement or replay acceptable in Sev-1 recovery?

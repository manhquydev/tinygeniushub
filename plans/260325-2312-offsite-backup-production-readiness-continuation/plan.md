---
title: "Offsite Backup Production Readiness Continuation"
description: "Complete offsite upload, remote verification, retention automation, and operational tests on top of existing backup scaffold."
status: pending
priority: P1
effort: 2d
branch: main
tags: [backup, offsite, ops, production-readiness]
created: 2026-03-25
---

# Context
- Already done: single `SUPER_ADMIN` enforcement.
- Already done: local backup/verify/restore script scaffold + runbook.
- This continuation only closes offsite production gaps.

# Deliverables
## 1. Offsite upload in backup create path
### Files
- `scripts/ops/create-postgres-backup.mjs`
- `.env.example`
- `package.json`

### Changes
1. Add offsite flags/env: `--offsite`, `BACKUP_OFFSITE_ENABLED`, `BACKUP_OFFSITE_ENDPOINT`, `BACKUP_OFFSITE_BUCKET`, `BACKUP_OFFSITE_REGION`, `BACKUP_OFFSITE_ACCESS_KEY_ID`, `BACKUP_OFFSITE_SECRET_ACCESS_KEY`, `BACKUP_OFFSITE_PREFIX`.
2. Upload 3 artifacts after local dump success: `.dump`, `.dump.sha256`, `.dump.json`.
3. Fail command if upload fails (no silent success).
4. Print uploaded key paths for handoff to verify step.

### Commands
```bash
pnpm backup:create
pnpm backup:create -- --offsite
pnpm backup:create -- --offsite --out-dir=/var/backups/postgres
```

## 2. Remote verification flow
### Files
- `scripts/ops/verify-postgres-backup.mjs`
- `scripts/ops/restore-postgres-backup.mjs`
- `package.json`

### Changes
1. Add remote verify inputs: `--offsite-key=<key>` (downloads to temp file first).
2. Verify sequence: remote download -> sha256 check -> `pg_restore --list`.
3. Add optional restore-drill mode in verify: `--restore-drill` + target DB from env (`BACKUP_VERIFY_DATABASE`).
4. Keep current local `--file` path mode for backward compatibility.

### Commands
```bash
pnpm backup:verify -- --file=backups/postgres/<file>.dump
pnpm backup:verify -- --offsite-key=postgres/2026/03/25/<file>.dump
pnpm backup:verify -- --offsite-key=postgres/2026/03/25/<file>.dump --restore-drill
```

## 3. Retention automation for offsite artifacts
### Files
- `scripts/ops/retention-postgres-backups.mjs` (new)
- `.env.example`
- `package.json`

### Changes
1. Implement prune job for offsite prefix with policy env:
   - `BACKUP_RETENTION_DAILY_DAYS` (default 14)
   - `BACKUP_RETENTION_WEEKLY_WEEKS` (default 8)
   - `BACKUP_RETENTION_MONTHLY_MONTHS` (default 6)
2. Keep at least last 7 successful backups regardless of age.
3. Support `--dry-run` and `--max-delete=<n>` safety guard.

### Commands
```bash
pnpm backup:retention -- --dry-run
pnpm backup:retention
```

## 4. Runbook + ops docs completion
### Files
- `docs/deployment/backup-restore-runbook.md`

### Changes
1. Add final prod procedure: create -> offsite verify -> retention -> restore drill.
2. Add cron examples (UTC + local timezone note) and expected alerts.
3. Add incident checklist: who can run restore, artifact key logging, post-restore smoke checks.

### Commands
```bash
# example cron chain
pnpm backup:create -- --offsite
pnpm backup:verify -- --offsite-key=<latest-key>
pnpm backup:retention -- --dry-run
```

## 5. Test + CI guardrail for backup pipeline
### Files
- `scripts/ops/backup-pipeline-smoke.mjs` (new)
- `.github/workflows/nightly-local-full.yml`
- `package.json`

### Changes
1. Add smoke script to run: create(offsite) -> verify(offsite key) -> retention(dry-run).
2. Add scheduled CI job (or extend nightly job) to run smoke script against non-prod backup target.
3. Emit clear non-zero exit on any failed stage.

### Commands
```bash
pnpm backup:smoke:offsite
```

# Sequence
1. Deliverable 1 (upload) -> 2 (remote verify) -> 3 (retention) -> 4 (docs) -> 5 (tests/CI).
2. Do not merge until `backup:verify -- --restore-drill` passes in staging at least once.

# Definition of Done
- Offsite upload happens in same command run as backup create.
- Verify can operate from offsite key without manual local copy.
- Retention job prunes old backups deterministically with dry-run support.
- Runbook reflects exact prod commands and drill process.
- One automated smoke path exists and fails loudly.

# Unresolved Questions
1. Which exact offsite target is approved for prod (`R2` endpoint/bucket/prefix) and who owns key rotation?
2. Required restore drill frequency: weekly or monthly?
3. Do we need immutable retention (WORM/object lock) in this phase or next phase?

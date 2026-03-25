---
title: "R2-First Offsite Backup Minimal Operationalization"
description: "One-phase plan to add offsite upload command on top of existing backup create/verify/restore."
status: pending
priority: P1
effort: 4h
branch: main
tags: [backup, offsite, r2, ops]
created: 2026-03-25
---

# Scope (single phase)
- Keep current `backup:create`, `backup:verify`, `backup:restore` unchanged.
- Add one offsite upload script (R2-first) for existing backup artifacts.
- Add env vars, npm command, runbook updates, acceptance checklist.
- No retention automation, no CI workflow expansion in this phase.

# Phase 01 - R2 Offsite Upload Operationalization
## Checklist
- [ ] Add script `scripts/ops/upload-postgres-backup-offsite.mjs`
  - Input: `--file=<path/to/*.dump>`.
  - Upload `*.dump`, `*.dump.sha256`, `*.dump.json` (if sidecars exist).
  - R2-first via S3 API (`@aws-sdk/client-s3`), `region=auto`, endpoint `<account>.r2.cloudflarestorage.com`.
  - Print uploaded object keys + non-zero exit when any upload fails.
- [ ] Update env template `.env.example`
  - Add offsite vars for backup path only:
    - `BACKUP_OFFSITE_ENABLED=false`
    - `BACKUP_OFFSITE_R2_BUCKET=` (fallback to `R2_BUCKET_NAME`)
    - `BACKUP_OFFSITE_R2_PREFIX=postgres`
  - Reuse existing `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` to avoid duplicate secrets.
- [ ] Update `package.json`
  - Add `backup:offsite:upload` npm command.
  - Optional convenience (if needed): `backup:create:offsite` chaining `backup:create` then upload latest file.
- [ ] Update runbook `docs/deployment/backup-restore-runbook.md`
  - Add R2-first operational flow: create -> verify local -> upload offsite.
  - Document required env and example command.
  - Replace unresolved location question (R2 vs S3) with decision: `R2-first`.
- [ ] Update command docs in `README.md`
  - Add `pnpm backup:offsite:upload` usage in backup command block.

## Acceptance Checks (manual, minimal)
- [ ] `pnpm backup:create` returns success and creates 3 local artifacts.
- [ ] `pnpm backup:verify -- --file=<new.dump>` passes.
- [ ] `pnpm backup:offsite:upload -- --file=<new.dump>` returns success, prints 1-3 object keys.
- [ ] Run upload with missing/bad credentials and confirm non-zero exit + clear error.
- [ ] Runbook commands copy-paste clean on staging shell.

## Definition of Done
- One-command offsite upload exists and works with R2.
- Env template + runbook + README aligned with command.
- Acceptance checks pass on staging.

## Unresolved Questions
1. Có cần tách bucket backup riêng với media (`BACKUP_OFFSITE_R2_BUCKET`) ngay phase này hay dùng chung `R2_BUCKET_NAME` mặc định?
2. Prefix chuẩn cho môi trường (`postgres/prod`, `postgres/staging`) chốt theo convention nào?

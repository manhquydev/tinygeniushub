---
title: "Single SUPER_ADMIN Enforcement + Backup Restore Foundation"
description: "Enforce one SUPER_ADMIN at app+DB layers and bootstrap backup/restore foundations for fast migration and recovery."
status: pending
priority: P1
effort: 2.5d
branch: main
tags: [admin, rbac, backup, restore, migration]
created: 2026-03-25
---

# Scope
- A) Enforce exactly one `SUPER_ADMIN` policy in normal operations; all other admin users must be `SUPPORT_AGENT` or `CONTENT_EDITOR`.
- B) Bootstrap backup/restore foundation for fast server migration/recovery (metadata, scripts, runbook, dry-run verification).

# Phases
## Phase 1 - RBAC hardening (single SUPER_ADMIN)
### Goals
- Remove race-condition gaps and enforce single `SUPER_ADMIN` at DB level.
- Keep operational way to rotate SUPER_ADMIN safely (atomic transfer, no zero-admin window).

### Files to change
- `prisma/schema.prisma`
- `prisma/migrations/<new_timestamp>_enforce_single_super_admin/migration.sql`
- `src/app/api/admin/staff/route.ts`
- `src/app/api/admin/staff/[id]/route.ts`
- `src/components/admin-staff-panel.tsx`
- `src/modules/admin/admin-staff-service.ts`
- `prisma/scripts/seed-admin.ts`

### Implementation tasks
1. Add DB guarantee: unique partial index for `AdminAccount.role = 'SUPER_ADMIN'`.
2. Add pre-index data-fix SQL in migration: keep oldest `SUPER_ADMIN`, demote others to `SUPPORT_AGENT`.
3. Restrict standard create/update flows to staff roles only (`SUPPORT_AGENT`, `CONTENT_EDITOR`).
4. Add dedicated `SUPER_ADMIN` transfer endpoint/service using one transaction and row locking.
5. Update staff UI to remove direct SUPER_ADMIN role option; expose transfer action only for current SUPER_ADMIN.
6. Keep guard: cannot deactivate/demote last active SUPER_ADMIN.

## Phase 2 - Backup/restore foundation
### Goals
- Create minimum reliable building blocks for migration/recovery.
- Produce reproducible backup artifact + manifest + restore dry-run.

### Files to change
- `prisma/schema.prisma`
- `prisma/migrations/<new_timestamp>_add_backup_artifact_registry/migration.sql`
- `src/lib/env.ts`
- `.env.example`
- `src/modules/platform/backup-recovery-service.ts` (new)
- `src/modules/platform/backup-recovery-types.ts` (new)
- `src/modules/platform/storage/providers/types.ts`
- `src/modules/platform/storage/providers/cloudflare-r2-provider.ts`
- `src/modules/platform/storage/providers/mock-r2-provider.ts`
- `scripts/ops/create-db-backup.mjs` (new)
- `scripts/ops/restore-db-backup.mjs` (new)
- `scripts/ops/verify-backup-artifact.mjs` (new)
- `package.json`
- `docs/deployment/backup-restore-runbook.md` (new)

### Implementation tasks
1. Add `BackupArtifact` table (status, checksum, size, started/finished, storageKey, schemaVersion, appVersion, actor, notes).
2. Add env keys for backup ops (retention days, local staging dir, optional restore guard, optional R2 prefix).
3. Extend storage adapter with minimal object upload/download methods needed by backup scripts.
4. Implement backup script:
   - run `pg_dump` (custom format), gzip if needed, compute sha256,
   - upload to object storage,
   - persist metadata row.
5. Implement restore script:
   - fetch artifact,
   - checksum verify,
   - restore to target DB,
   - run migration deploy + quick health checks.
6. Implement verify script for scheduled restore dry-run on staging DB.
7. Add npm scripts: `backup:create`, `backup:restore`, `backup:verify`.
8. Add operational runbook for migration/recovery sequence.

## Phase 3 - Tests and validation
### Files to change
- `src/app/api/admin/staff/route.test.ts`
- `src/app/api/admin/staff/[id]/route.test.ts` (new)
- `src/modules/platform/__tests__/backup-recovery-service.test.ts` (new)
- `src/modules/platform/storage/providers/__tests__/cloudflare-r2-provider.test.ts` (new)
- `src/modules/platform/storage/providers/__tests__/mock-r2-provider.test.ts` (new)

### Test coverage
1. `POST /api/admin/staff` rejects SUPER_ADMIN creation from standard flow.
2. `PATCH /api/admin/staff/[id]` rejects unsafe demote/deactivate and validates transfer path.
3. Transfer flow is atomic and never leaves zero or two SUPER_ADMIN records.
4. Backup metadata writes are consistent for success/failure states.
5. Backup artifact checksum verification blocks restore on mismatch.
6. Restore dry-run finishes with passing `GET /api/health/ready`.

### Validation commands
- `pnpm lint`
- `pnpm type-check`
- `pnpm test`
- `pnpm backup:create -- --dry-run` (or test target DB)
- `pnpm backup:verify -- --staging`

## Phase 4 - Rollout
1. Take pre-change DB backup + export `AdminAccount(id,email,role,isActive,createdAt)`.
2. Deploy migration + app changes.
3. Execute one backup-create run and one restore-dry-run run.
4. Mark rollout complete only after tests and dry-run pass.

# Migration impacts
- New DB index on `AdminAccount` for single SUPER_ADMIN enforcement.
- Data correction during migration may demote extra SUPER_ADMIN users to SUPPORT_AGENT.
- New `BackupArtifact` table increases write volume during backup jobs only.
- Storage adapter interface expansion affects both `cloudflare_r2` and `mock_r2` providers.
- No change to parent-facing APIs.

# Rollback plan
1. App rollback: redeploy previous image/tag immediately.
2. DB rollback (RBAC): drop new partial unique index if blocking emergency role repair.
3. Role restore: use exported pre-change `AdminAccount` snapshot to restore roles manually.
4. Backup module rollback: disable new npm backup scripts and env flags; keep table unused.
5. Full restore fallback: recover DB from pre-change backup and redeploy previous app tag.

# Unresolved questions
- Should policy be "exactly one active SUPER_ADMIN" or "at most one SUPER_ADMIN"?
- Is SUPER_ADMIN transfer required in this sprint, or acceptable as manual SQL runbook only?
- Where will backup artifacts live in production (R2 bucket/prefix), and who owns key rotation?
- Required RPO/RTO targets for this environment (e.g., RPO 24h, RTO 60m)?
- Should restore verification run daily in staging or weekly to control cost?

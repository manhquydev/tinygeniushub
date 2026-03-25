# Backup Restore Runbook

## Goal
- Recover fast when incident/server loss/move VPS.
- Primary target:
  - RPO: <= 5 minutes (database-critical path).
  - RTO: <= 60-90 minutes (full service on new VPS).

## Strategy (hybrid, current decision)
1. VPS snapshot for fastest whole-host rollback.
2. PostgreSQL dump backups for portable restore across providers.
3. Redis persistence (`appendonly yes`) to reduce queue/data loss.
4. Offsite encrypted backup storage on **Cloudflare R2**.
5. Immutable retention enabled by **R2 Bucket Lock** on backup prefix only.
6. Google Drive (2TB paid) can be used as **portable archive mirror** for VPS migration.

## Decisions (resolved)
1. Offsite provider: **R2-first**.
2. Restore drill cadence: **monthly full restore drill** + **weekly lightweight verification**.
3. WORM: **enable now** (scoped only to backup objects).

## Free-first profile (startup stage)
- Default dev/staging can stay free with local-only mode:
  - `BACKUP_OFFSITE_ENABLED=false`
  - run only local `backup:create` + `backup:verify`
- If you still need offsite while keeping cost near zero:
  - use R2 **Standard** only (avoid Infrequent Access in early stage)
  - keep retained backup size inside monthly free limits
  - prefer weekly backups and short retention until traffic/data grows

## Required env for offsite upload
- `BACKUP_OFFSITE_ENABLED=true`
- `BACKUP_OFFSITE_R2_BUCKET` (or fallback `R2_BUCKET_NAME`)
- `BACKUP_OFFSITE_R2_PREFIX` (default `postgres/prod`)
- `BACKUP_OFFSITE_R2_ACCOUNT_ID` (or fallback `R2_ACCOUNT_ID`)
- `BACKUP_OFFSITE_R2_ACCESS_KEY_ID` (or fallback `R2_ACCESS_KEY_ID`)
- `BACKUP_OFFSITE_R2_SECRET_ACCESS_KEY` (or fallback `R2_SECRET_ACCESS_KEY`)
- optional: `BACKUP_OFFSITE_R2_ENDPOINT`, `BACKUP_OFFSITE_R2_REGION=auto`
- Recommended convention:
  - use a dedicated backup bucket (not shared media bucket)
  - production prefix: `postgres/prod`
  - staging prefix: `postgres/staging`

## Required env for Google Drive archive
- `BACKUP_GDRIVE_ENABLED=true` (only if you want `backup:create` auto-upload to Drive)
- `BACKUP_GDRIVE_REMOTE=gdrive` (rclone remote name)
- `BACKUP_GDRIVE_PREFIX=postgres/prod`

## rclone setup (one-time)
```bash
rclone config
# create remote named "gdrive" (Google Drive OAuth)
rclone about gdrive:
```

## Commands

### Create DB backup
```bash
pnpm backup:create
pnpm backup:create -- --offsite
# optional custom output dir
pnpm backup:create -- --out-dir=/var/backups/postgres
```

Outputs:
- `*.dump`
- `*.dump.sha256`
- `*.dump.json` (manifest metadata)

### Verify backup artifact
```bash
pnpm backup:verify -- --file=backups/postgres/<file>.dump
```

Checks:
- checksum (if `.sha256` exists)
- archive readability via `pg_restore --list`

### Upload backup offsite to R2
```bash
pnpm backup:offsite:upload -- --file=backups/postgres/<file>.dump
```

Uploads:
- `<file>.dump`
- `<file>.dump.sha256` (if exists)
- `<file>.dump.json` (if exists)

### Upload/list/download backups on Google Drive
```bash
# upload a generated dump to Google Drive
pnpm backup:gdrive:upload -- --file=backups/postgres/<file>.dump

# list remote dumps
pnpm backup:gdrive:list

# download one dump from Drive to local backups/postgres/
pnpm backup:gdrive:download -- --remote-key=postgres/prod/<file>.dump
```

### Restore DB backup
```bash
pnpm backup:restore -- --file=backups/postgres/<file>.dump
# keep existing objects (skip clean)
pnpm backup:restore -- --file=backups/postgres/<file>.dump --no-clean
```

## Weekly/Monthly operational cadence
- Weekly (lightweight):
  1. `pnpm backup:create -- --offsite --gdrive`
  2. `pnpm backup:verify -- --file=<latest.dump>`
  3. Confirm latest offsite key timestamp <= 6h.
- Monthly (full drill in staging/new VPS):
  1. Execute full restore from latest offsite artifact.
  2. Measure RTO and log result.
  3. Run post-restore smoke checks (`/api/health`, `/api/health/ready`, auth, webhook, queue).

## New VPS Recovery Flow
1. Provision VPS + Docker + Node + pnpm.
2. Pull repo and `.env.production`.
3. Start infra:
```bash
docker compose up -d postgres redis
```
4. Pull backup from Google Drive (if migrating provider/VPS):
```bash
pnpm backup:gdrive:list
pnpm backup:gdrive:download -- --remote-key=postgres/prod/<latest.dump>
pnpm backup:verify -- --file=backups/postgres/<latest.dump>
```
5. Restore DB:
```bash
pnpm backup:restore -- --file=<latest.dump>
```
6. Start app + worker and reload reverse proxy.
7. Smoke test:
```bash
curl -f http://localhost:3000/api/health
curl -f http://localhost:3000/api/health/ready
```
8. Verify admin login + billing webhook + queue processing.

## SUPER_ADMIN Operational Policy
- System policy: keep exactly one `SUPER_ADMIN` in operations.
- Setup/enforce:
```bash
pnpm admin:seed-super
```
- Existing duplicate super admins are auto-demoted to `SUPPORT_AGENT` by script/migration safeguards.

## Guardrails
- Production restore requires approval (2-person rule).
- Self-serve restore drills allowed on staging.
- Keep backup files out of git (`/backups/` is ignored).
- Keep backup upload credentials separate from app media upload credentials.
- Enable R2 Bucket Lock on backup prefix (example: `postgres/prod`) with minimum retention window (start 30 days).
- Google Drive archive does not provide S3-style object lock; keep R2 locked copy for ransomware-resistant retention.

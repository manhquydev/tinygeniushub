# Backup Restore Strategy Proposal - 2026-03-25

## Scope
- Work context: `D:/project/cungcontuhoc`
- Runtime today: Next.js + PostgreSQL 16 + Redis 7 + BullMQ + Docker Compose + PM2 + Nginx on single VPS
- Goal: minimize recovery time for incident recovery and VPS migration

## Target RPO/RTO
- Tier 1 (critical): PostgreSQL + app secrets/config (`.env.production`, PM2, Nginx, SSL)
  - Target RPO: <= 5 minutes
  - Target RTO: <= 60 minutes
- Tier 2 (important): Redis/BullMQ runtime state
  - Target RPO: <= 15 minutes (accept some queue replay)
  - Target RTO: <= 30 minutes
- Full host migration target:
  - RTO: 60-90 minutes (new VPS + restore + smoke test)

## Architecture Options

### Option A - Simple snapshots + daily logical DB dump
- Components:
  - VPS snapshot daily
  - `pg_dump -Fc` daily to offsite object storage
  - config backup (`/etc/nginx`, `/etc/letsencrypt`, `.env.production`, PM2)
- Pros: easiest to implement
- Cons: weak RPO, risky for same-day incidents
- Expected: RPO 24h, RTO 1-3h

### Option B - Hybrid fast recovery (RECOMMENDED)
- Components:
  - VPS snapshot (speed path)
  - PostgreSQL continuous WAL archive + nightly base backup + periodic logical dump
  - Redis persistence (`appendonly yes`, `appendfsync everysec`) + `/data` backup
  - Encrypted offsite backups with restic to S3-compatible storage (R2/S3)
  - Restore playbook + regular drill
- Pros: good RPO with still-manageable complexity
- Cons: more moving parts than Option A
- Expected: RPO 5m (PG), RTO 45-90m

### Option C - Warm standby (replica VPS)
- Components:
  - PostgreSQL streaming replica + Redis replica/failover + traffic switch
- Pros: best RTO/RPO
- Cons: highest cost/ops complexity
- Expected: RPO < 1m, RTO 10-20m

## Recommended Option (B) - Practical Design
1. Keep "fast path" restore via VPS snapshot for quickest whole-host recovery.
2. Add "data path" restore via PostgreSQL PITR (base backup + WAL archive) for low RPO.
3. Add "config path" restore via restic backups for app/config/secrets.
4. Treat BullMQ as at-least-once; enforce idempotent jobs and dedupe with `jobId`.

## Exact Implementation Checklist

### Phase 0 - Immediate hardening (same day)
1. Persist Redis data (current compose has no Redis volume).
2. Enable AOF on Redis.
3. Start encrypted offsite backup repo (restic).
4. Add logical PostgreSQL backups every 6 hours.
5. Back up PM2/Nginx/SSL/env.

Commands:
```bash
# install backup tool
sudo apt-get update && sudo apt-get install -y restic

# restic repo (example S3-compatible)
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export RESTIC_REPOSITORY="s3:https://<s3-endpoint>/<bucket>/ccth-prod"
export RESTIC_PASSWORD="<strong-password>"
restic init

# pg logical backup (custom format)
mkdir -p /var/backups/postgres
docker compose exec -T postgres pg_dump -U postgres -d cungcontuhoc -Fc > /var/backups/postgres/ccth-$(date +%F-%H%M).dump

# redis backup snapshot (after enabling /data persistence)
mkdir -p /var/backups/redis
docker compose exec -T redis redis-cli BGSAVE
docker compose cp redis:/data /var/backups/redis/data-$(date +%F-%H%M)

# config + app backup to offsite
restic backup /var/backups/postgres /var/backups/redis /var/www/cungcontuhoc/.env.production /etc/nginx /etc/letsencrypt /home/deploy/.pm2 --tag prod-baseline
restic check
```

### Phase 1 - Low RPO PostgreSQL (2-3 days)
1. Add WAL archive mount + base backup mount to postgres service.
2. Turn on WAL archiving (`wal_level=replica`, `archive_mode=on`, `archive_command=...`).
3. Run nightly `pg_basebackup`.
4. Sync WAL/basebackup dirs to offsite every 5 minutes with restic.
5. Add alert if WAL upload or backup job fails.

Commands:
```bash
# postgres settings
docker compose exec -T postgres psql -U postgres -d postgres -c "ALTER SYSTEM SET wal_level='replica';"
docker compose exec -T postgres psql -U postgres -d postgres -c "ALTER SYSTEM SET archive_mode='on';"
docker compose exec -T postgres psql -U postgres -d postgres -c "ALTER SYSTEM SET archive_command='test ! -f /var/lib/postgresql/wal-archive/%f && cp %p /var/lib/postgresql/wal-archive/%f';"
docker compose exec -T postgres psql -U postgres -d postgres -c "SELECT pg_reload_conf();"

# nightly base backup
docker compose exec -T postgres pg_basebackup -U postgres -D /var/lib/postgresql/basebackup/base-$(date +%F-%H%M) -Fp -Xs -P

# offsite sync every 5 min (cron)
restic backup /srv/ccth-backup/pg-wal-archive /srv/ccth-backup/pg-basebackup --tag pg-pitr
```

### Phase 2 - Recovery runbook + drills (weekly)
1. Create one command runbook for "new VPS restore".
2. Drill monthly using a fresh VPS.
3. Record measured RTO and fix bottlenecks.

Commands (restore core flow):
```bash
# new VPS: clone + bring infra
git clone <repo> /var/www/cungcontuhoc
cd /var/www/cungcontuhoc
docker compose up -d postgres redis

# restore latest logical dump
cat /restore/ccth-latest.dump | docker compose exec -T postgres pg_restore -U postgres -d cungcontuhoc --clean --if-exists --no-owner

# start app + worker + proxy
pm2 restart cungcontuhoc --update-env || pm2 start cungcontuhoc
sudo nginx -t && sudo nginx -s reload
```

## Operational Risks and Mitigations
- Risk: backup exists but restore fails.
  - Mitigation: mandatory monthly restore drill + `restic check` + test `pg_restore` in staging.
- Risk: Redis queue loss/duplication during outage.
  - Mitigation: Redis AOF + BullMQ idempotent jobs + explicit `jobId` dedupe.
- Risk: WAL archive stops silently.
  - Mitigation: health check for archive freshness (last file age), alert > 10 min.
- Risk: secrets mismatch after migration.
  - Mitigation: secrets inventory checklist + post-restore smoke test for auth/payment/webhooks.
- Risk: ransomware on same host affects local backups.
  - Mitigation: offsite immutable/object-lock backup retention.

## Phased Rollout
- Week 1:
  - Implement Phase 0, confirm first successful restore in staging.
- Week 2:
  - Implement PostgreSQL WAL+base backup flow (Phase 1), set monitoring.
- Week 3:
  - First full "new VPS" game-day drill, tune to hit RTO target.
- Ongoing:
  - Monthly drill, quarterly migration rehearsal, retention/cost tuning.

## Acceptance Criteria
- Can recover to fresh VPS in <= 90 min (target <= 60 min after tuning).
- PostgreSQL data loss <= 5 min in drill.
- Backup jobs report green daily; failed jobs alert within 10 min.

## Source Notes (official docs checked)
- PostgreSQL PITR + WAL archiving: https://www.postgresql.org/docs/16/continuous-archiving.html
- PostgreSQL logical dump/restore (`pg_dump -Fc`, `pg_restore`): https://www.postgresql.org/docs/16/backup-dump.html
- PostgreSQL base backup (`pg_basebackup`): https://www.postgresql.org/docs/current/app-pgbasebackup.html
- Redis persistence (`appendfsync everysec`): https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/
- BullMQ semantics/idempotent jobs: https://docs.bullmq.io/ and https://docs.bullmq.io/patterns/idempotent-jobs
- Docker volume backup/restore pattern: https://docs.docker.com/engine/storage/volumes/
- Nginx reload/test commands: https://nginx.org/en/docs/switches.html and https://nginx.org/en/docs/beginners_guide.html
- restic quickstart/check/restore: https://restic.readthedocs.io/en/stable/010_introduction.html

## Unresolved Questions
1. Production DB size + daily WAL volume (needed to finalize retention and bandwidth).
2. Exact backup storage target (Cloudflare R2, AWS S3, or other) and region.
3. Are Redis/BullMQ jobs business-critical enough to require strict recovery, or acceptable to replay/rebuild?
4. Is immutable backup retention (object lock/WORM) available on chosen storage?
5. Can we reserve a prebuilt "recovery VPS image" to consistently hit <= 60 min RTO?

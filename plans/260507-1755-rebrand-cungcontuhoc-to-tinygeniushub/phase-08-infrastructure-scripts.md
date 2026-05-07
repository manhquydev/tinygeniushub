# Phase 8: Infrastructure Scripts

## Context Links
- Scout report: lines 249–276
- 21 scripts in `scripts/` directory

## Overview
- **Priority**: P2 (Medium)
- **Status**: completed (2026-05-08)
- **Effort**: ~2h
- Update all shell/Node.js scripts with new paths, domains, PM2 names, DB names, and brand references.
- Depends on Phase 1 (ecosystem.config.js, docker-compose) for consistent PM2 names and server paths.

## Replace Patterns

| Find Pattern | Replace With | Context |
|-------------|-------------|---------|
| `/var/www/cungcontuhoc` | `/var/www/tinygeniushub` | Server paths |
| `/srv/cungcontuhoc` | `/srv/tinygeniushub` | Alternative server paths |
| `cungcontuhoc-web` | `tinygeniushub-web` | PM2 process names |
| `cungcontuhoc-worker` | `tinygeniushub-worker` | PM2 process names |
| `cungcontuhoc.io.vn` | `tinygeniushubvn.tech` | Domain references |
| `cungcontuhoc` (DB name context) | `tinygeniushub` | PostgreSQL DB name |
| `cungcontuhoc_app` (DB user) | `tinygeniushub_app` | PostgreSQL user |
| `cungcontuhoc_` (backup prefix) | `tinygeniushub_` | Backup file naming |
| `Cùng Con Tự Học` (header comment) | `TinyGenius Hub` | Script header comments |

## Files to Modify

### Shell Scripts

| # | File | Replacements |
|---|------|-------------|
| 1 | `scripts/health-monitor.sh` | APP_URL → new domain, LOG_FILE → new paths, FAILURE_COUNT_FILE → new paths |
| 2 | `scripts/migrate-server.sh` | DOMAIN → `tinygeniushubvn.tech`, server paths `/var/www/cungcontuhoc` → `/var/www/tinygeniushub` |
| 3 | `scripts/nginx-ssl-setup.sh` | DOMAIN → `tinygeniushubvn.tech`, EMAIL → `admin@tinygeniushubvn.tech`, nginx site name `cungcontuhoc.io.vn` → `tinygeniushubvn.tech` |
| 4 | `scripts/deploy-initial.sh` | `APP_DIR="/srv/cungcontuhoc"` → `APP_DIR="/srv/tinygeniushub"` |
| 5 | `scripts/deploy-do.sh` | APP_PATH, pm2 process names |
| 6 | `scripts/deploy-production.sh` | APP_DIR, REPO_URL (**skip repo** per decision), SSH key path |
| 7 | `scripts/app-setup.sh` | APP_DIR, REPO_URL (**skip repo** per decision), clone dir |
| 8 | `scripts/daily-backup.sh` | APP_DIR, LOG_FILE, BACKUP_FILE prefix `cungcontuhoc_*` → `tinygeniushub_*` |
| 9 | `scripts/abeka-import.sh` | APP_DIR, health check URLs |
| 10 | `scripts/verify-production.sh` | APP_PATH, pm2 process name |
| 11 | `scripts/redis-setup.sh` | Header comment `Cùng Con Tự Học` → `TinyGenius Hub` |
| 12 | `scripts/pgbouncer-setup.sh` | Header comment, DB_NAME `cungcontuhoc` → `tinygeniushub`, DB_USER `cungcontuhoc_app` → `tinygeniushub_app` |
| 13 | `scripts/postgres-setup.sh` | DB_NAME/DB_USER → `tinygeniushub` / `tinygeniushub_app` |
| 14 | `scripts/vps-setup.sh` | Header comment + echo `Cùng Con Tự Học` → `TinyGenius Hub` |

### Production Sub-scripts

| # | File | Replacements |
|---|------|-------------|
| 15 | `scripts/production/production-gate-check.sh` | `WORKER_PROCESS_NAME: cungcontuhoc-worker` → `tinygeniushub-worker` |
| 16 | `scripts/production/check-trial-videos-remote.sh` | Server path, DB name |
| 17 | `scripts/deploy/remote-deploy.sh` | PM2 process names `cungcontuhoc-web/worker` → `tinygeniushub-web/worker` |
| 18 | `scripts/deploy/production-email-verify-hotfix.sh` | APP_DIR, BASE_URL, process names |

### Node.js/Python Scripts

| # | File | Replacements |
|---|------|-------------|
| 19 | `scripts/import-abeka-videos.ts` | Data path `/var/www/cungcontuhoc` → `/var/www/tinygeniushub` |
| 20 | `scripts/ops/create-postgres-backup.mjs` | DB name `cungcontuhoc` → `tinygeniushub` |
| 21 | `scripts/ops/restore-postgres-backup.mjs` | DB name `cungcontuhoc` → `tinygeniushub` |

## Implementation Steps

1. **Pre-flight**: Verify all scripts are tracked in git (not gitignored).
2. **Bulk replace in scripts/ directory**:
   ```bash
   # Server paths (must come first to avoid partial matches)
   find scripts/ -type f -exec sed -i 's|/var/www/cungcontuhoc|/var/www/tinygeniushub|g' {} +
   find scripts/ -type f -exec sed -i 's|/srv/cungcontuhoc|/srv/tinygeniushub|g' {} +

   # PM2 process names
   find scripts/ -type f -exec sed -i 's|cungcontuhoc-web|tinygeniushub-web|g' {} +
   find scripts/ -type f -exec sed -i 's|cungcontuhoc-worker|tinygeniushub-worker|g' {} +

   # Domain
   find scripts/ -type f -exec sed -i 's|cungcontuhoc\.io\.vn|tinygeniushubvn\.tech|g' {} +

   # DB names (be careful with partial matches)
   find scripts/ -type f -exec sed -i 's|cungcontuhoc_app|tinygeniushub_app|g' {} +
   find scripts/ -type f -exec sed -i 's|cungcontuhoc_|tinygeniushub_|g' {} +
   ```
3. **Manual review**: For `pgbouncer-setup.sh` and `postgres-setup.sh`, DB names are critical. Review these files carefully.
4. **Header comments**: `sed -i 's/Cùng Con Tự Học/TinyGenius Hub/g'` for script headers only.
5. **Verify**: `rg "cungcontuhoc" scripts/` — expect 0 results (or only in comments about the old name if documentation).
6. **Shellcheck**: Run `shellcheck scripts/*.sh` to catch any syntax errors from the sed replacements (unlikely but good practice).

## Acceptance Criteria
- [x] `rg "cungcontuhoc" scripts/` returns 0 (or only intentional historical reference comments)
- [x] Server paths all reference `/var/www/tinygeniushub` or `/srv/tinygeniushub`
- [x] PM2 names all reference `tinygeniushub-web` and `tinygeniushub-worker`
- [x] DB names in `postgres-setup.sh` and `pgbouncer-setup.sh` are `tinygeniushub`
- [x] Domain `cungcontuhoc.io.vn` not found in scripts/

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| `sed` replaces substring within a longer string incorrectly | Review all changes with `git diff` before committing |
| DB user name `cungcontuhoc_app` was referenced in production env vars | Ensure environment files on server are also updated (not tracked in git) |
| Deploy script path mismatch with actual server | Verify server directory exists at new path before running deploy |
| Backup script names change and old backups not found | Keep old backups in place; new backups go to new prefix file names |

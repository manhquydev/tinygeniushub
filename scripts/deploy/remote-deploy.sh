#!/usr/bin/env bash
set -euo pipefail
deploy_ref="${1:-}"
post_deploy_cmd="${POST_DEPLOY_CMD:-}"
deploy_started_at_utc="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
pre_migrate_backup_file=""
pre_migrate_backup_sha256=""
if [[ -z "$deploy_ref" ]]; then
  echo "Usage: bash scripts/deploy/remote-deploy.sh <git-ref>"
  exit 1
fi
resolve_prisma_dotenv_path() {
  for candidate in "${DEPLOY_ENV_FILE:-}" ".env.production.local" ".env.production" ".env"; do
    if [[ -n "$candidate" && -f "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done
  echo ""
}

extract_database_url_from_env_file() {
  local env_file="$1"
  node --input-type=module -e 'import fs from "node:fs"; import dotenv from "dotenv"; const f=process.argv[1]; try { const p=dotenv.parse(fs.readFileSync(f,"utf8")); process.stdout.write(p.DATABASE_URL ?? ""); } catch {}' "$env_file"
}
resolve_effective_database_url() {
  local dotenv_path="$1"
  if [[ -n "${DATABASE_URL:-}" ]]; then
    echo "${DATABASE_URL}"
    return 0
  fi
  if [[ -n "$dotenv_path" ]]; then
    extract_database_url_from_env_file "$dotenv_path"
    return 0
  fi
  echo ""
}
sanitize_database_url_for_pg_tools() {
  local raw_url="$1"
  node --input-type=module -e 'const raw=process.argv[1] ?? ""; try { const parsed=new URL(raw); ["schema","connection_limit","pool_timeout","pgbouncer","statement_cache_size"].forEach((k)=>parsed.searchParams.delete(k)); process.stdout.write(parsed.toString()); } catch { process.stdout.write(raw); }' "$raw_url"
}
create_pre_migrate_backup() {
  local dotenv_path="$1"
  local raw_database_url
  local pg_tools_database_url
  local backup_root_dir
  local backup_stamp
  local keep_count
  local keep_days
  local previous_umask

  if ! command -v pg_dump >/dev/null; then
    echo "[deploy] Missing required command: pg_dump"
    exit 1
  fi
  if ! command -v pg_restore >/dev/null; then
    echo "[deploy] Missing required command: pg_restore"
    exit 1
  fi
  raw_database_url="$(resolve_effective_database_url "$dotenv_path")"
  if [[ -z "$raw_database_url" ]]; then
    echo "[deploy] DATABASE_URL is required for mandatory pre-migrate backup"
    exit 1
  fi
  pg_tools_database_url="$(sanitize_database_url_for_pg_tools "$raw_database_url")"
  backup_root_dir="${DEPLOY_PRE_MIGRATE_BACKUP_DIR:-${PWD}/backups/pre-migrate}"
  backup_stamp="$(date -u +%Y%m%dT%H%M%SZ)"
  pre_migrate_backup_file="${backup_root_dir}/ccth-pre-migrate-${backup_stamp}.dump"
  keep_count="${DEPLOY_PRE_MIGRATE_BACKUP_KEEP_COUNT:-20}"
  keep_days="${DEPLOY_PRE_MIGRATE_BACKUP_KEEP_DAYS:-14}"

  previous_umask="$(umask)"
  umask 077
  mkdir -p "$backup_root_dir"
  chmod 700 "$backup_root_dir" || true
  echo "[deploy] Creating mandatory pre-migrate backup: ${pre_migrate_backup_file}"
  pg_dump \
    --format=custom \
    --no-owner \
    --no-privileges \
    --file "${pre_migrate_backup_file}" \
    "${pg_tools_database_url}"
  chmod 600 "${pre_migrate_backup_file}" || true
  umask "$previous_umask"

  pg_restore --list "${pre_migrate_backup_file}" >/dev/null
  if command -v sha256sum >/dev/null; then
    pre_migrate_backup_sha256="$(sha256sum "${pre_migrate_backup_file}" | awk '{print $1}')"
  elif command -v shasum >/dev/null; then
    pre_migrate_backup_sha256="$(shasum -a 256 "${pre_migrate_backup_file}" | awk '{print $1}')"
  else
    pre_migrate_backup_sha256=""
  fi
  if [[ -n "$pre_migrate_backup_sha256" ]]; then
    echo "[deploy] Pre-migrate backup checksum: ${pre_migrate_backup_sha256}"
  fi

  if [[ "$keep_days" =~ ^[0-9]+$ ]] && [[ "$keep_days" -gt 0 ]]; then
    find "$backup_root_dir" -maxdepth 1 -type f -name 'ccth-pre-migrate-*.dump' -mtime "+${keep_days}" -delete || true
  fi

  if [[ "$keep_count" =~ ^[0-9]+$ ]] && [[ "$keep_count" -gt 0 ]]; then
    mapfile -t old_backups < <(ls -1t "${backup_root_dir}"/ccth-pre-migrate-*.dump 2>/dev/null || true)
    if [[ "${#old_backups[@]}" -gt "$keep_count" ]]; then
      for old_backup in "${old_backups[@]:$keep_count}"; do
        rm -f "$old_backup"
      done
    fi
  fi
}
write_rollback_policy() {
  local previous_sha="$1"
  local rollback_target_sha="${previous_sha:-unavailable}"
  mkdir -p .deploy
  cat > .deploy/rollback-policy.md <<EOF
# Rollback Policy (generated ${deploy_started_at_utc})
Fast rollback: \`git checkout --force ${rollback_target_sha}\` -> \`pnpm install --frozen-lockfile\` -> \`pnpm db:generate\` -> \`pnpm build\` -> restart PM2 web+worker.
Full rollback (maintenance window required):
1. Set sanitized \`DB_RESTORE_URL\` (remove: \`schema\`, \`connection_limit\`, \`pool_timeout\`, \`pgbouncer\`, \`statement_cache_size\`).
2. \`pg_restore --clean --if-exists --no-owner --no-privileges --dbname "\$DB_RESTORE_URL" "${pre_migrate_backup_file}"\`
3. Run fast rollback steps.
4. Verify \`/api/health\` and \`/api/health/ready\`.
EOF
}

previous_sha="$(git rev-parse --verify HEAD 2>/dev/null || true)"
echo "[deploy] Checking out ${deploy_ref}"
git fetch --prune origin --tags +refs/heads/*:refs/remotes/origin/*

resolved_ref="${deploy_ref}"
if git show-ref --verify --quiet "refs/remotes/origin/${deploy_ref}"; then
  resolved_ref="refs/remotes/origin/${deploy_ref}"
fi

if ! git rev-parse --verify "${resolved_ref}^{commit}" >/dev/null 2>&1; then
  echo "[deploy] Invalid ref: ${deploy_ref} (resolved as ${resolved_ref})"
  exit 1
fi

deploy_sha="$(git rev-parse --verify "${resolved_ref}^{commit}")"
echo "[deploy] Resolved deploy SHA: ${deploy_sha}"
git checkout --force "${deploy_sha}"

echo "[deploy] Installing dependencies"
pnpm install --frozen-lockfile

echo "[deploy] Generating Prisma client"
pnpm db:generate

echo "[deploy] Applying database migrations"
prisma_dotenv_path="$(resolve_prisma_dotenv_path)"
create_pre_migrate_backup "$prisma_dotenv_path"
run_migrate_deploy() {
  # Prefer runtime-provided DATABASE_URL. If missing, point Prisma dotenv to a production env file.
  if [[ -n "${DATABASE_URL:-}" ]]; then
    echo "[deploy] DATABASE_URL detected from process environment"
    pnpm prisma migrate deploy
  else
    if [[ -n "$prisma_dotenv_path" ]]; then
      echo "[deploy] Loading Prisma env from ${prisma_dotenv_path}"
      DOTENV_CONFIG_PATH="$prisma_dotenv_path" pnpm prisma migrate deploy
    else
      echo "[deploy] No env file found; running migrate with current shell env only"
      pnpm prisma migrate deploy
    fi
  fi
}

migrate_attempt=1
until run_migrate_deploy; do
  if [[ "$migrate_attempt" -ge 5 ]]; then
    echo "[deploy] Migration failed after ${migrate_attempt} attempts."
    exit 1
  fi
  echo "[deploy] Migration attempt ${migrate_attempt} failed, retrying in 5s..."
  migrate_attempt=$((migrate_attempt + 1))
  sleep 5
done

echo "[deploy] Building production bundle"
pnpm build

run_default_post_deploy() {
  echo "[deploy] Running default PM2 restart"
  pm2 restart tinygeniushub-web --update-env || pm2 start tinygeniushub-web
  pm2 describe tinygeniushub-web >/dev/null

  pm2 restart tinygeniushub-worker --update-env || pm2 start tinygeniushub-worker
  pm2 describe tinygeniushub-worker >/dev/null
}

if [[ -n "$post_deploy_cmd" ]]; then
  echo "[deploy] Running post-deploy command"
  bash -lc "$post_deploy_cmd"
else
  run_default_post_deploy
fi

echo "[deploy] Writing deployment metadata"
mkdir -p .deploy
write_rollback_policy "$previous_sha"
cat > .deploy/latest.json <<EOF
{
  "deployRef": "${deploy_ref}",
  "deploySha": "${deploy_sha}",
  "deployedAtUtc": "${deploy_started_at_utc}",
  "previousSha": "${previous_sha}",
  "preMigrateBackupFile": "${pre_migrate_backup_file}",
  "preMigrateBackupSha256": "${pre_migrate_backup_sha256}",
  "rollbackPolicyPath": ".deploy/rollback-policy.md"
}
EOF

echo "[deploy] Completed successfully"

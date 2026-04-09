#!/usr/bin/env bash
set -euo pipefail

deploy_ref="${1:-}"
post_deploy_cmd="${POST_DEPLOY_CMD:-}"

if [[ -z "$deploy_ref" ]]; then
  echo "Usage: bash scripts/deploy/remote-deploy.sh <git-ref>"
  exit 1
fi

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
run_migrate_deploy() {
  # Prefer runtime-provided DATABASE_URL. If missing, point Prisma dotenv to
  # production env files before falling back to .env.
  if [[ -n "${DATABASE_URL:-}" ]]; then
    echo "[deploy] DATABASE_URL detected from process environment"
    pnpm prisma migrate deploy
  else
    prisma_dotenv_path=""
    for candidate in "${DEPLOY_ENV_FILE:-}" ".env.production.local" ".env.production" ".env"; do
      if [[ -n "$candidate" && -f "$candidate" ]]; then
        prisma_dotenv_path="$candidate"
        break
      fi
    done

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
  pm2 restart cungcontuhoc-web --update-env || pm2 start cungcontuhoc-web
  pm2 describe cungcontuhoc-web >/dev/null

  pm2 restart cungcontuhoc-worker --update-env || pm2 start cungcontuhoc-worker
  pm2 describe cungcontuhoc-worker >/dev/null
}

if [[ -n "$post_deploy_cmd" ]]; then
  echo "[deploy] Running post-deploy command"
  bash -lc "$post_deploy_cmd"
else
  run_default_post_deploy
fi

echo "[deploy] Writing deployment metadata"
mkdir -p .deploy
cat > .deploy/latest.json <<EOF
{
  "deployRef": "${deploy_ref}",
  "deploySha": "${deploy_sha}",
  "deployedAtUtc": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "[deploy] Completed successfully"

#!/usr/bin/env bash
set -euo pipefail

deploy_ref="${1:-}"
post_deploy_cmd="${POST_DEPLOY_CMD:-}"

if [[ -z "$deploy_ref" ]]; then
  echo "Usage: bash scripts/deploy/remote-deploy.sh <git-ref>"
  exit 1
fi

echo "[deploy] Checking out ${deploy_ref}"
git fetch --prune origin
git checkout --force "$deploy_ref"
git pull --ff-only origin main || true

echo "[deploy] Installing dependencies"
pnpm install --frozen-lockfile

echo "[deploy] Generating Prisma client"
pnpm db:generate

echo "[deploy] Applying database migrations"
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

echo "[deploy] Building production bundle"
pnpm build

if [[ -n "$post_deploy_cmd" ]]; then
  echo "[deploy] Running post-deploy command"
  bash -lc "$post_deploy_cmd"
else
  echo "[deploy] No post-deploy command set (POST_DEPLOY_CMD is empty)"
fi

echo "[deploy] Completed successfully"

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

echo "[deploy] Installing dependencies"
pnpm install --frozen-lockfile

echo "[deploy] Generating Prisma client"
pnpm db:generate

echo "[deploy] Applying database migrations"
pnpm prisma migrate deploy

echo "[deploy] Building production bundle"
pnpm build

if [[ -n "$post_deploy_cmd" ]]; then
  echo "[deploy] Running post-deploy command"
  bash -lc "$post_deploy_cmd"
else
  echo "[deploy] No post-deploy command set (POST_DEPLOY_CMD is empty)"
fi

echo "[deploy] Completed successfully"

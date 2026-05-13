#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  echo "Usage: bash scripts/deploy/production-email-verify-hotfix.sh <ssh-target> [git-ref]"
  echo "Example: bash scripts/deploy/production-email-verify-hotfix.sh do-server main"
  exit 1
fi

GIT_REF="${2:-$(git rev-parse --abbrev-ref HEAD)}"
APP_DIR="${APP_DIR:-/var/www/tinygeniushub}"
BASE_URL="${BASE_URL:-https://www.tinygeniushubvn.tech}"
WEB_PROCESS="${WEB_PROCESS:-tinygeniushub-web}"
WORKER_PROCESS="${WORKER_PROCESS:-tinygeniushub-worker}"
REMOTE_ENV_FILE="${REMOTE_ENV_FILE:-.env.production}"

echo "[hotfix] target=$TARGET ref=$GIT_REF app_dir=$APP_DIR base_url=$BASE_URL"

echo "[hotfix] 1/4 Deploy code + migrate + build + restart"
ssh "$TARGET" "bash -lc '
  set -euo pipefail
  cd \"$APP_DIR\"
  git fetch --prune origin
  git checkout --force \"$GIT_REF\"
  git pull --ff-only origin \"$GIT_REF\" || true
  pnpm install --frozen-lockfile
  pnpm db:generate
  DOTENV_CONFIG_PATH=\"$REMOTE_ENV_FILE\" pnpm prisma migrate deploy
  pnpm build
  pm2 describe \"$WEB_PROCESS\" >/dev/null 2>&1 && pm2 restart \"$WEB_PROCESS\" || pm2 restart all
  pm2 describe \"$WORKER_PROCESS\" >/dev/null 2>&1 && pm2 restart \"$WORKER_PROCESS\" || true
'"

echo "[hotfix] 2/4 Verify local health on server"
ssh "$TARGET" "bash -lc '
  set -euo pipefail
  curl -fsS http://localhost:3000/api/health >/tmp/hotfix-health.json
  curl -fsS http://localhost:3000/api/health/ready >/tmp/hotfix-ready.json
  echo \"health=$(cat /tmp/hotfix-health.json)\"
  echo \"ready=$(cat /tmp/hotfix-ready.json)\"
'"

echo "[hotfix] 3/4 Verify DB flag parentEmailVerificationRequired=true"
ssh "$TARGET" "bash -lc '
  set -euo pipefail
  cd \"$APP_DIR\"
  node -e \"const { PrismaClient } = require(\\\"@prisma/client\\\"); const prisma = new PrismaClient(); (async () => { const row = await prisma.adminSecuritySettings.findUnique({ where: { id: \\\"default\\\" } }); const controls = row?.securityControls || {}; const value = controls.parentEmailVerificationRequired; console.log(\\\"parentEmailVerificationRequired=\\\" + String(value)); if (value !== true) process.exit(2); })().finally(() => prisma.\\\$disconnect());\"
'"

echo "[hotfix] 4/4 Live behavior check on public domain"
node - "$BASE_URL" <<'NODE'
const crypto = require("node:crypto");

async function main() {
  const baseUrl = process.argv[2];
  const email = `prod-hotfix-${Date.now()}-${crypto.randomUUID().slice(0, 8)}@example.com`;
  const password = "ProdHotfix123!";

  const signup = await fetch(`${baseUrl}/api/auth/signup`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: baseUrl,
    },
    body: JSON.stringify({
      email,
      password,
      displayName: "Prod Hotfix Verify",
      legalAccepted: true,
    }),
  });

  const signupBody = await signup.json().catch(() => null);
  const signupCookie = signup.headers.get("set-cookie") ?? "";
  const signupHasSession = /ccth_session=/i.test(signupCookie);
  const signupVerificationRequired = signupBody?.data?.verification?.required === true;

  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: baseUrl,
    },
    body: JSON.stringify({ email, password }),
  });

  const loginBody = await login.json().catch(() => null);
  const loginCookie = login.headers.get("set-cookie") ?? "";
  const loginHasSession = /ccth_session=/i.test(loginCookie);
  const loginBlocked =
    login.status === 403 && loginBody?.error?.details?.code === "EMAIL_NOT_VERIFIED";

  const result = {
    baseUrl,
    email,
    signupStatus: signup.status,
    signupVerificationRequired,
    signupHasSession,
    loginStatus: login.status,
    loginCode: loginBody?.error?.details?.code ?? null,
    loginHasSession,
  };
  console.log(JSON.stringify(result, null, 2));

  if (!signupVerificationRequired || signupHasSession || !loginBlocked || loginHasSession) {
    process.exit(3);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
NODE

echo "[hotfix] SUCCESS: email verification hotfix is deployed and validated."

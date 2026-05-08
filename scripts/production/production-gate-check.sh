#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
STAGE="${STAGE:-post-deploy}"
ENV_FILE="${ENV_FILE:-.env}"
LOAD_ENV_FILE="${LOAD_ENV_FILE:-true}"
CURL_TIMEOUT_SECONDS="${CURL_TIMEOUT_SECONDS:-15}"
UI_ROOT_MARKER="${UI_ROOT_MARKER:-}"

EXPECTED_PACKAGE_CODES_DEFAULT="PRESCHOOL_PREMIUM,ELEMENTARY_PRO,MIDDLE_ADVANCED,HIGH_ELITE,ENGLISH_MASTER,MATH_THINKING,STEM_INNOVATOR,ULTIMATE"
EXPECTED_PACKAGE_CODES="${EXPECTED_PACKAGE_CODES:-$EXPECTED_PACKAGE_CODES_DEFAULT}"
REQUIRED_SECRETS="${REQUIRED_SECRETS:-DATABASE_URL,SESSION_SECRET,BETTER_AUTH_SECRET,ADMIN_AUTH_SECRET,BETTER_AUTH_URL,BILLING_WEBHOOK_SECRET,CRON_SECRET,MOCK_UPLOAD_SIGNING_SECRET,REDIS_URL}"

WORKER_PROCESS_NAME="${WORKER_PROCESS_NAME:-tinygeniushub-worker}"
RESTART_WINDOW_SECONDS="${RESTART_WINDOW_SECONDS:-20}"
MAX_RESTART_DELTA="${MAX_RESTART_DELTA:-2}"
CHECK_WORKER="${CHECK_WORKER:-true}"
CHECK_SECRETS="${CHECK_SECRETS:-true}"

UI_PATHS=("/" "/pricing" "/courses" "/try-garden" "/admin/login")

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

usage() {
  cat <<'EOF'
Production gate check (pre/post deploy)

Usage:
  bash scripts/production/production-gate-check.sh [options]

Options:
  --base-url URL                Target base URL (default: BASE_URL env or http://localhost:3000)
  --stage NAME                  Stage label for report (default: post-deploy)
  --env-file PATH               Env file used for secrets readiness (default: .env)
  --required-secrets CSV        Override required secret keys
  --expected-package-codes CSV  Override expected package codes
  --worker-name NAME            PM2 worker process name (default: tinygeniushub-worker)
  --restart-window SEC          Observe worker restarts in window seconds (default: 20)
  --max-restart-delta N         Fail if restart delta > N (default: 2)
  --skip-worker                 Skip worker restart storm check
  --skip-secrets                Skip secrets readiness check
  -h, --help                    Show this help
EOF
}

pass() { echo -e "${GREEN}[PASS]${NC} $1"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { echo -e "${RED}[FAIL]${NC} $1"; FAIL_COUNT=$((FAIL_COUNT + 1)); }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; WARN_COUNT=$((WARN_COUNT + 1)); }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }

while [[ $# -gt 0 ]]; do
  case "$1" in
    --base-url) BASE_URL="$2"; shift 2 ;;
    --stage) STAGE="$2"; shift 2 ;;
    --env-file) ENV_FILE="$2"; shift 2 ;;
    --required-secrets) REQUIRED_SECRETS="$2"; shift 2 ;;
    --expected-package-codes) EXPECTED_PACKAGE_CODES="$2"; shift 2 ;;
    --worker-name) WORKER_PROCESS_NAME="$2"; shift 2 ;;
    --restart-window) RESTART_WINDOW_SECONDS="$2"; shift 2 ;;
    --max-restart-delta) MAX_RESTART_DELTA="$2"; shift 2 ;;
    --skip-worker) CHECK_WORKER="false"; shift ;;
    --skip-secrets) CHECK_SECRETS="false"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
done

BASE_URL="${BASE_URL%/}"

check_http_2xx_or_3xx() {
  local url="$1"
  local body_file="$2"
  local status
  status=$(curl -sS -L --max-time "$CURL_TIMEOUT_SECONDS" -o "$body_file" -w "%{http_code}" "$url" || echo "000")
  if [[ "$status" =~ ^2[0-9][0-9]$|^3[0-9][0-9]$ ]]; then
    return 0
  fi
  return 1
}

check_ui_smoke() {
  info "UI smoke checks"
  local path body_file
  for path in "${UI_PATHS[@]}"; do
    body_file=$(mktemp)
    if check_http_2xx_or_3xx "$BASE_URL$path" "$body_file"; then
      pass "UI path healthy: $path"
    else
      fail "UI path failed: $path"
    fi

    if [[ "$path" == "/" && -n "$UI_ROOT_MARKER" ]]; then
      if grep -Fq "$UI_ROOT_MARKER" "$body_file"; then
        pass "UI root marker detected"
      else
        fail "UI root marker missing: $UI_ROOT_MARKER"
      fi
    fi
    rm -f "$body_file"
  done
}

check_health_api() {
  info "Core API health checks"
  local body_file
  body_file=$(mktemp)

  if check_http_2xx_or_3xx "$BASE_URL/api/health" "$body_file"; then
    if node -e 'const fs=require("fs");const d=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));if(!(d&&d.ok===true&&d.data&&d.data.status==="ok")){process.exit(1)}' "$body_file"; then
      pass "Core API /api/health = ok"
    else
      fail "Core API /api/health payload invalid"
    fi
  else
    fail "Core API /api/health unreachable"
  fi

  rm -f "$body_file"
}

check_package_parity() {
  info "Package parity checks"
  local body_file
  body_file=$(mktemp)

  if ! check_http_2xx_or_3xx "$BASE_URL/api/abeka/packages" "$body_file"; then
    rm -f "$body_file"
    fail "Package API /api/abeka/packages unreachable"
    return
  fi

  if node - "$body_file" "$EXPECTED_PACKAGE_CODES" <<'NODE'
const fs = require("fs");
const [filePath, expectedCsv] = process.argv.slice(2);
const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
const packages = payload?.data?.packages;
if (!Array.isArray(packages)) {
  console.error("packages array missing");
  process.exit(2);
}
const expected = expectedCsv.split(",").map((x) => x.trim()).filter(Boolean).sort();
const actual = packages.map((p) => String(p?.code || "").trim()).filter(Boolean).sort();
if (actual.length !== expected.length) {
  console.error(`package count mismatch actual=${actual.length} expected=${expected.length}`);
  process.exit(3);
}
if (JSON.stringify(actual) !== JSON.stringify(expected)) {
  console.error(`package codes mismatch actual=${actual.join(",")} expected=${expected.join(",")}`);
  process.exit(4);
}
NODE
  then
    pass "Package parity matched canonical package codes"
  else
    fail "Package parity mismatch vs canonical package codes"
  fi

  rm -f "$body_file"
}

check_secrets_readiness() {
  [[ "$CHECK_SECRETS" == "true" ]] || { warn "Skip secrets readiness check"; return; }

  info "Secrets readiness checks"
  if [[ "$LOAD_ENV_FILE" == "true" && -f "$ENV_FILE" ]]; then
    # shellcheck disable=SC1090
    set -a; source "$ENV_FILE"; set +a
    pass "Loaded env file: $ENV_FILE"
  else
    warn "Env file not loaded (LOAD_ENV_FILE=$LOAD_ENV_FILE, ENV_FILE=$ENV_FILE)"
  fi

  local keys_csv="$REQUIRED_SECRETS"
  local billing="${BILLING_PROVIDER:-mock_gateway}"
  local course_payment="${COURSE_PAYMENT_PROVIDER:-mock_gateway}"
  local report_email="${REPORT_EMAIL_PROVIDER:-mock_email}"

  [[ "$billing" == "stripe" ]] && keys_csv+="${keys_csv:+,}STRIPE_SECRET_KEY"
  [[ "$course_payment" == "payos" ]] && keys_csv+="${keys_csv:+,}PAYOS_CLIENT_ID,PAYOS_API_KEY,PAYOS_CHECKSUM_KEY"
  [[ "$report_email" == "resend" ]] && keys_csv+="${keys_csv:+,}REPORT_EMAIL_RESEND_API_KEY,REPORT_EMAIL_FROM"

  local missing=()
  local placeholder=()
  local key value
  IFS=',' read -ra KEYS <<< "$keys_csv"
  for key in "${KEYS[@]}"; do
    key="${key// /}"
    [[ -n "$key" ]] || continue
    value="${!key-}"
    if [[ -z "$value" ]]; then
      missing+=("$key")
      continue
    fi
    if echo "$value" | grep -Eqi '(replace-with|change_me|example\.com|your-|todo)'; then
      placeholder+=("$key")
    fi
  done

  if [[ ${#missing[@]} -gt 0 ]]; then
    fail "Missing required secrets: ${missing[*]}"
  else
    pass "Required secrets present"
  fi

  if [[ ${#placeholder[@]} -gt 0 ]]; then
    fail "Placeholder values detected: ${placeholder[*]}"
  else
    pass "No placeholder secret values"
  fi
}

get_worker_restarts() {
  local pm2_json_file="$1"
  local worker_name="$2"
  node - "$pm2_json_file" "$worker_name" <<'NODE'
const fs = require("fs");
const [filePath, workerName] = process.argv.slice(2);
const list = JSON.parse(fs.readFileSync(filePath, "utf8"));
const proc = list.find((p) => p?.name === workerName);
if (!proc) process.exit(2);
const status = proc?.pm2_env?.status || "unknown";
const restarts = Number(proc?.pm2_env?.restart_time ?? 0);
console.log(`${status.replace(/\s+/g, "_")} ${restarts}`);
NODE
}

check_worker_restart_storm() {
  [[ "$CHECK_WORKER" == "true" ]] || { warn "Skip worker restart storm check"; return; }

  info "Worker restart storm checks"
  if ! command -v pm2 >/dev/null 2>&1; then
    fail "pm2 not found; cannot verify worker restart storm"
    return
  fi

  local snapshot_before snapshot_after line_before line_after status_before status_after restarts_before restarts_after delta
  snapshot_before=$(mktemp)
  snapshot_after=$(mktemp)

  if ! pm2 jlist > "$snapshot_before" 2>/dev/null; then
    rm -f "$snapshot_before" "$snapshot_after"
    fail "Cannot read pm2 process list"
    return
  fi

  if ! line_before=$(get_worker_restarts "$snapshot_before" "$WORKER_PROCESS_NAME"); then
    rm -f "$snapshot_before" "$snapshot_after"
    fail "Worker process not found in pm2: $WORKER_PROCESS_NAME"
    return
  fi

  status_before=$(echo "$line_before" | awk '{print $1}')
  restarts_before=$(echo "$line_before" | awk '{print $2}')

  sleep "$RESTART_WINDOW_SECONDS"

  if ! pm2 jlist > "$snapshot_after" 2>/dev/null; then
    rm -f "$snapshot_before" "$snapshot_after"
    fail "Cannot read pm2 process list after observation window"
    return
  fi

  if ! line_after=$(get_worker_restarts "$snapshot_after" "$WORKER_PROCESS_NAME"); then
    rm -f "$snapshot_before" "$snapshot_after"
    fail "Worker process missing after observation window: $WORKER_PROCESS_NAME"
    return
  fi

  status_after=$(echo "$line_after" | awk '{print $1}')
  restarts_after=$(echo "$line_after" | awk '{print $2}')
  delta=$((restarts_after - restarts_before))

  rm -f "$snapshot_before" "$snapshot_after"

  if [[ "$status_before" == "online" && "$status_after" == "online" ]]; then
    pass "Worker status online before/after observation window"
  else
    fail "Worker not online (before=$status_before, after=$status_after)"
  fi

  if (( delta > MAX_RESTART_DELTA )); then
    fail "Worker restart storm detected (delta=$delta in ${RESTART_WINDOW_SECONDS}s; threshold=$MAX_RESTART_DELTA)"
  else
    pass "Worker restart delta within threshold (delta=$delta)"
  fi
}

echo "============================================"
echo "Production Gate Check"
echo "Stage: $STAGE"
echo "Base URL: $BASE_URL"
echo "============================================"

check_ui_smoke
check_health_api
check_package_parity
check_secrets_readiness
check_worker_restart_storm

echo "--------------------------------------------"
echo "PASS=$PASS_COUNT WARN=$WARN_COUNT FAIL=$FAIL_COUNT"
echo "--------------------------------------------"

if (( FAIL_COUNT > 0 )); then
  exit 1
fi

exit 0

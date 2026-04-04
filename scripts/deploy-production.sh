#!/usr/bin/env bash
#
# One-Command Production Deploy Script
# Usage: bash scripts/deploy-production.sh <server-ip> [options]
#
# Options:
#   --skip-backup      Skip backup creation
#   --skip-tests       Skip local tests
#   --dry-run          Test SSH only, don't deploy
#   --rollback         Rollback to previous commit
#
# Example:
#   bash scripts/deploy-production.sh 192.168.1.100
#   bash scripts/deploy-production.sh 192.168.1.100 --dry-run
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_USER="deploy"
APP_DIR="/srv/cungcontuhoc"
REPO_URL="https://github.com/manhquydev/cungcontuhoc.git"
PM2_ECOSYSTEM="ecosystem.config.js"

# Flags
SKIP_BACKUP=false
SKIP_TESTS=false
DRY_RUN=false
ROLLBACK=false

# Parse arguments
SERVER_IP=""
while [[ $# -gt 0 ]]; do
  case $1 in
    --skip-backup)
      SKIP_BACKUP=true
      shift
      ;;
    --skip-tests)
      SKIP_TESTS=true
      shift
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --rollback)
      ROLLBACK=true
      shift
      ;;
    -*)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
    *)
      SERVER_IP="$1"
      shift
      ;;
  esac
done

# Validate server IP
if [[ -z "$SERVER_IP" ]]; then
  echo -e "${RED}Error: Server IP is required${NC}"
  echo "Usage: bash scripts/deploy-production.sh <server-ip> [options]"
  echo ""
  echo "Options:"
  echo "  --skip-backup      Skip backup creation"
  echo "  --skip-tests       Skip local tests"
  echo "  --dry-run          Test SSH only, don't deploy"
  echo "  --rollback         Rollback to previous commit"
  exit 1
fi

# Logging functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[OK]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
  echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Pre-deployment checks
log_step "Pre-Deployment Checks"

# Check SSH key - try multiple key locations
SSH_KEY=""
for key in ~/.ssh/cungcontuhoc_deploy ~/.ssh/id_ed25519 ~/.ssh/id_rsa; do
  if [[ -f "$key" ]]; then
    SSH_KEY="$key"
    log_success "SSH key found: $key"
    break
  fi
done

if [[ -z "$SSH_KEY" ]]; then
  log_error "No SSH key found"
  log_info "Generate key with: ssh-keygen -t ed25519 -f ~/.ssh/cungcontuhoc_deploy"
  exit 1
fi

# Check if server is reachable
log_info "Testing SSH connection to $SERVER_IP..."
if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -i "$SSH_KEY" "${DEPLOY_USER}@${SERVER_IP}" "echo 'SSH OK'" > /dev/null 2>&1; then
  log_warn "Cannot connect as deploy user, trying root..."
  if ! ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -i "$SSH_KEY" "root@${SERVER_IP}" "echo 'SSH OK'" > /dev/null 2>&1; then
    log_error "Cannot connect to server $SERVER_IP"
    log_info "Ensure SSH key is added to server"
    exit 1
  fi
  DEPLOY_USER="root"
  log_warn "Using root user for deployment"
fi
log_success "SSH connection successful"

# Dry run mode
if [[ "$DRY_RUN" == true ]]; then
  log_info "Dry run mode - SSH test complete"
  log_success "Server $SERVER_IP is reachable as $DEPLOY_USER"
  exit 0
fi

# Local tests (unless skipped)
if [[ "$SKIP_TESTS" == false ]]; then
  log_step "Running Local Tests"
  
  log_info "Running linter..."
  if ! pnpm lint; then
    log_error "Linting failed"
    exit 1
  fi
  log_success "Linting passed"
  
  log_info "Running type check..."
  if ! pnpm type-check; then
    log_error "Type check failed"
    exit 1
  fi
  log_success "Type check passed"
  
  log_info "Running unit tests..."
  if ! pnpm test; then
    log_error "Unit tests failed"
    exit 1
  fi
  log_success "Unit tests passed"
  
  log_info "Running security baseline..."
  if ! pnpm security:baseline; then
    log_warn "Security baseline has warnings (continuing)"
  else
    log_success "Security baseline passed"
  fi
else
  log_warn "Skipping local tests (--skip-tests)"
fi

# Build locally first
log_step "Building Production Bundle"
log_info "Installing dependencies..."
pnpm install --frozen-lockfile

log_info "Building..."
if ! pnpm build; then
  log_error "Build failed"
  exit 1
fi
log_success "Build successful"

# Backup (unless skipped)
if [[ "$SKIP_BACKUP" == false && "$ROLLBACK" == false ]]; then
  log_step "Creating Database Backup"
  log_info "Running backup:create..."
  if ! pnpm backup:create -- --offsite; then
    log_warn "Backup creation had issues (continuing)"
  else
    log_success "Backup created and uploaded"
  fi
else
  log_warn "Skipping backup creation"
fi

# Get current git info
GIT_COMMIT=$(git rev-parse --short HEAD)
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
log_info "Deploying commit: $GIT_COMMIT (branch: $GIT_BRANCH)"

# Deploy to server
log_step "Deploying to Server"

if [[ "$ROLLBACK" == true ]]; then
  log_info "Rolling back to previous commit..."
  DEPLOY_CMD="cd ${APP_DIR} && git checkout HEAD~1 && pnpm install --frozen-lockfile && pnpm db:generate && pnpm build && pm2 restart all"
else
  DEPLOY_CMD="cd ${APP_DIR} && git fetch origin && git checkout ${GIT_BRANCH} && git pull origin ${GIT_BRANCH} && pnpm install --frozen-lockfile && pnpm db:generate && DOTENV_CONFIG_PATH=.env.production pnpm prisma migrate deploy && pnpm build && pm2 restart all"
fi

log_info "Running remote deploy..."
if ! ssh -i "$SSH_KEY" "${DEPLOY_USER}@${SERVER_IP}" "$DEPLOY_CMD"; then
  log_error "Remote deploy failed"
  log_info "Check remote logs: ssh -i $SSH_KEY ${DEPLOY_USER}@${SERVER_IP} 'pm2 logs'"
  exit 1
fi
log_success "Remote deploy complete"

# Post-deployment verification
log_step "Post-Deployment Verification"

log_info "Waiting for services to start..."
sleep 5

log_info "Checking health endpoint..."
HEALTH_STATUS=$(ssh -i "$SSH_KEY" "${DEPLOY_USER}@${SERVER_IP}" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health" || echo "000")

if [[ "$HEALTH_STATUS" == "200" ]]; then
  log_success "Health check passed (HTTP 200)"
else
  log_error "Health check failed (HTTP $HEALTH_STATUS)"
  log_info "Checking PM2 status..."
  ssh -i "$SSH_KEY" "${DEPLOY_USER}@${SERVER_IP}" "pm2 status"
  log_info "Recent logs:"
  ssh -i "$SSH_KEY" "${DEPLOY_USER}@${SERVER_IP}" "pm2 logs --lines 50"
  exit 1
fi

log_info "Checking ready endpoint..."
READY_RESPONSE=$(ssh -i "$SSH_KEY" "${DEPLOY_USER}@${SERVER_IP}" "curl -s http://localhost:3000/api/health/ready" || echo "{}")
log_info "Ready response: $READY_RESPONSE"

log_info "Checking PM2 status..."
ssh -i "$SSH_KEY" "${DEPLOY_USER}@${SERVER_IP}" "pm2 status"

log_step "Deployment Summary"
echo ""
echo -e "${GREEN}✓ Deployment successful!${NC}"
echo ""
echo "Server:        $SERVER_IP"
echo "User:          $DEPLOY_USER"
echo "Commit:        $GIT_COMMIT"
echo "Branch:        $GIT_BRANCH"
echo "Timestamp:     $(date)"
echo ""
echo "Commands to monitor:"
echo "  ssh -i $SSH_KEY ${DEPLOY_USER}@${SERVER_IP} 'pm2 status'"
echo "  ssh -i $SSH_KEY ${DEPLOY_USER}@${SERVER_IP} 'pm2 logs'"
echo "  ssh -i $SSH_KEY ${DEPLOY_USER}@${SERVER_IP} 'curl http://localhost:3000/api/health'"
echo ""
echo "Rollback if needed:"
echo "  bash scripts/deploy-production.sh $SERVER_IP --rollback"
echo ""

log_success "Deploy complete!"

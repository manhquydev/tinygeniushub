#!/bin/bash
# =============================================================================
# Application Setup Script - Cùng Con Tự Học
# =============================================================================
# Purpose: Clone repository and install application dependencies
# Run as: deploy user
# Target: Ubuntu 22.04 LTS
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Error handler
error_handler() {
    log_error "Script failed at line $1"
    exit 1
}
trap 'error_handler $LINENO' ERR

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
APP_DIR="/srv/cungcontuhoc"
REPO_URL="https://github.com/manhquydev/cungcontuhoc.git"

echo "📁 Setting up application repository..."

# -----------------------------------------------------------------------------
# 1. Create Application Directory
# -----------------------------------------------------------------------------
log_info "Creating application directory..."
sudo mkdir -p $APP_DIR
CURRENT_USER=$(whoami)
sudo chown $CURRENT_USER:$CURRENT_USER $APP_DIR
log_success "Application directory created at $APP_DIR"

# -----------------------------------------------------------------------------
# 2. Clone Repository
# -----------------------------------------------------------------------------
log_info "Cloning repository from $REPO_URL..."

if [ -d "$APP_DIR/.git" ]; then
    log_warn "Repository already exists, pulling latest changes..."
    cd $APP_DIR
    git fetch origin
    git checkout main
    git pull origin main
else
    cd /srv
    git clone $REPO_URL cungcontuhoc
fi

log_success "Repository cloned/pulled"

# -----------------------------------------------------------------------------
# 3. Install Dependencies
# -----------------------------------------------------------------------------
log_info "Installing dependencies with pnpm..."
cd $APP_DIR
pnpm install --frozen-lockfile
log_success "Dependencies installed"

# -----------------------------------------------------------------------------
# 4. Generate Prisma Client
# -----------------------------------------------------------------------------
log_info "Generating Prisma client..."
cd $APP_DIR
pnpm db:generate
log_success "Prisma client generated"

# -----------------------------------------------------------------------------
# 5. Create Required Directories
# -----------------------------------------------------------------------------
log_info "Creating required directories..."
mkdir -p $APP_DIR/backups/postgres
mkdir -p $APP_DIR/logs
log_success "Required directories created"

# -----------------------------------------------------------------------------
# Completion
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
log_success "Application repository ready!"
echo "=========================================="
echo ""
echo "Application location: $APP_DIR"
echo ""
log_warn "Next steps:"
echo "  1. Configure .env.production with your secrets"
echo "  2. Run database migrations: pnpm prisma migrate deploy"
echo "  3. Run initial deployment: ./scripts/deploy-initial.sh"
echo ""

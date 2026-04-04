#!/bin/bash
# =============================================================================
# Initial Deployment Script - Cùng Con Tự Học
# =============================================================================
# Purpose: Full initial deployment of the application
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
ENV_FILE=".env.production"

echo "🚀 Starting initial deployment..."

# -----------------------------------------------------------------------------
# 1. Validate Environment
# -----------------------------------------------------------------------------
log_info "Validating environment..."

if [ ! -d "$APP_DIR" ]; then
    log_error "Application directory not found: $APP_DIR"
    exit 1
fi

if [ ! -f "$APP_DIR/$ENV_FILE" ]; then
    log_error "Environment file not found: $APP_DIR/$ENV_FILE"
    exit 1
fi

cd $APP_DIR
log_success "Environment validated"

# -----------------------------------------------------------------------------
# 2. Pull Latest Code
# -----------------------------------------------------------------------------
log_info "Pulling latest code from repository..."
git fetch origin
git checkout main
git pull origin main
log_success "Code updated"

# -----------------------------------------------------------------------------
# 3. Install Dependencies
# -----------------------------------------------------------------------------
log_info "Installing dependencies..."
pnpm install --frozen-lockfile
log_success "Dependencies installed"

# -----------------------------------------------------------------------------
# 4. Generate Prisma Client
# -----------------------------------------------------------------------------
log_info "Generating Prisma client..."
pnpm db:generate
log_success "Prisma client generated"

# -----------------------------------------------------------------------------
# 5. Run Database Migrations
# -----------------------------------------------------------------------------
log_info "Running database migrations..."
DOTENV_CONFIG_PATH=$ENV_FILE pnpm prisma migrate deploy
log_success "Database migrations completed"

# -----------------------------------------------------------------------------
# 6. Build Application
# -----------------------------------------------------------------------------
log_info "Building application..."
pnpm build
log_success "Application built successfully"

# -----------------------------------------------------------------------------
# 7. Start PM2 Services
# -----------------------------------------------------------------------------
log_info "Starting PM2 services..."

# Check if ecosystem.config.js exists
if [ ! -f "$APP_DIR/ecosystem.config.js" ]; then
    log_warn "ecosystem.config.js not found in $APP_DIR"
    log_warn "Creating from template..."
    # The ecosystem.config.js should be in the root of the project
fi

# Stop any existing processes
pm2 stop all || true
pm2 delete all || true

# Start services
pm2 start ecosystem.config.js --env production
pm2 save
log_success "PM2 services started"

# -----------------------------------------------------------------------------
# 8. Configure PM2 Startup
# -----------------------------------------------------------------------------
log_info "Configuring PM2 startup..."
pm2 startup systemd
log_success "PM2 startup configured"

# -----------------------------------------------------------------------------
# 9. Health Check
# -----------------------------------------------------------------------------
log_info "Performing health check..."
sleep 3

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
    log_success "Health check passed (HTTP 200)"
else
    log_warn "Health check returned status: $HEALTH_STATUS"
    log_warn "Application may still be starting up"
fi

# -----------------------------------------------------------------------------
# Completion
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
log_success "Initial deployment complete!"
echo "=========================================="
echo ""
echo "Check application status:"
echo "  pm2 status"
echo "  curl http://localhost:3000/api/health"
echo ""
echo "View logs:"
echo "  pm2 logs"
echo "  tail -f /var/log/pm2/*.log"
echo ""

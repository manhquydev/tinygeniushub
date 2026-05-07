#!/bin/bash
# =============================================================================
# Server Migration Script - TinyGenius Hub
# =============================================================================
# Purpose: One-command server migration with minimal downtime
# Run from: local machine or any server
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
OLD_SERVER="${1:-}"
NEW_SERVER="${2:-}"
DOMAIN="${3:-tinygeniushubvn.tech}"

if [ -z "$OLD_SERVER" ] || [ -z "$NEW_SERVER" ]; then
    echo "Usage: $0 <old-server-ip> <new-server-ip> [domain]"
    echo ""
    echo "Example:"
    echo "  $0 192.168.1.10 192.168.1.20 tinygeniushubvn.tech"
    exit 1
fi

echo "🚚 Migrating from $OLD_SERVER to $NEW_SERVER..."
echo "Domain: $DOMAIN"
echo ""

# -----------------------------------------------------------------------------
# 1. Create Backup on Old Server
# -----------------------------------------------------------------------------
log_info "Step 1: Creating backup on old server..."
ssh deploy@$OLD_SERVER "cd /srv/tinygeniushub && pnpm backup:create -- --offsite" || {
    log_error "Backup creation failed on old server"
    exit 1
}

# Get latest backup file path
LATEST_BACKUP=$(ssh deploy@$OLD_SERVER "ls -t /srv/backups/postgres/*.dump 2>/dev/null | head -1")
if [ -z "$LATEST_BACKUP" ]; then
    log_error "No backup file found on old server"
    exit 1
fi

log_success "Backup created: $LATEST_BACKUP"

# -----------------------------------------------------------------------------
# 2. Stop Services on New Server (if running)
# -----------------------------------------------------------------------------
log_info "Step 2: Stopping services on new server..."
ssh deploy@$NEW_SERVER "pm2 stop all || true" || log_warn "PM2 not running or error stopping"
log_success "Services stopped on new server"

# -----------------------------------------------------------------------------
# 3. Transfer Backup to New Server
# -----------------------------------------------------------------------------
log_info "Step 3: Transferring backup to new server..."
BACKUP_FILENAME=$(basename $LATEST_BACKUP)

rsync -avz --progress \
    "deploy@$OLD_SERVER:$LATEST_BACKUP" \
    "deploy@$NEW_SERVER:/srv/backups/postgres/$BACKUP_FILENAME" || {
    log_error "Backup transfer failed"
    exit 1
}

log_success "Backup transferred: /srv/backups/postgres/$BACKUP_FILENAME"

# -----------------------------------------------------------------------------
# 4. Restore Backup on New Server
# -----------------------------------------------------------------------------
log_info "Step 4: Restoring backup on new server..."
ssh deploy@$NEW_SERVER "cd /srv/tinygeniushub && pnpm backup:restore -- --file=/srv/backups/postgres/$BACKUP_FILENAME" || {
    log_error "Backup restore failed on new server"
    exit 1
}
log_success "Backup restored successfully"

# -----------------------------------------------------------------------------
# 5. Sync Application Files (Optional)
# -----------------------------------------------------------------------------
log_info "Step 5: Syncing application environment..."
read -p "Sync .env.production from old server? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    scp "deploy@$OLD_SERVER:/srv/tinygeniushub/.env.production" \
        "deploy@$NEW_SERVER:/srv/tinygeniushub/.env.production" || {
        log_warn "Environment file sync failed"
    }
    log_success "Environment file synced"
fi

# -----------------------------------------------------------------------------
# 6. Start Services on New Server
# -----------------------------------------------------------------------------
log_info "Step 6: Starting services on new server..."
ssh deploy@$NEW_SERVER "cd /srv/tinygeniushub && pm2 start ecosystem.config.js --env production && pm2 save" || {
    log_error "Failed to start services on new server"
    exit 1
}
log_success "Services started on new server"

# -----------------------------------------------------------------------------
# 7. Health Check on New Server
# -----------------------------------------------------------------------------
log_info "Step 7: Performing health check..."
sleep 5

HEALTH_STATUS=$(ssh deploy@$NEW_SERVER "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health" || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
    log_success "Health check passed (HTTP 200)"
else
    log_warn "Health check returned status: $HEALTH_STATUS"
    log_warn "Application may need more time to start"
fi

# -----------------------------------------------------------------------------
# 8. DNS Update Instructions
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
log_success "Migration complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Update DNS to point $DOMAIN to $NEW_SERVER"
echo "  2. Wait for DNS propagation (5-60 minutes)"
echo "  3. Verify: curl https://$DOMAIN/api/health"
echo "  4. Once verified, you can decommission $OLD_SERVER"
echo ""
echo "Quick commands:"
echo "  # Check old server status"
echo "  ssh deploy@$OLD_SERVER 'pm2 status'"
echo ""
echo "  # Check new server status"
echo "  ssh deploy@$NEW_SERVER 'pm2 status'"
echo ""
echo "  # Rollback (if needed)"
echo "  # Point DNS back to $OLD_SERVER"
echo ""

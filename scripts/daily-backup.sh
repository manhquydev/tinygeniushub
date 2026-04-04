#!/bin/bash
# =============================================================================
# Daily Backup Script - Cùng Con Tự Học
# =============================================================================
# Purpose: Automated daily database backup with offsite upload
# Usage: Place in /etc/cron.daily/ or run manually
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
log_info() { echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')][INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')][SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')][WARN]${NC} $1"; }
log_error() { echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')][ERROR]${NC} $1"; }

# Error handler - don't exit on error, just log
error_handler() {
    log_error "Script failed at line $1"
}
trap 'error_handler $LINENO' ERR

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
APP_DIR="/srv/cungcontuhoc"
BACKUP_DIR="/srv/backups/postgres"
RETENTION_DAYS=7
LOG_FILE="/var/log/cungcontuhoc/backup.log"

# Create log directory
mkdir -p $(dirname $LOG_FILE)

echo "[$(date)] ==========================================" >> $LOG_FILE
echo "[$(date)] Starting daily backup..." >> $LOG_FILE

# -----------------------------------------------------------------------------
# 1. Validate Environment
# -----------------------------------------------------------------------------
log_info "Validating environment..." | tee -a $LOG_FILE

if [ ! -d "$APP_DIR" ]; then
    log_error "Application directory not found: $APP_DIR" | tee -a $LOG_FILE
    exit 1
fi

if [ ! -f "$APP_DIR/.env.production" ]; then
    log_error "Environment file not found" | tee -a $LOG_FILE
    exit 1
fi

cd $APP_DIR
log_success "Environment validated" | tee -a $LOG_FILE

# -----------------------------------------------------------------------------
# 2. Load Environment
# -----------------------------------------------------------------------------
log_info "Loading environment variables..." | tee -a $LOG_FILE
export $(grep -v '^#' .env.production | xargs) || true

# -----------------------------------------------------------------------------
# 3. Create Backup Directory
# -----------------------------------------------------------------------------
mkdir -p $BACKUP_DIR
cd $APP_DIR

# -----------------------------------------------------------------------------
# 4. Create Backup
# -----------------------------------------------------------------------------
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="cungcontuhoc_${TIMESTAMP}.dump"

log_info "Creating backup: $BACKUP_FILE" | tee -a $LOG_FILE

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:pass@host:port/dbname
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

# Create backup using pg_dump (connect via PgBouncer on port 6432)
pg_dump -h 127.0.0.1 -p 6432 -U $DB_USER \
    -Fc -f "$BACKUP_DIR/$BACKUP_FILE" $DB_NAME 2>>$LOG_FILE || {
    log_error "Backup creation failed" | tee -a $LOG_FILE
    exit 1
}

BACKUP_SIZE=$(stat -c%s "$BACKUP_DIR/$BACKUP_FILE")
log_success "Backup created: $BACKUP_FILE ($BACKUP_SIZE bytes)" | tee -a $LOG_FILE

# -----------------------------------------------------------------------------
# 5. Calculate Checksum
# -----------------------------------------------------------------------------
cd $BACKUP_DIR
sha256sum "$BACKUP_FILE" > "$BACKUP_FILE.sha256"
log_success "Checksum calculated" | tee -a $LOG_FILE

# -----------------------------------------------------------------------------
# 6. Create Manifest
# -----------------------------------------------------------------------------
cat > "$BACKUP_FILE.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "file": "$BACKUP_FILE",
  "size": $BACKUP_SIZE,
  "checksum": "$(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)"
}
EOF
log_success "Manifest created" | tee -a $LOG_FILE

# -----------------------------------------------------------------------------
# 7. Upload to Offsite Storage (if configured)
# -----------------------------------------------------------------------------
if [ "${BACKUP_OFFSITE_ENABLED:-false}" = "true" ]; then
    log_info "Uploading to offsite storage (R2)..." | tee -a $LOG_FILE
    cd $APP_DIR
    pnpm backup:offsite:upload -- --file=$BACKUP_DIR/$BACKUP_FILE 2>>$LOG_FILE || {
        log_warn "Offsite upload failed (continuing anyway)" | tee -a $LOG_FILE
    }
else
    log_info "Offsite backup disabled (BACKUP_OFFSITE_ENABLED not set to true)" | tee -a $LOG_FILE
fi

# -----------------------------------------------------------------------------
# 8. Clean Old Backups
# -----------------------------------------------------------------------------
log_info "Cleaning backups older than $RETENTION_DAYS days..." | tee -a $LOG_FILE
find $BACKUP_DIR -name "cungcontuhoc_*.dump" -mtime +$RETENTION_DAYS -delete || true
find $BACKUP_DIR -name "cungcontuhoc_*.dump.sha256" -mtime +$RETENTION_DAYS -delete || true
find $BACKUP_DIR -name "cungcontuhoc_*.dump.json" -mtime +$RETENTION_DAYS -delete || true
DELETED_COUNT=$(find $BACKUP_DIR -name "cungcontuhoc_*.dump" -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
log_success "Old backups cleaned ($DELETED_COUNT remaining files removed)" | tee -a $LOG_FILE

# -----------------------------------------------------------------------------
# Completion
# -----------------------------------------------------------------------------
echo "[$(date)] Backup complete!" >> $LOG_FILE
echo "[$(date)] ==========================================" >> $LOG_FILE

echo ""
log_success "Daily backup completed successfully!"
echo ""
echo "Backup location: $BACKUP_DIR/$BACKUP_FILE"
echo "Log file: $LOG_FILE"
echo ""

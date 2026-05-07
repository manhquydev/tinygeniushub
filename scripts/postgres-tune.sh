#!/bin/bash
# =============================================================================
# PostgreSQL Performance Tuning Script - TinyGenius Hub
# =============================================================================
# Purpose: Auto-tune PostgreSQL based on available RAM
# Run as: root or with sudo
# Target: Ubuntu 22.04 LTS with PostgreSQL 15
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

echo "⚙️  Tuning PostgreSQL for optimal performance..."

# -----------------------------------------------------------------------------
# 1. Calculate Memory Settings
# -----------------------------------------------------------------------------
log_info "Analyzing system memory..."

# Get total RAM in MB
TOTAL_RAM_MB=$(free -m | awk '/^Mem:/ {print $2}')

# Calculate settings based on RAM
SHARED_BUFFERS=$((TOTAL_RAM_MB / 4))          # 25% of RAM
EFFECTIVE_CACHE=$((TOTAL_RAM_MB * 3 / 4))       # 75% of RAM
MAINTENANCE_WORK_MEM=$((TOTAL_RAM_MB / 16))     # 6.25% of RAM
WORK_MEM=$((TOTAL_RAM_MB / 100))              # 1% of RAM

echo ""
echo "Calculated settings for ${TOTAL_RAM_MB}MB RAM:"
echo "  shared_buffers: ${SHARED_BUFFERS}MB"
echo "  effective_cache_size: ${EFFECTIVE_CACHE}MB"
echo "  maintenance_work_mem: ${MAINTENANCE_WORK_MEM}MB"
echo "  work_mem: ${WORK_MEM}MB"
echo ""

# -----------------------------------------------------------------------------
# 2. Create PostgreSQL Configuration
# -----------------------------------------------------------------------------
log_info "Creating PostgreSQL configuration..."

PG_CONFIG_DIR="/etc/postgresql/15/main/conf.d"
mkdir -p $PG_CONFIG_DIR

cat > $PG_CONFIG_DIR/99-custom.conf << EOF
# =============================================================================
# PostgreSQL Performance Tuning - Auto-generated
# Generated: $(date)
# System RAM: ${TOTAL_RAM_MB}MB
# =============================================================================

# Memory Settings
shared_buffers = ${SHARED_BUFFERS}MB
effective_cache_size = ${EFFECTIVE_CACHE}MB
maintenance_work_mem = ${MAINTENANCE_WORK_MEM}MB
work_mem = ${WORK_MEM}MB

# Checkpoint & WAL Settings
wal_buffers = 16MB
checkpoint_completion_target = 0.9
checkpoint_timeout = 10min
max_wal_size = 2GB
min_wal_size = 512MB

# Connection Settings
max_connections = 100

# Query Planner Settings
effective_io_concurrency = 200
random_page_cost = 1.1

# Logging Configuration
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Autovacuum Settings
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min
autovacuum_vacuum_threshold = 50
autovacuum_vacuum_scale_factor = 0.2
autovacuum_analyze_threshold = 50
autovacuum_analyze_scale_factor = 0.1
EOF

log_success "PostgreSQL configuration created at $PG_CONFIG_DIR/99-custom.conf"

# -----------------------------------------------------------------------------
# 3. Create Log Directory
# -----------------------------------------------------------------------------
log_info "Creating PostgreSQL log directory..."
mkdir -p /var/log/postgresql
chown postgres:postgres /var/log/postgresql
chmod 755 /var/log/postgresql
log_success "Log directory created"

# -----------------------------------------------------------------------------
# 4. Restart PostgreSQL
# -----------------------------------------------------------------------------
log_info "Restarting PostgreSQL to apply changes..."
systemctl restart postgresql

# Verify service is running
sleep 2
if systemctl is-active --quiet postgresql; then
    log_success "PostgreSQL restarted successfully"
else
    log_error "PostgreSQL failed to restart"
    exit 1
fi

# -----------------------------------------------------------------------------
# 5. Verify Configuration
# -----------------------------------------------------------------------------
log_info "Verifying configuration..."
su - postgres -c "psql -c \"SHOW shared_buffers;\"" | grep -E "shared_buffers|^[0-9]" || true
su - postgres -c "psql -c \"SHOW effective_cache_size;\"" | grep -E "effective_cache_size|^[0-9]" || true
su - postgres -c "psql -c \"SHOW max_connections;\"" | grep -E "max_connections|^[0-9]" || true

# -----------------------------------------------------------------------------
# Completion
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
log_success "PostgreSQL tuned for production!"
echo "=========================================="
echo ""
echo "Applied settings:"
echo "  shared_buffers: ${SHARED_BUFFERS}MB"
echo "  effective_cache_size: ${EFFECTIVE_CACHE}MB"
echo "  maintenance_work_mem: ${MAINTENANCE_WORK_MEM}MB"
echo "  work_mem: ${WORK_MEM}MB"
echo "  max_connections: 100"
echo ""
echo "Log location: /var/log/postgresql/"
echo ""
log_warn "Monitor performance after these changes."
echo "You can adjust settings in: $PG_CONFIG_DIR/99-custom.conf"
echo ""

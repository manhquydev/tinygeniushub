#!/bin/bash
# =============================================================================
# PgBouncer Setup Script - Cùng Con Tự Học
# =============================================================================
# Purpose: Configure PgBouncer for PostgreSQL connection pooling
# Run as: root or with sudo
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
DB_NAME="${1:-cungcontuhoc}"
DB_USER="${2:-cungcontuhoc_app}"
DB_PASS="${3:-}"

if [ -z "$DB_PASS" ]; then
    log_error "Database password is required"
    log_info "Usage: $0 <database_name> <username> <password>"
    exit 1
fi

echo "🏊 Setting up PgBouncer connection pooler..."

# -----------------------------------------------------------------------------
# 1. Install PgBouncer
# -----------------------------------------------------------------------------
log_info "Installing PgBouncer..."
apt-get install -y pgbouncer
log_success "PgBouncer installed"

# -----------------------------------------------------------------------------
# 2. Backup Original Config
# -----------------------------------------------------------------------------
log_info "Backing up original configuration..."
cp /etc/pgbouncer/pgbouncer.ini /etc/pgbouncer/pgbouncer.ini.bak.$(date +%Y%m%d_%H%M%S)
log_success "Original config backed up"

# -----------------------------------------------------------------------------
# 3. Configure PgBouncer
# -----------------------------------------------------------------------------
log_info "Configuring PgBouncer..."
cat > /etc/pgbouncer/pgbouncer.ini << EOF
[databases]
$DB_NAME = host=127.0.0.1 port=5432 dbname=$DB_NAME

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
admin_users = postgres
stats_users = postgres

# Pool settings
pool_mode = transaction
max_client_conn = 200
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3

# Timeouts
server_idle_timeout = 600
server_lifetime = 3600
client_idle_timeout = 600
client_login_timeout = 60

# Logging
log_connections = 0
log_disconnections = 0
log_pooler_errors = 1
stats_period = 60

# Security
server_tls_sslmode = prefer
EOF

log_success "PgBouncer configuration created"

# -----------------------------------------------------------------------------
# 4. Create Userlist
# -----------------------------------------------------------------------------
log_info "Creating user authentication file..."

# Generate MD5 password hash (format: md5 + md5(password+username))
MD5_HASH=$(echo -n "md5" && echo -n "$DB_PASS$DB_USER" | md5sum | awk '{print $1}')

cat > /etc/pgbouncer/userlist.txt << EOF
"$DB_USER" "$MD5_HASH"
EOF

chown pgbouncer:pgbouncer /etc/pgbouncer/userlist.txt
chmod 640 /etc/pgbouncer/userlist.txt
log_success "User authentication file created"

# -----------------------------------------------------------------------------
# 5. Start and Enable Service
# -----------------------------------------------------------------------------
log_info "Starting PgBouncer service..."
systemctl restart pgbouncer
systemctl enable pgbouncer
log_success "PgBouncer service started and enabled"

# -----------------------------------------------------------------------------
# 6. Verify Installation
# -----------------------------------------------------------------------------
log_info "Verifying PgBouncer installation..."
sleep 2
systemctl status pgbouncer --no-pager || true

# Check if port is listening
if ss -tlnp | grep -q ':6432'; then
    log_success "PgBouncer is listening on port 6432"
else
    log_warn "PgBouncer may not be listening on port 6432 yet"
fi

# -----------------------------------------------------------------------------
# Completion
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
log_success "PgBouncer configured!"
echo "=========================================="
echo ""
echo "Connection pooler is running on port 6432"
echo ""
echo "Connection string:"
echo "  postgresql://$DB_USER:******@127.0.0.1:6432/$DB_NAME"
echo ""
echo "Use this connection string in your application instead of direct PostgreSQL connection"
echo ""

#!/bin/bash
# =============================================================================
# Redis Setup Script - Cùng Con Tự Học
# =============================================================================
# Purpose: Install and configure Redis with AOF persistence
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
# Calculate Redis maxmemory based on total RAM (default 512MB for 4GB VPS)
TOTAL_RAM_MB=$(free -m | awk '/^Mem:/ {print $2}')
if [ "$TOTAL_RAM_MB" -gt 8000 ]; then
    MAXMEMORY="1024mb"
elif [ "$TOTAL_RAM_MB" -gt 4000 ]; then
    MAXMEMORY="512mb"
else
    MAXMEMORY="256mb"
fi

echo "🔴 Setting up Redis (maxmemory: $MAXMEMORY)..."

# -----------------------------------------------------------------------------
# 1. Install Redis
# -----------------------------------------------------------------------------
log_info "Installing Redis..."
apt-get install -y redis-server
log_success "Redis installed"

# -----------------------------------------------------------------------------
# 2. Backup Original Config
# -----------------------------------------------------------------------------
log_info "Backing up original configuration..."
cp /etc/redis/redis.conf /etc/redis/redis.conf.bak.$(date +%Y%m%d_%H%M%S)
log_success "Original config backed up"

# -----------------------------------------------------------------------------
# 3. Configure Redis
# -----------------------------------------------------------------------------
log_info "Configuring Redis..."
cat > /etc/redis/redis.conf << EOF
# Network
bind 127.0.0.1
port 6379
protected-mode yes

# Memory
maxmemory $MAXMEMORY
maxmemory-policy allkeys-lru

# Persistence (AOF for durability)
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# RDB snapshots
save 900 1
save 300 10
save 60 10000

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log

# Security - disable dangerous commands
rename-command FLUSHDB ""
rename-command FLUSHALL ""

# Performance
tcp-keepalive 300
timeout 0
tcp-backlog 511
EOF

log_success "Redis configuration created"

# -----------------------------------------------------------------------------
# 4. Create Log Directory
# -----------------------------------------------------------------------------
log_info "Creating log directory..."
mkdir -p /var/log/redis
chown redis:redis /var/log/redis
log_success "Log directory created"

# -----------------------------------------------------------------------------
# 5. Start and Enable Service
# -----------------------------------------------------------------------------
log_info "Starting Redis service..."
systemctl restart redis-server
systemctl enable redis-server
log_success "Redis service started and enabled"

# -----------------------------------------------------------------------------
# 6. Verify Installation
# -----------------------------------------------------------------------------
log_info "Verifying Redis installation..."
sleep 1

# Test connection
if redis-cli ping | grep -q "PONG"; then
    log_success "Redis is responding to PING"
else
    log_warn "Redis may not be fully started yet"
fi

# Check service status
systemctl status redis-server --no-pager || true

# -----------------------------------------------------------------------------
# Completion
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
log_success "Redis configured with AOF persistence!"
echo "=========================================="
echo ""
echo "Configuration:"
echo "  Max Memory: $MAXMEMORY"
echo "  Persistence: AOF (everysec) + RDB snapshots"
echo "  Security: FLUSHDB/FLUSHALL commands disabled"
echo ""
echo "Connection: redis://127.0.0.1:6379"
echo ""

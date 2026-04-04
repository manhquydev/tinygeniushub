#!/bin/bash
# =============================================================================
# VPS Setup Script - Cùng Con Tự Học
# =============================================================================
# Purpose: Initial VPS hardening and security setup
# Run as: root
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

echo "🚀 Starting VPS setup for Cùng Con Tự Học..."

# -----------------------------------------------------------------------------
# 1. System Update
# -----------------------------------------------------------------------------
log_info "Updating system packages..."
apt-get update && apt-get upgrade -y
log_success "System packages updated"

# -----------------------------------------------------------------------------
# 2. Install Essential Packages
# -----------------------------------------------------------------------------
log_info "Installing essential packages..."
apt-get install -y \
    curl wget git vim htop ncdu ufw fail2ban \
    software-properties-common apt-transport-https \
    ca-certificates gnupg lsb-release \
    postgresql-client redis-tools \
    certbot python3-certbot-nginx
log_success "Essential packages installed"

# -----------------------------------------------------------------------------
# 3. Configure Timezone (Vietnam)
# -----------------------------------------------------------------------------
log_info "Setting timezone to Asia/Ho_Chi_Minh..."
timedatectl set-timezone Asia/Ho_Chi_Minh
log_success "Timezone configured"

# -----------------------------------------------------------------------------
# 4. Create Deploy User
# -----------------------------------------------------------------------------
log_info "Creating deploy user..."
if id "deploy" &>/dev/null; then
    log_warn "User 'deploy' already exists"
else
    useradd -m -s /bin/bash deploy
    log_success "Deploy user created"
fi

usermod -aG sudo deploy
log_success "Deploy user added to sudo group"

# Setup SSH directory for deploy user
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

log_warn "IMPORTANT: Add your SSH public key to /home/deploy/.ssh/authorized_keys"
log_warn "Run: ssh-copy-id deploy@your-vps-ip"

# -----------------------------------------------------------------------------
# 5. Configure UFW Firewall
# -----------------------------------------------------------------------------
log_info "Configuring UFW firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw allow 3000/tcp comment 'Internal app port'

# Enable firewall with force flag (non-interactive)
ufw --force enable
log_success "UFW firewall configured and enabled"

# -----------------------------------------------------------------------------
# 6. Configure fail2ban
# -----------------------------------------------------------------------------
log_info "Configuring fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
EOF

systemctl restart fail2ban
systemctl enable fail2ban
log_success "fail2ban configured"

# -----------------------------------------------------------------------------
# 7. Additional Security Hardening
# -----------------------------------------------------------------------------
log_info "Applying additional security hardening..."

# Disable root login via SSH (backup first)
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
systemctl restart sshd
log_success "SSH root login disabled"

# -----------------------------------------------------------------------------
# Completion
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
log_success "VPS hardening complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Add your SSH key: ssh-copy-id deploy@your-vps-ip"
echo "  2. Switch to deploy user: su - deploy"
echo "  3. Run: ./scripts/nodejs-install.sh"
echo ""

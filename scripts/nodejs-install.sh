#!/bin/bash
# =============================================================================
# Node.js Installation Script - TinyGenius Hub
# =============================================================================
# Purpose: Install Node.js 22 LTS, pnpm, and PM2
# Run as: deploy user (with sudo access)
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

echo "📦 Installing Node.js 22 LTS and related tools..."

# -----------------------------------------------------------------------------
# 1. Install Node.js 22 LTS
# -----------------------------------------------------------------------------
log_info "Adding NodeSource repository for Node.js 22..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

log_info "Installing Node.js..."
sudo apt-get install -y nodejs

# Verify installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log_success "Node.js $NODE_VERSION installed"
log_success "npm $NPM_VERSION installed"

# -----------------------------------------------------------------------------
# 2. Install pnpm
# -----------------------------------------------------------------------------
log_info "Installing pnpm 10.24.0..."
sudo npm install -g pnpm@10.24.0
PNPM_VERSION=$(pnpm --version)
log_success "pnpm $PNPM_VERSION installed"

# -----------------------------------------------------------------------------
# 3. Install PM2 Process Manager
# -----------------------------------------------------------------------------
log_info "Installing PM2..."
sudo npm install -g pm2
PM2_VERSION=$(pm2 --version)
log_success "PM2 $PM2_VERSION installed"

# -----------------------------------------------------------------------------
# 4. Configure PM2 Startup
# -----------------------------------------------------------------------------
log_info "Configuring PM2 startup..."
pm2 startup systemd

# Get current user for startup configuration
CURRENT_USER=$(whoami)
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $CURRENT_USER --hp /home/$CURRENT_USER
log_success "PM2 startup configured for user: $CURRENT_USER"

# -----------------------------------------------------------------------------
# 5. Create log directory for PM2
# -----------------------------------------------------------------------------
log_info "Creating PM2 log directory..."
sudo mkdir -p /var/log/pm2
sudo chown $CURRENT_USER:$CURRENT_USER /var/log/pm2
log_success "PM2 log directory created at /var/log/pm2"

# -----------------------------------------------------------------------------
# Completion
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
log_success "Node.js, pnpm, and PM2 installation complete!"
echo "=========================================="
echo ""
echo "Versions:"
echo "  Node.js: $(node --version)"
echo "  npm: $(npm --version)"
echo "  pnpm: $(pnpm --version)"
echo "  PM2: $(pm2 --version)"
echo ""

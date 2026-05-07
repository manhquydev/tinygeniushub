#!/bin/bash
# =============================================================================
# PostgreSQL Setup Script - TinyGenius Hub
# =============================================================================
# Purpose: Install PostgreSQL 15 and create database/user
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
DB_NAME="${1:-tinygeniushub}"
DB_USER="${2:-tinygeniushub_app}"
DB_PASS="${3:-$(openssl rand -base64 24)}"

echo "🐘 Setting up PostgreSQL 15..."

# -----------------------------------------------------------------------------
# 1. Add PostgreSQL Repository
# -----------------------------------------------------------------------------
log_info "Adding PostgreSQL APT repository..."
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt-get update
log_success "PostgreSQL repository added"

# -----------------------------------------------------------------------------
# 2. Install PostgreSQL 15
# -----------------------------------------------------------------------------
log_info "Installing PostgreSQL 15..."
apt-get install -y postgresql-15 postgresql-contrib-15
log_success "PostgreSQL 15 installed"

# -----------------------------------------------------------------------------
# 3. Start and Enable Service
# -----------------------------------------------------------------------------
log_info "Starting PostgreSQL service..."
systemctl start postgresql
systemctl enable postgresql
log_success "PostgreSQL service started and enabled"

# -----------------------------------------------------------------------------
# 4. Create Database and User
# -----------------------------------------------------------------------------
log_info "Creating database '$DB_NAME' and user '$DB_USER'..."
su - postgres -c "psql" << EOF
-- Create database
CREATE DATABASE $DB_NAME;

-- Create application user
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect and grant schema privileges
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Verify
\l
\du
EOF

log_success "Database and user created"

# -----------------------------------------------------------------------------
# 5. Configure PostgreSQL Access
# -----------------------------------------------------------------------------
log_info "Configuring PostgreSQL access..."

# Update pg_hba.conf for local connections
cat >> /etc/postgresql/15/main/pg_hba.conf << EOF

# Local application connection
local   $DB_NAME   $DB_USER   md5
host    $DB_NAME   $DB_USER   127.0.0.1/32   md5
host    $DB_NAME   $DB_USER   ::1/128        md5
EOF

# Reload configuration
systemctl reload postgresql
log_success "PostgreSQL access configured"

# -----------------------------------------------------------------------------
# Completion
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
log_success "PostgreSQL 15 setup complete!"
echo "=========================================="
echo ""
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Password: $DB_PASS"
echo ""
log_warn "SAVE THIS PASSWORD SECURELY!"
echo ""
echo "Connection string:"
echo "  postgresql://$DB_USER:$DB_PASS@127.0.0.1:5432/$DB_NAME"
echo ""

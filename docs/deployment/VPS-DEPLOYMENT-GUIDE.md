# VPS Production Deployment Guide

Complete guide for deploying the **TinyGenius Hub** (Abeka Curriculum System) on Ubuntu 22.04 LTS VPS.

**Target Stack:**
- **OS:** Ubuntu 22.04 LTS
- **Database:** PostgreSQL 15 + PgBouncer (connection pooling)
- **Cache:** Redis 7 (with AOF persistence)
- **Node.js:** v22 LTS
- **Process Manager:** PM2
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt (Certbot)
- **Backup:** Daily cron + offsite R2 storage

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [VPS Initial Setup](#2-vps-initial-setup)
3. [Database Setup](#3-database-setup)
4. [Application Deployment](#4-application-deployment)
5. [Abeka Import Procedure](#5-abeka-import-procedure)
6. [Backup & Restore](#6-backup--restore)
7. [Monitoring & Alerting](#7-monitoring--alerting)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

### 1.1 VPS Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB SSD | 80 GB SSD |
| Bandwidth | 2 TB/month | 5 TB/month |

### 1.2 Domain & DNS

- Domain A record pointing to VPS IP
- Optional: `www` subdomain
- Example: `tinygeniushubvn.tech` -> `your.vps.ip.address`

### 1.3 Required Access

- SSH key pair (ED25519 recommended)
- Sudo privileges
- GitHub repository access
- Cloudflare R2 account (optional, for backups)

---

## 2. VPS Initial Setup

### 2.1 Complete VPS Hardening Script

**`scripts/vps-setup.sh`** - Run as root on fresh VPS:

```bash
#!/bin/bash
set -euo pipefail

echo "🚀 Starting VPS setup for TinyGenius Hub..."

# Update system
echo "📦 Updating packages..."
apt update && apt upgrade -y

# Install essential packages
echo "🔧 Installing essential packages..."
apt install -y \
  curl wget git vim htop ncdu ufw fail2ban \
  software-properties-common apt-transport-https \
  ca-certificates gnupg lsb-release \
  postgresql-client redis-tools \
  certbot python3-certbot-nginx

# Configure timezone (Vietnam)
echo "🌍 Setting timezone to Asia/Ho_Chi_Minh..."
timedatectl set-timezone Asia/Ho_Chi_Minh

# Create deploy user
echo "👤 Creating deploy user..."
useradd -m -s /bin/bash deploy || true
usermod -aG sudo deploy

# Setup SSH for deploy user
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
touch /home/deploy/.ssh/authorized_keys
chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

echo "⚠️  IMPORTANT: Add your SSH public key to /home/deploy/.ssh/authorized_keys"

# Configure UFW firewall
echo "🔥 Configuring firewall..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw allow 3000/tcp  # Internal app port
ufw --force enable

# Configure fail2ban
echo "🛡️  Configuring fail2ban..."
tee /etc/fail2ban/jail.local << 'EOF'
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

echo "✅ VPS hardening complete!"
echo ""
echo "Next steps:"
echo "  1. Add your SSH key: ssh-copy-id deploy@your-vps-ip"
echo "  2. Switch to deploy user: su - deploy"
echo "  3. Run: ./scripts/nodejs-install.sh"
```

**Execute:**
```bash
# Local machine
scp scripts/vps-setup.sh root@your.vps.ip.address:/tmp/
ssh root@your.vps.ip.address "bash /tmp/vps-setup.sh"
ssh-copy-id deploy@your.vps.ip.address
```

### 2.2 Node.js 22 + PM2 Installation

**`scripts/nodejs-install.sh`** - Run as deploy user:

```bash
#!/bin/bash
set -euo pipefail

echo "📦 Installing Node.js 22 LTS..."

# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify
node --version  # Should show v22.x.x
npm --version

# Install pnpm globally
echo "📦 Installing pnpm 10.24.0..."
sudo npm install -g pnpm@10.24.0
pnpm --version

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Setup PM2 startup
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy

echo "✅ Node.js, pnpm, and PM2 installed!"
```

### 2.3 Nginx + SSL Setup

**`scripts/nginx-ssl-setup.sh`**:

```bash
#!/bin/bash
set -euo pipefail

DOMAIN="${1:-tinygeniushubvn.tech}"
EMAIL="${2:-admin@tinygeniushubvn.tech}"

echo "🔧 Installing Nginx..."
sudo apt install -y nginx

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Create Nginx configuration
echo "⚙️  Configuring Nginx..."
sudo tee /etc/nginx/sites-available/tinygeniushub << 'EOF'
upstream app_server {
    server 127.0.0.1:3000;
    keepalive 32;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

server {
    listen 80;
    server_name _;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name _;

    # SSL certificates (configured by certbot)
    ssl_certificate /etc/letsencrypt/live/DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Prevent sporadic 502s when upstream response headers are large.
    proxy_buffer_size 16k;
    proxy_buffers 8 16k;
    proxy_busy_buffers_size 32k;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Static files caching
    location /_next/static {
        alias /var/www/tinygeniushub/.next/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Health checks (no rate limiting)
    location /api/health {
        proxy_pass http://app_server;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        access_log off;
    }

    # Auth endpoints (stricter rate limiting)
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://app_server;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API endpoints
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://app_server;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # All other traffic
    location / {
        proxy_pass http://app_server;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Replace DOMAIN placeholder
sudo sed -i "s/DOMAIN/$DOMAIN/g" /etc/nginx/sites-available/tinygeniushub

# Enable site
sudo ln -sf /etc/nginx/sites-available/tinygeniushub /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Obtain SSL certificate
echo "🔒 Obtaining SSL certificate..."
sudo mkdir -p /var/www/certbot
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL

# Setup auto-renewal
echo "🔄 Setting up auto-renewal..."
sudo tee /etc/cron.daily/certbot-renew << 'EOF'
#!/bin/bash
certbot renew --quiet --nginx
systemctl reload nginx
EOF
sudo chmod +x /etc/cron.daily/certbot-renew

# Verify
sudo certbot renew --dry-run

echo "✅ Nginx and SSL configured!"
echo "Certificate: /etc/letsencrypt/live/$DOMAIN/"
```

---

## 3. Database Setup

### 3.1 PostgreSQL 15 Installation

**`scripts/postgres-setup.sh`** - Run with sudo:

```bash
#!/bin/bash
set -euo pipefail

DB_NAME="${1:-tinygeniushub}"
DB_USER="${2:-tinygeniushub_app}"
DB_PASS="${3:-$(openssl rand -base64 24)}"

echo "🐘 Installing PostgreSQL 15..."

# Add PostgreSQL repository
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt update

# Install PostgreSQL 15
apt install -y postgresql-15 postgresql-contrib-15

# Start and enable service
systemctl start postgresql
systemctl enable postgresql

# Create database and user
echo "🗄️  Creating database and user..."
su - postgres -c "psql << EOF
-- Create database
CREATE DATABASE $DB_NAME;

-- Create application user
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASS';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect and grant schema privileges
\\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";

-- Verify
\\l
\\du
EOF"

echo ""
echo "✅ PostgreSQL 15 setup complete!"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo "Password: $DB_PASS"
echo ""
echo "⚠️  SAVE THIS PASSWORD SECURELY!"
```

### 3.2 PgBouncer Connection Pooling

**`scripts/pgbouncer-setup.sh`**:

```bash
#!/bin/bash
set -euo pipefail

DB_NAME="${1:-tinygeniushub}"
DB_USER="${2:-tinygeniushub_app}"
DB_PASS="${3:-your_password_here}"

echo "🏊 Installing PgBouncer..."
apt install -y pgbouncer

# Backup original config
cp /etc/pgbouncer/pgbouncer.ini /etc/pgbouncer/pgbouncer.ini.bak

# Configure PgBouncer
tee /etc/pgbouncer/pgbouncer.ini << EOF
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

# Generate MD5 password hash
MD5_HASH=$(echo -n "md5" && echo -n "$DB_PASS$DB_USER" | md5sum | awk '{print $1}')

# Create userlist.txt
tee /etc/pgbouncer/userlist.txt << EOF
"$DB_USER" "$MD5_HASH"
EOF

chown pgbouncer:pgbouncer /etc/pgbouncer/userlist.txt
chmod 640 /etc/pgbouncer/userlist.txt

# Start and enable
systemctl restart pgbouncer
systemctl enable pgbouncer

# Verify
systemctl status pgbouncer --no-pager
ss -tlnp | grep 6432

echo "✅ PgBouncer configured on port 6432!"
echo "Connection string: postgresql://$DB_USER:$DB_PASS@127.0.0.1:6432/$DB_NAME"
```

### 3.3 PostgreSQL Performance Tuning

**`scripts/postgres-tune.sh`**:

```bash
#!/bin/bash
set -euo pipefail

# Get total RAM in MB
TOTAL_RAM_MB=$(free -m | awk '/^Mem:/ {print $2}')

# Calculate settings based on RAM
SHARED_BUFFERS=$((TOTAL_RAM_MB / 4))          # 25% of RAM
EFFECTIVE_CACHE=$((TOTAL_RAM_MB * 3 / 4))       # 75% of RAM
MAINTENANCE_WORK_MEM=$((TOTAL_RAM_MB / 16))     # 6.25% of RAM
WORK_MEM=$((TOTAL_RAM_MB / 100))              # 1% of RAM

echo "⚙️  Tuning PostgreSQL for ${TOTAL_RAM_MB}MB RAM..."
echo "  shared_buffers: ${SHARED_BUFFERS}MB"
echo "  effective_cache_size: ${EFFECTIVE_CACHE}MB"
echo "  maintenance_work_mem: ${MAINTENANCE_WORK_MEM}MB"
echo "  work_mem: ${WORK_MEM}MB"

tee /etc/postgresql/15/main/conf.d/99-custom.conf << EOF
# Memory Settings
shared_buffers = ${SHARED_BUFFERS}MB
effective_cache_size = ${EFFECTIVE_CACHE}MB
maintenance_work_mem = ${MAINTENANCE_WORK_MEM}MB
work_mem = ${WORK_MEM}MB

# Checkpoint & WAL
wal_buffers = 16MB
checkpoint_completion_target = 0.9
checkpoint_timeout = 10min
max_wal_size = 2GB
min_wal_size = 512MB

# Connection Settings
max_connections = 100

# Query Planner
effective_io_concurrency = 200
random_page_cost = 1.1

# Logging
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '

# Autovacuum
autovacuum = on
autovacuum_max_workers = 3
EOF

# Create log directory
mkdir -p /var/log/postgresql
chown postgres:postgres /var/log/postgresql

# Restart PostgreSQL
systemctl restart postgresql

echo "✅ PostgreSQL tuned for production!"
```

### 3.4 Redis Installation

**`scripts/redis-setup.sh`**:

```bash
#!/bin/bash
set -euo pipefail

# Calculate Redis maxmemory based on total RAM (25% for 4GB VPS)
MAXMEMORY="512mb"

echo "🔴 Installing Redis..."
apt install -y redis-server

# Backup original config
cp /etc/redis/redis.conf /etc/redis/redis.conf.bak

# Configure Redis
tee /etc/redis/redis.conf << EOF
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

# Security
rename-command FLUSHDB ""
rename-command FLUSHALL ""

# Performance
tcp-keepalive 300
timeout 0
tcp-backlog 511
EOF

# Create log directory
mkdir -p /var/log/redis
chown redis:redis /var/log/redis

# Start and enable
systemctl restart redis-server
systemctl enable redis-server

# Verify
redis-cli ping

echo "✅ Redis configured with AOF persistence!"
```

---

## 4. Application Deployment

### 4.1 Repository Setup

**`scripts/app-setup.sh`** - Run as deploy user:

```bash
#!/bin/bash
set -euo pipefail

APP_DIR="/var/www/tinygeniushub"
REPO_URL="https://github.com/manhquydev/tinygeniushub.git"

echo "📁 Setting up application..."

# Create directory
sudo mkdir -p $APP_DIR
sudo chown deploy:deploy $APP_DIR

# Clone repository
cd /srv
git clone $REPO_URL tinygeniushub
cd tinygeniushub

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Generate Prisma client
echo "🔧 Generating Prisma client..."
pnpm db:generate

echo "✅ Application repository ready!"
echo "Next: Configure .env.production"
```

### 4.2 Environment Configuration Template

Create `/var/www/tinygeniushub/.env.production`:

```bash
# Database (using PgBouncer on port 6432)
DATABASE_URL=postgresql://tinygeniushub_app:YOUR_PASSWORD@127.0.0.1:6432/tinygeniushub?schema=public

# Session & Auth Secrets (generate: openssl rand -hex 32)
SESSION_SECRET=YOUR_64_CHAR_HEX_SECRET
BETTER_AUTH_SECRET=YOUR_64_CHAR_HEX_SECRET
BETTER_AUTH_URL=https://www.tinygeniushubvn.tech
AUTH_TRUSTED_ORIGINS=https://www.tinygeniushubvn.tech,https://www.tinygeniushubvn.tech

# Admin Secret
ADMIN_AUTH_SECRET=YOUR_64_CHAR_HEX_SECRET

# Billing
BILLING_WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
BILLING_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRETS=whsec_xxxxx

# Course Payment (PayOS for Vietnam)
COURSE_PAYMENT_PROVIDER=payos
PAYOS_CLIENT_ID=your_payos_client_id
PAYOS_API_KEY=your_payos_api_key
PAYOS_CHECKSUM_KEY=your_payos_checksum_key

# Email (Brevo transactional API)
REPORT_EMAIL_PROVIDER=brevo
REPORT_EMAIL_BREVO_API_KEY=xkeysib_xxxxx
REPORT_EMAIL_BREVO_API_BASE_URL=https://api.brevo.com/v3
REPORT_EMAIL_FROM=no-reply@tinygeniushubvn.tech
REPORT_EMAIL_REPLY_TO=support@tinygeniushubvn.tech

# Optional: Brevo SMTP relay reference (for external SMTP clients/tools)
REPORT_EMAIL_BREVO_SMTP_SERVER=smtp-relay.brevo.com
REPORT_EMAIL_BREVO_SMTP_PORT=587
REPORT_EMAIL_BREVO_SMTP_LOGIN=your-login@smtp-brevo.com
REPORT_EMAIL_BREVO_SMTP_PASSWORD=your-smtp-password

# Cron
CRON_SECRET=YOUR_CRON_SECRET_MIN_32_CHARS

# Redis
REDIS_URL=redis://127.0.0.1:6379

# Storage (R2)
STORAGE_PROVIDER=cloudflare_r2
R2_ACCOUNT_ID=your_r2_account_id
R2_BUCKET_NAME=your_bucket
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key

# Rate Limiting
RATE_LIMIT_TRUST_PROXY=true
RATE_LIMIT_TRUSTED_HOPS=1

# Backup
BACKUP_OUTPUT_DIR=/var/www/tinygeniushub/backups/postgres
BACKUP_OFFSITE_ENABLED=true
BACKUP_OFFSITE_R2_BUCKET=your-backup-bucket
BACKUP_OFFSITE_R2_PREFIX=postgres/prod

# Misc
LOG_LEVEL=info
NODE_ENV=production
ADMIN_EMAILS=admin@tinygeniushubvn.tech
```

### 4.3 PM2 Ecosystem Configuration

**`ecosystem.config.js`**:

```javascript
module.exports = {
  apps: [
    {
      name: 'tinygeniushub-web',
      script: './node_modules/.bin/next',
      args: 'start --hostname 0.0.0.0 --port 3000',
      cwd: '/var/www/tinygeniushub',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '1G',
      restart_delay: 3000,
      max_restarts: 5,
      log_file: '/var/log/pm2/tinygeniushub-web.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true
    },
    {
      name: 'tinygeniushub-worker',
      script: './node_modules/.bin/tsx',
      args: 'src/worker/index.ts',
      cwd: '/var/www/tinygeniushub',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '512M',
      log_file: '/var/log/pm2/tinygeniushub-worker.log',
      autorestart: true
    }
  ]
};
```

### 4.4 Initial Deployment

**`scripts/deploy-initial.sh`**:

```bash
#!/bin/bash
set -euo pipefail

echo "🚀 Starting initial deployment..."
cd /var/www/tinygeniushub

# Pull latest code
git fetch origin && git checkout main && git pull origin main

# Install dependencies
pnpm install --frozen-lockfile

# Generate Prisma client
pnpm db:generate

# Run migrations
DOTENV_CONFIG_PATH=.env.production pnpm prisma migrate deploy

# Build application
pnpm build

# Start services
pm2 start ecosystem.config.js --env production
pm2 save

# Setup PM2 startup
pm2 startup systemd

echo "✅ Initial deployment complete!"
echo "Check: curl https://www.tinygeniushubvn.tech/api/health"
```

---

## 5. Abeka Import Procedure

### 5.1 Upload Curriculum Data

```bash
# From local machine
rsync -avz --progress ./abeka_tools/api/ deploy@tinygeniushubvn.tech:/srv/abeka_tools/api/
```

### 5.2 Import Script

**`scripts/abeka-import.sh`**:

```bash
#!/bin/bash
set -euo pipefail

cd /var/www/tinygeniushub

echo "🎓 Starting Abeka curriculum import..."

# Import all grades (K4-12)
pnpm abeka:import --verbose

# Or import specific grade
# pnpm abeka:import --grade=1 --verbose

echo "✅ Abeka import complete!"

# Import full course catalog
echo "📚 Importing full course catalog..."
pnpm tsx prisma/scripts/import-three-courses-bootstrap.ts \
  --api-root /srv/abeka_tools/api \
  --bootstrap /var/www/tinygeniushub/docs/api/program-bootstrap/three-courses-program.json \
  --publish

echo "✅ Full catalog import complete!"
```

### 5.3 Verification

```bash
#!/bin/bash
# verify-deployment.sh

echo "🔍 Verifying deployment..."

# Database counts
sudo -u postgres psql -d tinygeniushub << 'EOF'
SELECT 'Abeka Grades' as table_name, COUNT(*) as count FROM "AbekaGrade"
UNION ALL SELECT 'Abeka Lessons', COUNT(*) FROM "AbekaLesson"
UNION ALL SELECT 'Courses', COUNT(*) FROM "Course"
UNION ALL SELECT 'Lessons', COUNT(*) FROM "Lesson";
EOF

# API health checks
echo ""
echo "Health: $(curl -s https://www.tinygeniushubvn.tech/api/health | jq -r '.status // "unknown"')"
echo "Ready: $(curl -s https://www.tinygeniushubvn.tech/api/health/ready | jq -r '.ready // "unknown"')"
```

---

## 6. Backup & Restore

### 6.1 Daily Backup Script

**`scripts/daily-backup.sh`** - Place in `/etc/cron.daily/`:

```bash
#!/bin/bash
set -euo pipefail

APP_DIR="/var/www/tinygeniushub"
BACKUP_DIR="/srv/backups/postgres"
RETENTION_DAYS=7

mkdir -p $BACKUP_DIR
cd $APP_DIR

# Load environment
export $(grep -v '^#' .env.production | xargs)

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="tinygeniushub_${TIMESTAMP}.dump"

echo "[$(date)] Starting backup: $BACKUP_FILE"

# Create backup
pg_dump -h 127.0.0.1 -p 6432 -U tinygeniushub_app \
  -Fc -f "$BACKUP_DIR/$BACKUP_FILE" tinygeniushub

# Calculate checksum
cd $BACKUP_DIR
sha256sum "$BACKUP_FILE" > "$BACKUP_FILE.sha256"

# Create manifest
cat > "$BACKUP_FILE.json" << EOF
{
  "timestamp": "$TIMESTAMP",
  "file": "$BACKUP_FILE",
  "size": $(stat -c%s "$BACKUP_FILE"),
  "checksum": "$(sha256sum "$BACKUP_FILE" | cut -d' ' -f1)"
}
EOF

# Upload to offsite if configured
if [ "$BACKUP_OFFSITE_ENABLED" = "true" ]; then
  echo "[$(date)] Uploading to R2..."
  cd $APP_DIR
  pnpm backup:offsite:upload -- --file=$BACKUP_DIR/$BACKUP_FILE || true
fi

# Clean old backups
find $BACKUP_DIR -name "tinygeniushub_*.dump*" -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup complete!"
```

### 6.2 One-Command Migration Script

**`scripts/migrate-server.sh`**:

```bash
#!/bin/bash
set -euo pipefail

OLD_SERVER="${1:-}"
NEW_SERVER="${2:-}"
DOMAIN="tinygeniushubvn.tech"

if [ -z "$OLD_SERVER" ] || [ -z "$NEW_SERVER" ]; then
  echo "Usage: $0 <old-server-ip> <new-server-ip>"
  exit 1
fi

echo "🚚 Migrating from $OLD_SERVER to $NEW_SERVER..."

# 1. Create backup on old server
ssh deploy@$OLD_SERVER "cd /var/www/tinygeniushub && pnpm backup:create"
LATEST=$(ssh deploy@$OLD_SERVER "ls -t /srv/backups/postgres/*.dump | head -1")

# 2. Transfer to new server
rsync -avz "deploy@$OLD_SERVER:$LATEST" "deploy@$NEW_SERVER:/srv/backups/postgres/"

# 3. Restore on new server
ssh deploy@$NEW_SERVER "cd /var/www/tinygeniushub && pnpm backup:restore -- --file=/srv/backups/postgres/$(basename $LATEST)"

# 4. Start services
ssh deploy@$NEW_SERVER "cd /var/www/tinygeniushub && pm2 start ecosystem.config.js --env production && pm2 save"

echo "✅ Migration complete! Update DNS to point $DOMAIN to $NEW_SERVER"
```

---

## 7. Monitoring & Alerting

### 7.1 Health Check Script

**`scripts/health-monitor.sh`** - Run via cron every 5 min:

```bash
#!/bin/bash
set -euo pipefail

APP_URL="https://www.tinygeniushubvn.tech"
LOG_FILE="/var/log/tinygeniushub/health-check.log"

mkdir -p $(dirname $LOG_FILE)

HEALTH=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL/api/health || echo "000")
READY=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL/api/health/ready || echo "000")

echo "[$(date)] health=$HEALTH ready=$READY" >> $LOG_FILE

# Alert and restart if down
if [ "$HEALTH" != "200" ]; then
  echo "[$(date)] ALERT: Health check failed!" >> $LOG_FILE
  pm2 restart tinygeniushub-web --update-env || pm2 start tinygeniushub-web
  pm2 restart tinygeniushub-worker --update-env || pm2 start tinygeniushub-worker
fi
```

**Add to crontab:**
```bash
*/5 * * * * /usr/local/bin/health-monitor.sh
```

### 7.2 Log Rotation

**`/etc/logrotate.d/tinygeniushub`**:

```
/var/log/pm2/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 deploy deploy
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

---

## 8. Troubleshooting

### 8.1 Common Issues

**Application won't start:**
```bash
pm2 logs tinygeniushub-web
# Check Node.js version
node --version  # Should be v22.x
# Check environment
cat /var/www/tinygeniushub/.env.production | grep -E "^(DATABASE_URL|REDIS_URL)"
# Test database
psql "$(grep DATABASE_URL .env.production | cut -d'=' -f2-)" -c "SELECT 1;"
```

**Database connection errors:**
```bash
sudo systemctl status postgresql
sudo systemctl status pgbouncer
ss -tlnp | grep -E "(5432|6432)"
```

**SSL certificate issues:**
```bash
sudo certbot certificates
sudo certbot renew --dry-run
sudo nginx -t && sudo systemctl reload nginx
```

### 8.2 Quick Commands Reference

```bash
# Deploy new code
cd /var/www/tinygeniushub && git pull --ff-only origin main && pnpm install --frozen-lockfile && pnpm prisma migrate deploy && pnpm prisma migrate status && pnpm build && pm2 reload tinygeniushub-web && pm2 reload tinygeniushub-worker

# Check status
pm2 status && curl https://www.tinygeniushubvn.tech/api/health

# Create backup
pnpm backup:create -- --offsite

# Restore backup
pnpm backup:restore -- --file=/path/to/backup.dump

# View logs
pm2 logs
tail -f /var/log/nginx/error.log
sudo tail -f /var/log/postgresql/*.log

# Restart services
pm2 restart tinygeniushub-web --update-env || pm2 start tinygeniushub-web
pm2 restart tinygeniushub-worker --update-env || pm2 start tinygeniushub-worker
sudo systemctl restart postgresql redis-server nginx
```

---

## Setup Checklist

### Pre-Deployment
- [ ] VPS provisioned (Ubuntu 22.04)
- [ ] Domain DNS configured
- [ ] SSH key added to deploy user

### VPS Setup
- [ ] Run `vps-setup.sh`
- [ ] Run `nodejs-install.sh`
- [ ] Run `nginx-ssl-setup.sh`

### Database
- [ ] Run `postgres-setup.sh`
- [ ] Run `pgbouncer-setup.sh`
- [ ] Run `postgres-tune.sh`
- [ ] Run `redis-setup.sh`

### Application
- [ ] Run `app-setup.sh`
- [ ] Configure `.env.production`
- [ ] Run `deploy-initial.sh`

### Data
- [ ] Run `abeka-import.sh`
- [ ] Verify courses and lessons

### Operations
- [ ] Install `daily-backup.sh` to cron.daily
- [ ] Configure log rotation
- [ ] Setup health monitoring
- [ ] Configure PM2 startup

---

*Document Version: 1.0*  
*Last Updated: $(date +%Y-%m-%d)*

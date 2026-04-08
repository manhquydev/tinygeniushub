# Server Deployment Plan

Complete step-by-step deployment guide for Cung Con Tu Hoc production server.

## Pre-Deployment Checklist

### 1. VPS Specifications
- **RAM**: 4GB minimum (8GB recommended)
- **Storage**: 50GB SSD minimum
- **OS**: Ubuntu 22.04 LTS
- **CPU**: 2+ cores
- **Network**: Public IP, ports 22, 80, 443 open

### 2. Domain Configuration
- [ ] Domain registered and DNS pointing to server IP
- [ ] SSL certificate ready (Let's Encrypt or purchased)
- [ ] `A` record: `@` → server IP
- [ ] `A` record: `www` → server IP (optional)
- [ ] Verify DNS propagation: `dig +short your-domain.com`

### 3. SSH Key Ready
```bash
# Generate deploy key locally
ssh-keygen -t ed25519 -f ~/.ssh/cungcontuhoc_deploy -C "deploy@cungcontuhoc"

# Copy public key to server
ssh-copy-id -i ~/.ssh/cungcontuhoc_deploy.pub root@<server-ip>

# Test connection
ssh -i ~/.ssh/cungcontuhoc_deploy root@<server-ip> "echo 'SSH OK'"
```

### 4. Environment Variables
Prepare `.env.production` file with all required variables:

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/cungcontuhoc?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="https://your-domain.com"

# Storage
STORAGE_PROVIDER="cloudflare_r2"
R2_ACCOUNT_ID="xxx"
R2_ACCESS_KEY_ID="xxx"
R2_SECRET_ACCESS_KEY="xxx"
R2_BUCKET_NAME="cungcontuhoc-media"

# Billing (if using Stripe)
BILLING_PROVIDER="stripe"
STRIPE_SECRET_KEY="sk_live_xxx"
STRIPE_WEBHOOK_SECRETS="whsec_xxx"

# Email (if using Brevo transactional API)
REPORT_EMAIL_PROVIDER="brevo"
REPORT_EMAIL_BREVO_API_KEY="xkeysib_xxx"
REPORT_EMAIL_BREVO_API_BASE_URL="https://api.brevo.com/v3"
REPORT_EMAIL_BREVO_WEBHOOK_SECRET="set-strong-webhook-secret"
REPORT_EMAIL_FROM="no-reply@your-domain.com"

# Admin
ADMIN_EMAILS="admin@your-domain.com"

# Rate Limiting
RATE_LIMIT_TRUST_PROXY="true"
CRON_SECRET="your-cron-secret"

# Optional: GA4
GA4_PROPERTY_ID="xxx"
```

### 5. Local Pre-Flight Checks
```bash
# Run all quality checks locally before deploying
pnpm release:check

# Verify production build works
NODE_ENV=production pnpm build
```

---

## SSH Deployment Steps

### Step 1: SSH vào server
```bash
ssh root@<server-ip>
```

### Step 2: Run VPS Setup Script
```bash
# Download and run automated setup
bash <(curl -s https://raw.githubusercontent.com/user/repo/main/scripts/vps-setup.sh)
```

**Manual setup (if curl fails):**
```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install pnpm
npm install -g pnpm@10.24.0

# Install PM2
npm install -g pm2

# Install PostgreSQL 16
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt-get update
apt-get install -y postgresql-16 postgresql-contrib

# Install Redis
apt-get install -y redis-server
systemctl enable redis-server

# Install Nginx
apt-get install -y nginx
systemctl enable nginx

# Install additional tools
apt-get install -y git curl wget htop fail2ban ufw

# Configure firewall
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable
```

### Step 3: Create Deploy User
```bash
# Create dedicated deploy user
useradd -m -s /bin/bash deploy
usermod -aG sudo deploy

# Setup SSH for deploy user
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### Step 4: Configure Database
```bash
# Switch to postgres user
su - postgres

# Create database and user
psql -c "CREATE USER cungcontuhoc WITH PASSWORD 'your-secure-password';"
psql -c "CREATE DATABASE cungcontuhoc OWNER cungcontuhoc;"
psql -c "GRANT ALL PRIVILEGES ON DATABASE cungcontuhoc TO cungcontuhoc;"

# Exit postgres user
exit

# Enable and start PostgreSQL
systemctl enable postgresql
systemctl start postgresql
```

### Step 5: Deploy Application
```bash
# Switch to deploy user
su - deploy

# Clone repository
git clone https://github.com/user/repo.git ~/app
cd ~/app

# Install dependencies
pnpm install --frozen-lockfile

# Setup environment
cp .env.example .env.production
# Edit .env.production with production values
nano .env.production

# Generate Prisma client
pnpm db:generate
```

### Step 6: Database Migration
```bash
cd ~/app

# Set environment
export $(cat .env.production | grep -v '^#' | xargs)

# Run migrations
pnpm prisma migrate deploy

# Seed packages (required)
pnpm db:seed:packages
```

### Step 7: Import Abeka Curriculum (Production)
```bash
cd ~/app

# Import with checkpointing for resumability
pnpm abeka:import:prod --checkpoint=./checkpoints/import.chk

# If interrupted, resume with:
# pnpm abeka:import:resume --checkpoint=./checkpoints/import.chk

# Verify import
pnpm abeka:validate:db
```

### Step 8: Build & Start Application
```bash
cd ~/app

# Build production
pnpm build

# Setup PM2 ecosystem
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'cungcontuhoc-web',
      cwd: '/home/deploy/app',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_file: '/home/deploy/app/.env.production',
      log_file: '/home/deploy/app/logs/web.log',
      error_file: '/home/deploy/app/logs/web-error.log',
      out_file: '/home/deploy/app/logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      restart_delay: 3000,
      max_restarts: 5,
      min_uptime: '10s',
      watch: false,
      kill_timeout: 5000
    },
    {
      name: 'cungcontuhoc-worker',
      cwd: '/home/deploy/app',
      script: 'tsx',
      args: 'src/worker/index.ts',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      env_file: '/home/deploy/app/.env.production',
      log_file: '/home/deploy/app/logs/worker.log',
      error_file: '/home/deploy/app/logs/worker-error.log',
      out_file: '/home/deploy/app/logs/worker-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '512M',
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: '10s',
      watch: false
    }
  ]
};
EOF

# Create logs directory
mkdir -p ~/app/logs

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd
```

### Step 9: Configure Nginx Reverse Proxy
```bash
# Exit to root
exit

# Create Nginx config
cat > /etc/nginx/sites-available/cungcontuhoc << 'EOF'
upstream cungcontuhoc {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;
    
    # Proxy to Next.js
    location / {
        proxy_pass http://cungcontuhoc;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
    
    # Static files caching
    location /_next/static {
        proxy_pass http://cungcontuhoc;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check endpoint (no caching)
    location /api/health {
        proxy_pass http://cungcontuhoc;
        proxy_cache_bypass 1;
        access_log off;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/cungcontuhoc /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
nginx -t
systemctl reload nginx
```

### Step 10: Setup SSL with Let's Encrypt
```bash
# Install Certbot
apt-get install -y certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d your-domain.com -d www.your-domain.com --non-interactive --agree-tos --email admin@your-domain.com

# Auto-renewal test
certbot renew --dry-run

# Setup cron for auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
```

---

## Post-Deployment Verification

### 1. Health Check
```bash
# Local health check
curl http://localhost:3000/api/health
# Expected: {"status":"ok"}

curl http://localhost:3000/api/health/ready
# Expected: {"status":"ready","checks":{"database":"ok","redis":"ok"}}

# External health check
curl https://your-domain.com/api/health
```

### 2. Check PM2 Logs
```bash
# As deploy user
su - deploy

# View all logs
pm2 logs

# View web only
pm2 logs cungcontuhoc-web

# View worker only
pm2 logs cungcontuhoc-worker

# View last 100 lines
pm2 logs --lines 100
```

### 3. Database Verification
```bash
# Connect to database
su - postgres
psql -d cungcontuhoc

# Verify table counts
\dt
SELECT COUNT(*) FROM "Parent";
SELECT COUNT(*) FROM "Child";
SELECT COUNT(*) FROM "Lesson";
SELECT COUNT(*) FROM "Course";

# Exit
\q
exit
```

### 4. Test API Endpoints
```bash
# Test auth endpoints
curl -X POST https://your-domain.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!","name":"Test User"}'

# Test lesson endpoint
curl https://your-domain.com/api/lessons/today?childId=test-id

# Test admin (with auth)
curl https://your-domain.com/api/admin/overview \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Webhook Test (if applicable)
```bash
# Test Stripe webhook endpoint
curl -X POST https://your-domain.com/api/billing/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{"test":"payload"}'
# Expected: 400 (Stripe signature missing) - means endpoint is live
```

---

## Monitoring Setup

### 1. PM2 Status
```bash
# As deploy user
su - deploy
pm2 status
pm2 monit

# Save PM2 config
pm2 save

# Setup startup script
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
```

### 2. Database Connections
```bash
# Monitor active connections
su - postgres -c "psql -c 'SELECT count(*) FROM pg_stat_activity;'"

# View connection details
su - postgres -c "psql -c 'SELECT datname, usename, state, count(*) FROM pg_stat_activity GROUP BY datname, usename, state;'"
```

### 3. System Monitoring
```bash
# Disk space
df -h

# Memory usage
free -h

# CPU and processes
htop

# Check specific process
ps aux | grep node
```

### 4. Log Monitoring Script
```bash
# Create monitoring script
cat > /home/deploy/app/scripts/monitor.sh << 'EOF'
#!/bin/bash
# Production monitoring script

echo "=== $(date) ==="
echo "--- PM2 Status ---"
pm2 status

echo "--- Memory Usage ---"
free -h

echo "--- Disk Space ---"
df -h | grep -E "(/$|/var)"

echo "--- Database Connections ---"
PGPASSWORD=$DB_PASSWORD psql -h localhost -U cungcontuhoc -d cungcontuhoc -c "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';"

echo "--- Redis Ping ---"
redis-cli ping

echo "--- Health Check ---"
curl -s http://localhost:3000/api/health | jq .

echo "=== End Report ==="
EOF

chmod +x /home/deploy/app/scripts/monitor.sh
```

### 5. Setup Logrotate
```bash
cat > /etc/logrotate.d/cungcontuhoc << 'EOF'
/home/deploy/app/logs/*.log {
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
EOF
```

---

## Rollback Commands

### Code Rollback
```bash
# As deploy user
su - deploy
cd ~/app

# View git history
git log --oneline -10

# Checkout previous commit
git checkout <previous-commit-hash>

# Reinstall and rebuild
pnpm install --frozen-lockfile
pnpm build

# Restart PM2
pm2 restart all

# Verify rollback
curl http://localhost:3000/api/health
```

### Database Rollback
```bash
# As postgres user
su - postgres

# Restore from backup
psql -d cungcontuhoc < /path/to/backup_pre_migration.sql

# Or use backup:restore script (as deploy user)
su - deploy
cd ~/app
pnpm backup:restore -- --file=backups/postgres/<backup-file>.dump
```

### Emergency Full Rollback
```bash
#!/bin/bash
# emergency-rollback.sh

echo "Starting emergency rollback..."

# Stop services
pm2 stop all

# Rollback code
cd ~/app
git checkout <known-good-commit>
pnpm install --frozen-lockfile

# Restore database (if migration failed)
# pnpm backup:restore -- --file=backups/postgres/latest.dump

# Rebuild
pnpm build

# Start services
pm2 start all

# Verify
curl -f http://localhost:3000/api/health || exit 1

echo "Rollback complete!"
```

---

## Safety Procedures

### Before Every Deploy
```bash
# 1. Create backup
pnpm backup:create -- --offsite

# 2. Test backup
pnpm backup:verify -- --file=backups/postgres/<latest>.dump

# 3. Staging test (if available)
# Deploy to staging first, run full test suite
pnpm test:e2e:full

# 4. Check system resources
free -h && df -h

# 5. Verify no ongoing maintenance windows
```

### Backup Verification
```bash
# List local backups
ls -la ~/app/backups/postgres/

# List offsite backups (R2)
pnpm backup:offsite:list

# List Google Drive backups
pnpm backup:gdrive:list

# Restore test (on staging)
pnpm backup:restore -- --file=backups/postgres/<backup>.dump --no-clean
```

### Monitoring Alerts
```bash
# Setup basic alerting
cat > ~/app/scripts/alert-check.sh << 'EOF'
#!/bin/bash
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ "$HEALTH" != "200" ]; then
    echo "ALERT: Health check failed with status $HEALTH" | mail -s "CungContuhoc Alert" admin@your-domain.com
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 85 ]; then
    echo "ALERT: Disk usage at ${DISK_USAGE}%" | mail -s "CungContuhoc Disk Alert" admin@your-domain.com
fi
EOF

chmod +x ~/app/scripts/alert-check.sh

# Add to crontab
crontab -l > /tmp/cron.txt
echo "*/5 * * * * /home/deploy/app/scripts/alert-check.sh" >> /tmp/cron.txt
crontab /tmp/cron.txt
rm /tmp/cron.txt
```

---

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
lsof -i :3000
kill -9 <PID>
pm2 restart all
```

**Database connection failed:**
```bash
# Check PostgreSQL status
systemctl status postgresql

# Check connection
su - postgres -c "psql -c 'SELECT 1;'"

# Check firewall
ufw status
```

**Out of memory:**
```bash
# Add swap
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Reduce PM2 instances
pm2 scale cungcontuhoc-web 1
```

**502 Bad Gateway:**
```bash
# Check if app is running
pm2 status
curl http://localhost:3000/api/health

# Check Nginx error logs
tail -f /var/log/nginx/error.log

# Restart Nginx
systemctl restart nginx
```

---

## Quick Reference: SSH Commands

### One-Command Deploy
```bash
# Run the deploy script locally
bash scripts/deploy-production.sh <server-ip>
```

### Manual Quick Deploy
```bash
# 1. SSH
ssh root@<server-ip>

# 2. Switch to deploy
su - deploy

# 3. Update and deploy
cd ~/app && git pull && pnpm install && pnpm build && pm2 restart all

# 4. Verify
curl http://localhost:3000/api/health
```

### Database Operations
```bash
# Backup before deploy
pnpm backup:create -- --offsite

# Reset database (DANGER)
pnpx prisma migrate reset

# View migration status
pnpm prisma migrate status
```

### Log Access
```bash
# Real-time logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u postgresql -f
sudo journalctl -u redis-server -f
```

---

## Contact & Escalation

- **Primary**: [Your contact]
- **Secondary**: [Backup contact]
- **Hosting Provider**: DigitalOcean Support
- **Domain Registrar**: [Your registrar support]

---

*Last updated: 2026-04-04*
*Version: 1.0*

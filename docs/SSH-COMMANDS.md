# SSH Commands Reference - TinyGenius Hub

Quick copy-paste SSH commands for server management and deployment.

## Pre-Deployment Checklist

### 1. SSH Key Setup
```bash
# Generate SSH key
ssh-keygen -t ed25519 -f ~/.ssh/tinygeniushub_deploy -C "deploy@tinygeniushubvn.tech"

# Copy to server (as root first)
ssh-copy-id -i ~/.ssh/tinygeniushub_deploy.pub root@<server-ip>

# Test connection
ssh -i ~/.ssh/tinygeniushub_deploy root@<server-ip> "echo 'SSH OK'"
```

### 2. Domain & DNS Check
```bash
# Check DNS propagation
dig +short your-domain.com
dig +short www.your-domain.com

# Check with NSLOOKUP
nslookup your-domain.com
```

---

## VPS Setup (Run as root)

### Initial Server Setup
```bash
# SSH into server
ssh -i ~/.ssh/tinygeniushub_deploy root@<server-ip>

# Download and run VPS setup
bash <(curl -s https://raw.githubusercontent.com/manhquydev/cungcontuhoc/main/scripts/vps-setup.sh)

# Or run local script
scp scripts/vps-setup.sh root@<server-ip>:/tmp/
ssh root@<server-ip> "bash /tmp/vps-setup.sh"
```

### Install Node.js, pnpm, PM2
```bash
# SSH as deploy user
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip>

# Run Node.js installation
bash scripts/nodejs-install.sh
```

### Setup PostgreSQL
```bash
# SSH as root
ssh -i ~/.ssh/tinygeniushub_deploy root@<server-ip>

# Run PostgreSQL setup
bash scripts/postgres-setup.sh tinygeniushub tinygeniushub_app "your-secure-password"
```

---

## Application Deployment

### One-Command Deploy (Local Machine)
```bash
# Full deploy with tests and backup
bash scripts/deploy-production.sh <server-ip>

# Skip tests (faster)
bash scripts/deploy-production.sh <server-ip> --skip-tests

# Dry run (test SSH only)
bash scripts/deploy-production.sh <server-ip> --dry-run

# Rollback to previous commit
bash scripts/deploy-production.sh <server-ip> --rollback

# Skip backup (not recommended)
bash scripts/deploy-production.sh <server-ip> --skip-backup
```

### Manual Deploy Steps (On Server)
```bash
# 1. SSH to server
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip>

# 2. Switch to app directory
cd /srv/tinygeniushub

# 3. Pull latest code
git fetch origin
git checkout main
git pull origin main

# 4. Install dependencies
pnpm install --frozen-lockfile

# 5. Generate Prisma client
pnpm db:generate

# 6. Run migrations
DOTENV_CONFIG_PATH=.env.production pnpm prisma migrate deploy

# 7. Seed packages (required)
pnpm db:seed:packages

# 8. Import Abeka curriculum (production)
pnpm abeka:import:prod --checkpoint=./checkpoints/import.chk

# 9. Validate import
pnpm abeka:validate:db

# 10. Build application
pnpm build

# 11. Restart PM2
pm2 restart all
```

---

## Post-Deployment Verification

### Health Checks
```bash
# SSH to server
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip>

# Check health endpoint
curl http://localhost:3000/api/health

# Check ready endpoint
curl http://localhost:3000/api/health/ready

# Check from external (replace with your domain)
curl https://your-domain.com/api/health
```

### Check PM2 Status & Logs
```bash
# View process status
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "pm2 status"

# View all logs
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "pm2 logs"

# View web logs only
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "pm2 logs tinygeniushub-web"

# View worker logs only
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "pm2 logs tinygeniushub-worker"

# View last 100 lines
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "pm2 logs --lines 100"
```

### Database Verification
```bash
# Connect to database
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip>
su - postgres
psql -d tinygeniushub

# Check table counts
\dt
SELECT COUNT(*) FROM "Parent";
SELECT COUNT(*) FROM "Child";
SELECT COUNT(*) FROM "Lesson";
SELECT COUNT(*) FROM "Course";

# Exit
\q
exit
```

---

## Monitoring Commands

### System Resources
```bash
# SSH and check resources
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip>

# Disk space
df -h

# Memory usage
free -h

# CPU and processes
htop

# Check Node processes
ps aux | grep node

# Check PM2
pm2 status
pm2 monit
```

### Database Connections
```bash
# Monitor active connections
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "su - postgres -c 'psql -c \"SELECT count(*) FROM pg_stat_activity;\"'"

# View connection details
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "su - postgres -c 'psql -c \"SELECT datname, usename, state, count(*) FROM pg_stat_activity GROUP BY datname, usename, state;\"'"
```

### Redis Check
```bash
# Test Redis
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "redis-cli ping"

# Redis info
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "redis-cli info"
```

---

## Rollback Commands

### Code Rollback
```bash
# SSH to server
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip>
cd /srv/tinygeniushub

# View git history
git log --oneline -10

# Checkout previous commit
git checkout <previous-commit-hash>

# Reinstall and rebuild
pnpm install --frozen-lockfile
pnpm build

# Restart PM2
pm2 restart all

# Verify
curl http://localhost:3000/api/health
```

### Database Rollback
```bash
# SSH to server
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip>
cd /srv/tinygeniushub

# List available backups
ls -la backups/postgres/

# Restore from backup
pnpm backup:restore -- --file=backups/postgres/<backup-file>.dump

# Or manually with psql
su - postgres
psql -d tinygeniushub < /path/to/backup_pre_migration.sql
```

### Emergency Full Rollback Script
```bash
# Save and run on server
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> << 'EOF'
cd /srv/tinygeniushub

echo "Starting emergency rollback..."

# Stop services
pm2 stop all

# Rollback code
git checkout <known-good-commit>
pnpm install --frozen-lockfile

# Rebuild
pnpm build

# Start services
pm2 start all

# Verify
curl -f http://localhost:3000/api/health || exit 1

echo "Rollback complete!"
EOF
```

---

## Backup Commands

### Create Backup
```bash
# Local backup
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "cd /srv/tinygeniushub && pnpm backup:create"

# With offsite upload (R2)
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "cd /srv/tinygeniushub && pnpm backup:create -- --offsite"

# With Google Drive upload
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "cd /srv/tinygeniushub && pnpm backup:create -- --gdrive"
```

### List & Download Backups
```bash
# List local backups
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "ls -la /srv/tinygeniushub/backups/postgres/"

# List Google Drive backups
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "cd /srv/tinygeniushub && pnpm backup:gdrive:list"

# Download from Google Drive
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "cd /srv/tinygeniushub && pnpm backup:gdrive:download -- --remote-key=postgres/prod/<backup-file>.dump"

# Verify backup
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "cd /srv/tinygeniushub && pnpm backup:verify -- --file=backups/postgres/<backup-file>.dump"
```

---

## Maintenance Commands

### Restart Services
```bash
# Restart all PM2 processes
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "pm2 restart all"

# Restart only web
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "pm2 restart tinygeniushub-web"

# Restart only worker
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "pm2 restart tinygeniushub-worker"

# Reload with zero downtime
ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "pm2 reload all"
```

### Nginx Management
```bash
# Test Nginx config
ssh -i ~/.ssh/tinygeniushub_deploy root@<server-ip> "nginx -t"

# Reload Nginx
ssh -i ~/.ssh/tinygeniushub_deploy root@<server-ip> "systemctl reload nginx"

# Restart Nginx
ssh -i ~/.ssh/tinygeniushub_deploy root@<server-ip> "systemctl restart nginx"

# View Nginx error logs
ssh -i ~/.ssh/tinygeniushub_deploy root@<server-ip> "tail -f /var/log/nginx/error.log"

# View Nginx access logs
ssh -i ~/.ssh/tinygeniushub_deploy root@<server-ip> "tail -f /var/log/nginx/access.log"
```

### SSL Certificate
```bash
# Renew certificates
ssh -i ~/.ssh/tinygeniushub_deploy root@<server-ip> "certbot renew"

# Dry run renewal test
ssh -i ~/.ssh/tinygeniushub_deploy root@<server-ip> "certbot renew --dry-run"

# Force renewal
ssh -i ~/.ssh/tinygeniushub_deploy root@<server-ip> "certbot renew --force-renewal"
```

---

## File Transfer Commands

### Upload Files
```bash
# Upload single file
scp -i ~/.ssh/tinygeniushub_deploy ./local-file.txt deploy@<server-ip>:/srv/tinygeniushub/

# Upload directory
scp -i ~/.ssh/tinygeniushub_deploy -r ./local-dir/ deploy@<server-ip>:/srv/tinygeniushub/

# Upload .env.production
scp -i ~/.ssh/tinygeniushub_deploy ./.env.production deploy@<server-ip>:/srv/tinygeniushub/
```

### Download Files
```bash
# Download single file
scp -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip>:/srv/tinygeniushub/logs/app.log ./local.log

# Download directory
scp -i ~/.ssh/tinygeniushub_deploy -r deploy@<server-ip>:/srv/tinygeniushub/backups/ ./backups/
```

---

## Useful Aliases (Add to ~/.bashrc)

```bash
# Server aliases
alias ssh-prod='ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip>'
alias ssh-prod-root='ssh -i ~/.ssh/tinygeniushub_deploy root@<server-ip>'
alias prod-logs='ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "pm2 logs"'
alias prod-status='ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "pm2 status"'
alias prod-health='ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip> "curl -s http://localhost:3000/api/health"'
alias prod-deploy='bash scripts/deploy-production.sh <server-ip>'
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `ssh -i ~/.ssh/tinygeniushub_deploy deploy@<server-ip>` | SSH to server |
| `pm2 status` | Check process status |
| `pm2 logs` | View logs |
| `pm2 restart all` | Restart all services |
| `curl http://localhost:3000/api/health` | Health check |
| `pnpm backup:create` | Create backup |
| `pnpm backup:restore -- --file=<file>` | Restore backup |
| `df -h` | Disk usage |
| `free -h` | Memory usage |
| `nginx -t` | Test Nginx config |

---

## Emergency Contacts

- **Server Provider**: DigitalOcean Support
- **Domain Registrar**: [Your registrar]
- **Primary Contact**: [Your contact]
- **Backup Contact**: [Backup contact]

---

*Last updated: 2026-04-04*

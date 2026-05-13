# Abeka Curriculum System - Production Deployment Checklist

> **Version:** 1.0.0  
> **Last Updated:** 2026-04-04  
> **Target:** TinyGenius Hub - Abeka Curriculum (20,195 videos, 14 grades K4-12)  
> **Estimated Time:** 6-8 hours for full deployment

---

## 📋 Legend

| Symbol | Meaning |
|--------|---------|
| 🔴 **High** | Critical - Deployment will fail if skipped |
| 🟡 **Medium** | Important - May cause issues if skipped |
| 🟢 **Low** | Optional - Nice to have |
| ⏱️ | Estimated time for step |
| 📝 | Notes/Reminders |

---

## Phase 1: Pre-Deployment Checklist

### 🔴 Code Review & Quality Gates

#### 1.1 Code Review Completed
- [ ] **All PRs merged to `main` branch**
  ```bash
  git checkout main
  git pull origin main
  git log --oneline -5
  ```
  **Expected Output:**
  ```
  abc1234 (HEAD -> main, origin/main) Merge pull request #123 from feature/abeka-import
  def5678 Fix: validation edge cases
  ghi9012 Update: checkpoint system
  ...
  ```

- [ ] **No uncommitted changes**
  ```bash
  git status
  ```
  **Expected Output:**
  ```
  On branch main
  Your branch is up to date with 'origin/main'.
  
  nothing to commit, working tree clean
  ```

#### 1.2 All Tests Passing
- [ ] **Unit tests pass** 🔴 ⏱️ 2-3 min
  ```bash
  pnpm test
  ```
  **Expected Output:**
  ```
  Test Suites: 15 passed, 15 total
  Tests:       127 passed, 127 total
  Snapshots:   0 total
  Time:        12.345s
  ```

- [ ] **Type checking passes** 🔴 ⏱️ 1-2 min
  ```bash
  pnpm type-check
  ```
  **Expected Output:**
  ```
  tsc --noEmit
  # No output = success
  ```

- [ ] **Linting passes** 🟡 ⏱️ 30 sec
  ```bash
  pnpm lint
  ```
  **Expected Output:**
  ```
  ✔ No ESLint warnings or errors
  ```

- [ ] **E2E smoke tests pass** 🔴 ⏱️ 5-10 min
  ```bash
  pnpm test:e2e
  ```
  **Expected Output:**
  ```
  Running 15 tests using 4 workers
  15 passed (45s)
  ```

- [ ] **E2E P0 tests pass** 🔴 ⏱️ 3-5 min
  ```bash
  pnpm test:e2e:p0
  ```
  **Expected Output:**
  ```
  Running P0 critical path tests...
  8 passed (28s)
  ```

- [ ] **Security baseline passes** 🔴 ⏱️ 1-2 min
  ```bash
  pnpm security:baseline
  ```
  **Expected Output:**
  ```
  Security scan: PASSED
  Critical: 0 | High: 0 | Medium: 2 | Low: 5
  Fail threshold: high (0 failures)
  ```

- [ ] **Release check passes** 🔴 ⏱️ 2-3 min
  ```bash
  pnpm release:check
  ```
  **Expected Output:**
  ```
  ✓ All checks passed
  ✓ Ready for deployment
  ```

### 🔴 Database Migrations Ready

#### 1.3 Migration Status
- [ ] **Migration files generated** 🔴
  ```bash
  ls -la prisma/migrations/
  ```
  **Expected Output:**
  ```
  20250403233600_abeka_curriculum_system/
  migration_lock.toml
  ```

- [ ] **Migration can be applied cleanly** 🔴 ⏱️ 1-2 min
  ```bash
  pnpm db:migrate:status
  ```
  **Expected Output:**
  ```
  Database schema is up to date
  1 pending migration(s): 20250403233600_abeka_curriculum_system
  ```

- [ ] **Migration SQL reviewed** 🟡
  ```bash
  cat prisma/migrations/20250403233600_abeka_curriculum_system/migration.sql | head -50
  ```
  **Expected Output:**
  ```sql
  -- CreateTable AbekaGrade
  CREATE TABLE "AbekaGrade" (
    "id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    ...
  ```

#### 1.4 Backup Before Migration 🔴
- [ ] **Create pre-deployment backup**
  ```bash
  pnpm backup:create -- --offsite
  ```
  **Expected Output:**
  ```
  Creating backup: backups/postgres/pre_deploy_20260404_120000.dump
  ✓ Backup created: 45MB
  ✓ Checksum: a1b2c3d4...
  ✓ Uploaded to R2: postgres/prod/pre_deploy_20260404_120000.dump
  ```

- [ ] **Verify backup integrity** 🔴
  ```bash
  pnpm backup:verify -- --file=backups/postgres/pre_deploy_20260404_120000.dump
  ```
  **Expected Output:**
  ```
  Verifying backup: pre_deploy_20260404_120000.dump
  ✓ Checksum verified
  ✓ Archive readable
  ✓ Database objects: 245 tables
  ```

### 🔴 Environment Variables Configured

#### 1.5 Production Environment File
- [ ] **`.env.production` file exists and is complete** 🔴
  ```bash
  ls -la .env.production
  wc -l .env.production
  ```
  **Expected Output:**
  ```
  -rw------- 1 user group 2847 Apr 4 12:00 .env.production
  45 .env.production
  ```

- [ ] **Required variables set** 🔴
  ```bash
  grep -E '^(DATABASE_URL|BETTER_AUTH_SECRET|APP_URL)' .env.production
  ```
  **Expected Output:**
  ```
  DATABASE_URL="postgresql://ccth_prod:***@localhost:5432/ccth_prod"
  BETTER_AUTH_SECRET="[32+ char secret]"
  APP_URL="https://www.tinygeniushubvn.tech"
  ```

- [ ] **Abeka-specific variables configured** 🔴
  ```bash
  grep -E '^(ABEKA_|BILLING_|STRIPE_)' .env.production
  ```
  **Expected Output:**
  ```
  ABEKA_DATA_PATH="/var/www/abeka_data"
  ABEKA_BATCH_SIZE="100"
  ABEKA_RATE_LIMIT_MS="10"
  BILLING_PROVIDER="stripe"
  STRIPE_SECRET_KEY="sk_live_..."
  ```

- [ ] **No placeholder values** 🔴
  ```bash
  grep -E '(TODO|FIXME|CHANGE_ME|example\.com|placeholder)' .env.production
  ```
  **Expected Output:**
  ```
  # No matches = good
  ```

#### 1.6 Offsite Backup Credentials 🟡
- [ ] **R2/S3 backup credentials configured** 🟡
  ```bash
  grep -E '^(BACKUP_OFFSITE_|R2_)' .env.production
  ```
  **Expected Output:**
  ```
  BACKUP_OFFSITE_ENABLED="true"
  BACKUP_OFFSITE_R2_BUCKET="ccth-backups"
  BACKUP_OFFSITE_R2_PREFIX="postgres/prod"
  R2_ACCOUNT_ID="..."
  R2_ACCESS_KEY_ID="..."
  ```

### 🔴 Backup Strategy in Place

#### 1.7 Backup Infrastructure
- [ ] **Backup scripts executable** 🔴
  ```bash
  ls -la scripts/daily-backup.sh
  chmod +x scripts/daily-backup.sh
  ```
  **Expected Output:**
  ```
  -rwxr-xr-x 1 user group 2847 Apr 4 12:00 scripts/daily-backup.sh
  ```

- [ ] **Cron job configured for automated backups** 🟡
  ```bash
  crontab -l | grep backup
  ```
  **Expected Output:**
  ```
  0 2 * * * cd /var/www/ccth && pnpm backup:create -- --offsite >> /var/log/ccth-backup.log 2>&1
  ```

- [ ] **Backup storage accessible** 🟡
  ```bash
  pnpm backup:offsite:list 2>/dev/null || echo "Check backup storage manually"
  ```

### 🔴 Abeka Data Preparation

#### 1.8 Abeka Import Data Ready
- [ ] **Abeka JSON files present** 🔴
  ```bash
  ls -la $ABEKA_DATA_PATH 2>/dev/null || ls -la ./abeka_tools/
  ```
  **Expected Output:**
  ```
  K4/
  K5/
  Grade1/
  ...
  Grade12/
  metadata.json
  ```

- [ ] **Total file count verified** 🔴
  ```bash
  find $ABEKA_DATA_PATH -name "*.json" | wc -l
  ```
  **Expected Output:**
  ```
  2380  # ~170 lessons × 14 grades
  ```

- [ ] **Pre-import validation passed** 🔴 ⏱️ 2-3 min
  ```bash
  pnpm abeka:validate
  ```
  **Expected Output:**
  ```
  Abeka Import Validation
  =======================
  ✓ Data directory: /var/www/abeka_data
  ✓ JSON files: 2380
  ✓ Estimated videos: 20195
  ✓ All JSON files valid
  ✓ CDN URLs accessible (sample check)
  ✓ Ready for import
  ```

---

## Phase 2: Deployment Steps

### 🔴 Step 1: VPS Setup ⏱️ 30-45 min

#### 2.1.1 Server Requirements Verification
- [ ] **VPS meets minimum specs** 🔴
  ```bash
  # On VPS
  free -h && df -h && nproc
  ```
  **Expected Output:**
  ```
  total        used        free
  Mem:          4Gi       512Mi       3.4Gi  # >= 4GB RAM
  Disk:        50Gi        8Gi        42Gi  # >= 50GB SSD
  2  # >= 2 CPU cores
  ```

- [ ] **OS is Ubuntu 22.04 LTS** 🔴
  ```bash
  lsb_release -a
  ```
  **Expected Output:**
  ```
  Distributor ID: Ubuntu
  Description:    Ubuntu 22.04.4 LTS
  Release:        22.04
  Codename:       jammy
  ```

#### 2.1.2 Security Hardening
- [ ] **Run VPS hardening script** 🔴 ⏱️ 10 min
  ```bash
  bash scripts/vps-setup.sh
  ```
  **Expected Output:**
  ```
  [VPS Setup] Starting security hardening...
  ✓ UFW firewall enabled (ports: 22,80,443)
  ✓ fail2ban installed and running
  ✓ SSH root login disabled
  ✓ Automatic security updates enabled
  ✓ Docker installed
  [VPS Setup] Complete!
  ```

- [ ] **UFW status verified** 🔴
  ```bash
  sudo ufw status verbose
  ```
  **Expected Output:**
  ```
  Status: active
  To                         Action      From
  --                         ------      ----
  22/tcp                     ALLOW IN    Anywhere
  80/tcp                     ALLOW IN    Anywhere
  443/tcp                    ALLOW IN    Anywhere
  ```

- [ ] **fail2ban running** 🟡
  ```bash
  sudo systemctl status fail2ban
  ```
  **Expected Output:**
  ```
  Active: active (running) since Mon 2026-04-04 10:00:00 UTC
  ```

#### 2.1.3 Node.js & Dependencies
- [ ] **Node.js 22 LTS installed** 🔴
  ```bash
  node --version && npm --version
  ```
  **Expected Output:**
  ```
  v20.12.0  # >= 20.x
  10.5.0
  ```

- [ ] **pnpm installed** 🔴
  ```bash
  pnpm --version
  ```
  **Expected Output:**
  ```
  8.15.5  # >= 8.x
  ```

- [ ] **PM2 installed globally** 🟡
  ```bash
  pm2 --version
  ```
  **Expected Output:**
  ```
  5.3.0
  ```

### 🔴 Step 2: Database Setup ⏱️ 20-30 min

#### 2.2.1 PostgreSQL Setup
- [ ] **PostgreSQL 15+ installed** 🔴
  ```bash
  psql --version
  ```
  **Expected Output:**
  ```
  psql (PostgreSQL) 15.6
  ```

- [ ] **Database created** 🔴
  ```bash
  sudo -u postgres psql -l | grep ccth_prod
  ```
  **Expected Output:**
  ```
  ccth_prod | postgres | UTF8 | en_US.UTF-8 | en_US.UTF-8 |
  ```

- [ ] **Database user configured** 🔴
  ```bash
  sudo -u postgres psql -c "\du" | grep ccth_prod
  ```
  **Expected Output:**
  ```
  ccth_prod | Create DB, Create role | {} | y
  ```

- [ ] **Run postgres setup script** 🔴 ⏱️ 5 min
  ```bash
  bash scripts/postgres-setup.sh
  ```
  **Expected Output:**
  ```
  [PostgreSQL Setup] Configuring PostgreSQL 15...
  ✓ Database 'ccth_prod' created
  ✓ User 'ccth_prod' created
  ✓ postgresql.conf tuned for 4GB RAM
  ✓ pg_hba.conf configured
  ✓ PostgreSQL restarted
  [PostgreSQL Setup] Complete!
  ```

#### 2.2.2 PgBouncer (Connection Pooling)
- [ ] **PgBouncer installed** 🟡
  ```bash
  pgbouncer --version
  ```
  **Expected Output:**
  ```
  pgbouncer 1.18.0
  ```

- [ ] **PgBouncer configured** 🟡
  ```bash
  bash scripts/pgbouncer-setup.sh
  ```
  **Expected Output:**
  ```
  [PgBouncer Setup] Installing connection pooler...
  ✓ PgBouncer installed
  ✓ Configured for port 6432
  ✓ max_client_conn = 1000
  ✓ default_pool_size = 20
  ✓ PgBouncer running
  ```

- [ ] **Connection pooling verified** 🟡
  ```bash
  psql -p 6432 -U ccth_prod -h localhost -c "SELECT 1;"
  ```
  **Expected Output:**
  ```
  ?column?
  ----------
           1
  ```

#### 2.2.3 Redis Setup
- [ ] **Redis installed** 🔴
  ```bash
  redis-cli --version
  ```
  **Expected Output:**
  ```
  redis-cli 6.0.16
  ```

- [ ] **Redis persistence enabled** 🔴
  ```bash
  redis-cli CONFIG GET appendonly
  ```
  **Expected Output:**
  ```
  1) "appendonly"
  2) "yes"
  ```

- [ ] **Run redis setup script** 🔴 ⏱️ 3 min
  ```bash
  bash scripts/redis-setup.sh
  ```
  **Expected Output:**
  ```
  [Redis Setup] Configuring Redis...
  ✓ Redis installed
  ✓ AOF persistence enabled
  ✓ maxmemory 512mb
  ✓ maxmemory-policy allkeys-lru
  ✓ Redis running
  ```

- [ ] **Redis connection verified** 🔴
  ```bash
  redis-cli ping
  ```
  **Expected Output:**
  ```
  PONG
  ```

### 🔴 Step 3: Application Deploy ⏱️ 15-20 min

#### 2.3.1 Source Code Deployment
- [ ] **Application directory created** 🔴
  ```bash
  sudo mkdir -p /var/www/ccth
  sudo chown $USER:$USER /var/www/ccth
  ```

- [ ] **Code deployed to VPS** 🔴
  ```bash
  # Option 1: Git clone
  git clone https://github.com/your-org/tinygeniushub.git /var/www/tinygeniushub
  cd /var/www/ccth
  git checkout main
  
  # Option 2: CI/CD deployment
  # Code pushed via GitHub Actions
  ```
  **Expected Output:**
  ```
  Cloning into '/var/www/ccth'...
  Checked out main branch
  ```

- [ ] **Dependencies installed** 🔴 ⏱️ 5-8 min
  ```bash
  cd /var/www/ccth
  pnpm install --frozen-lockfile
  ```
  **Expected Output:**
  ```
  Packages: +1524
  ++++++++++++++++++++++++++++++++++++++++++++++++++
  Progress: resolved 1524, reused 1524, downloaded 0, done
  Done in 45.23s
  ```

#### 2.3.2 Environment Configuration
- [ ] **`.env.production` copied** 🔴
  ```bash
  cp /var/www/ccth/.env.production /var/www/ccth/.env
  chmod 600 /var/www/ccth/.env
  ```

- [ ] **Environment file permissions secured** 🔴
  ```bash
  ls -la /var/www/ccth/.env
  ```
  **Expected Output:**
  ```
  -rw------- 1 ccth ccth 2847 Apr 4 12:00 /var/www/ccth/.env
  ```

- [ ] **DATABASE_URL uses PgBouncer** 🟡
  ```bash
  grep DATABASE_URL /var/www/ccth/.env
  ```
  **Expected Output:**
  ```
  DATABASE_URL="postgresql://ccth_prod:password@localhost:6432/ccth_prod"
  ```

#### 2.3.3 Database Migration
- [ ] **Apply migrations** 🔴 ⏱️ 2-5 min
  ```bash
  cd /var/www/ccth
  pnpm db:migrate:deploy
  ```
  **Expected Output:**
  ```
  Prisma Migrate loaded and found 1 pending migrations
  Applying migration: 20250403233600_abeka_curriculum_system
  ✓ Migration applied successfully
  ```

- [ ] **Migration status verified** 🔴
  ```bash
  pnpm db:migrate:status
  ```
  **Expected Output:**
  ```
  Database schema is up to date
  No pending migrations
  ```

#### 2.3.4 Build & Start
- [ ] **Production build** 🔴 ⏱️ 3-5 min
  ```bash
  cd /var/www/ccth
  pnpm build
  ```
  **Expected Output:**
  ```
  > Build succeeded
  ✓ Compiled successfully
  ✓ Static files generated
  ✓ Route manifest created
  ```

- [ ] **Health check before full deploy** 🔴
  ```bash
  pnpm start &
  sleep 5
  curl -f http://localhost:3000/api/health
  kill %1
  ```
  **Expected Output:**
  ```
  {"status":"ok","timestamp":"2026-04-04T12:00:00.000Z"}
  ```

#### 2.3.5 Process Management (PM2)
- [ ] **PM2 ecosystem file created** 🔴
  ```bash
  cat /var/www/ccth/ecosystem.config.js
  ```
  **Expected Content:**
  ```javascript
  module.exports = {
    apps: [
      {
        name: 'ccth-web',
        script: 'npm',
        args: 'start',
        cwd: '/var/www/ccth',
        instances: 1,
        exec_mode: 'fork',
        env: { NODE_ENV: 'production' },
        log_file: '/var/log/ccth/web.log',
        error_file: '/var/log/ccth/web-error.log',
        out_file: '/var/log/ccth/web-out.log',
        max_memory_restart: '1G'
      },
      {
        name: 'ccth-worker',
        script: 'npm',
        args: 'run worker:start',
        cwd: '/var/www/ccth',
        instances: 1,
        exec_mode: 'fork',
        env: { NODE_ENV: 'production' },
        log_file: '/var/log/ccth/worker.log'
      }
    ]
  };
  ```

- [ ] **Log directories created** 🔴
  ```bash
  sudo mkdir -p /var/log/ccth
  sudo chown ccth:ccth /var/log/ccth
  ```

- [ ] **PM2 start application** 🔴
  ```bash
  cd /var/www/ccth
  pm2 start ecosystem.config.js
  ```
  **Expected Output:**
  ```
  [PM2] Starting /var/www/ccth
  [PM2] Done.
  ┌─────┬─────────────┬────────┬─────────┬────────┬────────┐
  │ id  │ name        │ mode   │ status  │ memory │ uptime │
  ├─────┼─────────────┼────────┼─────────┼────────┼────────┤
  │ 0   │ ccth-web    │ fork   │ online  │ 128mb  │ 0s     │
  │ 1   │ ccth-worker │ fork   │ online  │ 64mb   │ 0s     │
  ```

- [ ] **PM2 startup script configured** 🟡
  ```bash
  sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ccth --hp /home/ccth
  pm2 save
  ```
  **Expected Output:**
  ```
  [PM2] Init System found: systemd
  [PM2] To setup the Startup Script, execute:
  sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ccth --hp /home/ccth
  [PM2] [SUCCESS] Dumping running processes
  ```

### 🔴 Step 4: Abeka Import ⏱️ 10-20 min

#### 2.4.1 Pre-Import Checks
- [ ] **Abeka data path exists** 🔴
  ```bash
  ls -la $ABEKA_DATA_PATH
  ```
  **Expected Output:**
  ```
  drwxr-xr-x 16 ccth ccth 4096 Apr 4 10:00 .
  drwxr-xr-x  3 root root 4096 Apr 4 09:00 ..
  drwxr-xr-x  2 ccth ccth 4096 Apr 4 10:00 K4
  drwxr-xr-x  2 ccth ccth 4096 Apr 4 10:00 K5
  ...
  ```

- [ ] **Disk space sufficient** 🔴
  ```bash
  df -h $ABEKA_DATA_PATH
  ```
  **Expected Output:**
  ```
  Filesystem      Size  Used Avail Use% Mounted on
  /dev/sda1       50G   15G   35G  30% /
  # Avail >= 10GB recommended
  ```

- [ ] **Pre-import validation** 🔴 ⏱️ 2 min
  ```bash
  cd /var/www/ccth
  pnpm abeka:validate
  ```
  **Expected Output:**
  ```
  Abeka Import Validation
  =======================
  ✓ Data directory: /var/www/abeka_data
  ✓ JSON files: 2380
  ✓ Estimated videos: 20195
  ✓ CDN URLs accessible (sample: 50/50)
  ✓ Database connection: OK
  ✓ Ready for import
  ```

#### 2.4.2 Production Import
- [ ] **Create checkpoint directory** 🟡
  ```bash
  mkdir -p /var/www/ccth/checkpoints
  chown ccth:ccth /var/www/ccth/checkpoints
  ```

- [ ] **Run production import with checkpoint** 🔴 ⏱️ 10-15 min
  ```bash
  cd /var/www/ccth
  pnpm abeka:import:prod --checkpoint=./checkpoints/import.chk
  ```
  **Expected Output:**
  ```
  [Abeka Import] Starting production import...
  Checkpoint: ./checkpoints/import.chk
  
  Processing grades (14 total):
  [████████████] 100% | 14/14 grades | ~3m 45s
  
  Results:
  ✓ Grades processed: 14/14
  ✓ Videos imported: 20195/20195
  ✓ Time elapsed: 3m 45s
  ✓ Rate: ~90 videos/sec
  ✓ Checkpoint saved
  
  Import completed successfully!
  ```

- [ ] **Verify checkpoint file created** 🟡
  ```bash
  ls -la /var/www/ccth/checkpoints/
  cat /var/www/ccth/checkpoints/import.chk
  ```
  **Expected Output:**
  ```json
  {
    "version": "1.0.0",
    "startedAt": "2026-04-04T12:00:00Z",
    "completedGrades": [0,1,2,3,4,5,6,7,8,9,10,11,12,13],
    "failedGrades": [],
    "processedVideos": 20195,
    "status": "completed"
  }
  ```

- [ ] **Create post-import backup** 🔴 ⏱️ 3-5 min
  ```bash
  pnpm backup:create -- --offsite
  ```
  **Expected Output:**
  ```
  Creating backup: backups/postgres/post_import_20260404_123000.dump
  ✓ Backup created: 52MB
  ✓ Checksum: b2c3d4e5...
  ✓ Uploaded to R2
  ```

### 🔴 Step 5: Verification ⏱️ 10-15 min

#### 2.5.1 Database Verification
- [ ] **Row counts verified** 🔴
  ```bash
  cd /var/www/ccth
  pnpm abeka:validate:db
  ```
  **Expected Output:**
  ```
  Database Verification
  =====================
  ✓ AbekaGrade: 14 rows (expected: 14)
  ✓ AbekaSubject: 20 rows (expected: 20)
  ✓ AbekaLesson: 2380 rows (expected: ~2380)
  ✓ AbekaVideo: 20195 rows (expected: 20195) ✓
  ✓ AbekaLessonPackage: 2380 rows
  
  Total videos: 20195/20195 ✓
  All counts match expected values!
  ```

- [ ] **Sample data query** 🟡
  ```bash
  psql $DATABASE_URL -c "
    SELECT g.name, s.code, COUNT(v.id) as videos
    FROM \"AbekaGrade\" g
    JOIN \"AbekaSubject\" s ON s.\"gradeId\" = g.id
    JOIN \"AbekaLessonPackage\" lp ON lp.\"subjectId\" = s.id
    JOIN \"AbekaVideo\" v ON v.\"packageId\" = lp.id
    WHERE g.level = 1
    GROUP BY g.name, s.code
    ORDER BY s.code;
  "
  ```
  **Expected Output:**
  ```
   name  | code | videos
  -------+------+--------
   Grade 1 | BI   |     170
   Grade 1 | PH   |     170
   Grade 1 | AT   |     170
   ...
  ```

#### 2.5.2 API Verification
- [ ] **Health endpoint** 🔴
  ```bash
  curl -f http://localhost:3000/api/health
  ```
  **Expected Output:**
  ```json
  {"status":"ok","timestamp":"2026-04-04T12:30:00.000Z","uptime":600}
  ```

- [ ] **Readiness endpoint** 🔴
  ```bash
  curl -f http://localhost:3000/api/health/ready
  ```
  **Expected Output:**
  ```json
  {
    "status": "ready",
    "checks": {
      "database": "connected",
      "redis": "connected",
      "queue": "operational"
    }
  }
  ```

- [ ] **Abeka curriculum API** 🔴
  ```bash
  curl -f http://localhost:3000/api/abeka/curriculum/grades | jq '.grades | length'
  ```
  **Expected Output:**
  ```
  14
  ```

- [ ] **Sample lesson API** 🟡
  ```bash
  curl "http://localhost:3000/api/abeka/curriculum/lessons?gradeId=grade_1&lessonNumber=1" | jq '.lessons[0].videos | length'
  ```
  **Expected Output:**
  ```
  4  # Number of subjects/videos for lesson 1
  ```

#### 2.5.3 E2E Smoke Tests
- [ ] **Run production smoke tests** 🔴 ⏱️ 3-5 min
  ```bash
  cd /var/www/ccth
  pnpm test:e2e:smoke -- --env=production
  ```
  **Expected Output:**
  ```
  Running 10 smoke tests...
  ✓ Health check
  ✓ API /grades returns 14 grades
  ✓ API /lessons returns lessons
  ✓ Database connection
  ✓ Redis connection
  ✓ PM2 processes running
  ✓ Abeka import verified
  ...
  10 passed (25s)
  ```

---

## Phase 3: Post-Deployment

### 🔴 Health Checks ⏱️ 5 min

#### 3.1.1 System Health
- [ ] **All PM2 processes running** 🔴
  ```bash
  pm2 status
  ```
  **Expected Output:**
  ```
  ┌─────┬─────────────┬────────┬─────────┬────────┬────────┐
  │ id  │ name        │ mode   │ status  │ memory │ uptime │
  ├─────┼─────────────┼────────┼─────────┼────────┼────────┤
  │ 0   │ ccth-web    │ fork   │ online  │ 256mb  │ 15m    │
  │ 1   │ ccth-worker │ fork   │ online  │ 128mb  │ 15m    │
  ```

- [ ] **No error spikes in logs** 🔴
  ```bash
  tail -100 /var/log/ccth/web-error.log | grep -i error | wc -l
  ```
  **Expected Output:**
  ```
  0  # Or very low count (<5)
  ```

- [ ] **Log rotation working** 🟡
  ```bash
  ls -la /var/log/ccth/
  ```
  **Expected Output:**
  ```
  web.log
  web-error.log
  worker.log
  ```

### 🟡 Monitoring Setup ⏱️ 10-15 min

#### 3.2.1 Application Monitoring
- [ ] **Log aggregation configured** 🟡
  ```bash
  # If using external monitoring (e.g., Datadog, New Relic)
  # Verify agent is running
  systemctl status datadog-agent 2>/dev/null || echo "No external monitoring"
  ```

- [ ] **Health check cron configured** 🟡
  ```bash
  crontab -l | grep health
  ```
  **Expected Output:**
  ```
  */5 * * * * curl -sf http://localhost:3000/api/health || pm2 restart ccth-web
  ```

- [ ] **PM2 monitoring enabled** 🟡
  ```bash
  pm2 monitor

#### 3.2.3 Jules Auto-Remediation Monitoring 🔴
- [ ] **Jules webhook endpoints are configured in production** 🔴
  ```bash
  # Required GitHub secrets
  # JULES_WEBHOOK_ENDPOINT=https://<domain>/api/integrations/jules/github-webhook
  # JULES_FEEDBACK_ENDPOINT=https://<domain>/api/integrations/jules/session-feedback
  # JULES_ORCHESTRATOR_WEBHOOK_TOKEN=<long-random-token>
  # JULES_API_KEY=<rotated-jules-api-key>
  ```

- [ ] **Jules key scope validated before enabling workflows** 🔴
  ```bash
  JULES_API_KEY=<key> pnpm jules:validate-key
  ```
  **Expected Output:**
  ```
  Key scope check: PASS
  ```

- [ ] **Jules auto-remediation workflows enabled** 🔴
  ```bash
  # .github/workflows/jules-auto-remediation.yml
  # .github/workflows/jules-session-monitor.yml
  ```

- [ ] **Sensitive systems are opt-in only** 🔴
  ```bash
  # Auth/Billing tasks require label jules:sensitive-opt-in
  # Non-sensitive automation remains default path
  ```

- [ ] **Monitoring endpoint accessible for super admin** 🟡
  ```bash
  curl -sf "https://<domain>/api/admin/integrations/jules/monitoring?limit=50"
  ```
  **Expected Output:**
  ```json
  {
    "ok": true,
    "data": {
      "metrics": {
        "total": 10,
        "outcome:created": 7
      },
      "events": []
    }
  }
  ```
  ```

#### 3.2.2 Database Monitoring
- [ ] **PostgreSQL slow query log enabled** 🟢
  ```bash
  sudo -u postgres psql -c "SHOW log_min_duration_statement;"
  ```
  **Expected Output:**
  ```
   log_min_duration_statement
  ----------------------------
   1000ms
  ```

- [ ] **Redis monitoring** 🟢
  ```bash
  redis-cli info stats | grep total_commands_processed
  ```
  **Expected Output:**
  ```
  total_commands_processed:12345
  ```

### 🔴 SSL Verification ⏱️ 2 min

#### 3.3.1 SSL Certificate
- [ ] **Certificate installed** 🔴
  ```bash
  sudo certbot certificates | grep tinygeniushubvn
  ```
  **Expected Output:**
  ```
  Certificate Name: tinygeniushubvn.tech
    Domains: tinygeniushubvn.tech www.tinygeniushubvn.tech
    Expiry Date: 2026-07-04 (VALID: 89 days)
  ```

- [ ] **HTTPS endpoint accessible** 🔴
  ```bash
  curl -sf https://www.tinygeniushubvn.tech/api/health
  ```
  **Expected Output:**
  ```json
  {"status":"ok"}
  ```

- [ ] **SSL Labs Grade A+** 🟢
  ```bash
  # Run SSL Labs scan (manual check)
  # https://www.ssllabs.com/ssltest/analyze.html?d=tinygeniushubvn.tech
  # Expected: Grade A or A+
  ```

- [ ] **Auto-renewal configured** 🟡
  ```bash
  sudo certbot renew --dry-run
  ```
  **Expected Output:**
  ```
  Congratulations, all renewals succeeded.
  ```

### 🔴 DNS Verification ⏱️ 2 min

#### 3.4.1 DNS Configuration
- [ ] **A records point to VPS** 🔴
  ```bash
  dig +short tinygeniushubvn.tech
  ```
  **Expected Output:**
  ```
  123.456.789.012  # Your VPS IP
  ```

- [ ] **WWW CNAME or A record** 🟡
  ```bash
  dig +short www.tinygeniushubvn.tech
  ```
  **Expected Output:**
  ```
  tinygeniushubvn.tech.
  123.456.789.012
  ```

- [ ] **MX records (if email enabled)** 🟢
  ```bash
  dig +short MX tinygeniushubvn.tech
  ```

---

## Phase 4: Rollback Plan

### 🔴 Rollback Triggers

**IMMEDIATE ROLLBACK if any of these occur:**
- [ ] Database corruption detected
- [ ] API returning 500 errors > 5% of requests
- [ ] Data integrity check fails (video count != 20195)
- [ ] Health check fails for > 2 minutes
- [ ] SSL certificate errors
- [ ] Payment processing failures

### 🔴 Code Rollback

#### 4.1.1 Quick Rollback to Previous Version
- [ ] **Stop current application** 🔴
  ```bash
  cd /var/www/ccth
  pm2 stop ccth-web ccth-worker
  ```
  **Expected Output:**
  ```
  [PM2] Stopping ccth-web
  [PM2] Stopping ccth-worker
  ```

- [ ] **Checkout previous stable commit** 🔴
  ```bash
  # View recent commits
  git log --oneline -5
  
  # Checkout previous stable
  git checkout <stable-commit-hash>
  
  # Or if using tags
  git checkout v1.2.3
  ```
  **Expected Output:**
  ```
  Note: switching to '<commit-hash>'.
  HEAD is now at abc1234 Previous stable version
  ```

- [ ] **Reinstall dependencies (if needed)** 🔴
  ```bash
  pnpm install --frozen-lockfile
  ```

- [ ] **Rebuild application** 🔴 ⏱️ 3-5 min
  ```bash
  pnpm build
  ```

- [ ] **Restart application** 🔴
  ```bash
  pm2 start ecosystem.config.js
  pm2 save
  ```

- [ ] **Verify rollback** 🔴
  ```bash
  curl -f http://localhost:3000/api/health
  git log --oneline -1
  ```
  **Expected Output:**
  ```
  abc1234 Previous stable version
  ```

#### 4.1.2 Using PM2 for Zero-Downtime Rollback
- [ ] **PM2 zero-downtime reload** 🟡
  ```bash
  # After git checkout and rebuild
  pm2 reload ccth-web --update-env
  ```
  **Expected Output:**
  ```
  [PM2] Reloading ccth-web in 0s
  [PM2] Process successfully reloaded
  ```

### 🔴 Database Rollback

#### 4.2.1 Restore from Pre-Deployment Backup
- [ ] **Stop application** 🔴
  ```bash
  pm2 stop ccth-web ccth-worker
  ```

- [ ] **Restore database** 🔴 ⏱️ 5-10 min
  ```bash
  cd /var/www/ccth
  pnpm backup:restore -- --file=backups/postgres/pre_deploy_20260404_120000.dump
  ```
  **Expected Output:**
  ```
  Restoring backup: pre_deploy_20260404_120000.dump
  ✓ Database cleaned
  ✓ Schema restored
  ✓ Data restored: 20195 videos
  ✓ Indexes rebuilt
  Restore completed in 4m 30s
  ```

- [ ] **Verify restore** 🔴
  ```bash
  pnpm abeka:validate:db
  ```

- [ ] **Restart application** 🔴
  ```bash
  pm2 start ecosystem.config.js
  ```

#### 4.2.2 Restore from Offsite Backup (if local fails)
- [ ] **Download from R2** 🔴 ⏱️ 5-10 min (depends on size)
  ```bash
  pnpm backup:offsite:download -- --key=postgres/prod/pre_deploy_20260404_120000.dump
  ```
  **Expected Output:**
  ```
  Downloading: postgres/prod/pre_deploy_20260404_120000.dump
  ✓ Downloaded: 45MB in 2m 15s
  Saved to: backups/postgres/pre_deploy_20260404_120000.dump
  ```

- [ ] **Verify downloaded backup** 🔴
  ```bash
  pnpm backup:verify -- --file=backups/postgres/pre_deploy_20260404_120000.dump
  ```

- [ ] **Restore** 🔴
  ```bash
  pnpm backup:restore -- --file=backups/postgres/pre_deploy_20260404_120000.dump
  ```

#### 4.2.3 Selective Rollback (Abeka Only)
- [ ] **Truncate Abeka tables only** 🟡
  ```bash
  psql $DATABASE_URL -c "
    TRUNCATE TABLE 
      \"AbekaVideo\",
      \"AbekaLessonPackage\",
      \"AbekaLesson\",
      \"AbekaSubject\",
      \"AbekaGrade\"
    CASCADE;
  "
  ```
  **Expected Output:**
  ```
  TRUNCATE TABLE
  ```

- [ ] **Re-run import** 🔴 ⏱️ 10-15 min
  ```bash
  pnpm abeka:import:prod --reset --checkpoint=./checkpoints/import.chk
  ```

### 🔴 Complete Infrastructure Rollback

**Use if VPS is completely broken:**

#### 4.3.1 Migration to New VPS
- [ ] **Provision new VPS** 🔴 ⏱️ 10 min
  ```bash
  # Follow Phase 2.1 (VPS Setup) on new server
  bash scripts/vps-setup.sh
  ```

- [ ] **Download backup from offsite** 🔴 ⏱️ 5-10 min
  ```bash
  # On NEW VPS
  pnpm backup:offsite:download -- --key=postgres/prod/pre_deploy_20260404_120000.dump
  ```

- [ ] **Restore database on new VPS** 🔴 ⏱️ 5-10 min
  ```bash
  bash scripts/postgres-setup.sh
  pnpm backup:restore -- --file=backups/postgres/pre_deploy_20260404_120000.dump
  ```

- [ ] **Deploy code to new VPS** 🔴 ⏱️ 15 min
  ```bash
  bash scripts/deploy-initial.sh
  ```

- [ ] **Update DNS to new IP** 🔴
  ```bash
  # Update A record in DNS provider
  # Cloudflare/DigitalOcean/Route53/etc
  ```

- [ ] **Verify new server** 🔴
  ```bash
  curl -f https://www.tinygeniushubvn.tech/api/health
  ```

---

## 📊 Post-Deployment Checklist Summary

### Final Verification (Before Announcing)

- [ ] 🔴 All health checks passing
- [ ] 🔴 All 20195 videos imported and verified
- [ ] 🔴 SSL certificate valid
- [ ] 🔴 DNS resolving correctly
- [ ] 🟡 PM2 processes stable (uptime > 10 min)
- [ ] 🟡 No critical errors in logs
- [ ] 🟡 Backup created after import
- [ ] 🟢 Monitoring dashboards accessible
- [ ] 🟢 Documentation updated

### Communication

- [ ] 🟢 Notify team of successful deployment
- [ ] 🟢 Update status page (if applicable)
- [ ] 🟢 Send announcement to beta users
- [ ] 🟢 Update deployment log

---

## 🚨 Emergency Contacts & Resources

### Quick Commands Reference

```bash
# Health check
curl -f http://localhost:3000/api/health

# Full status
pm2 status && curl -f http://localhost:3000/api/health/ready

# Recent errors
tail -50 /var/log/ccth/web-error.log

# Database connection
psql $DATABASE_URL -c "SELECT 1;"

# Redis connection
redis-cli ping

# Quick restart
pm2 restart all

# Emergency rollback (code)
git checkout <stable-commit> && pnpm build && pm2 reload all

# Emergency rollback (database)
pm2 stop all && pnpm backup:restore -- --file=<backup-file> && pm2 start all
```

### File Locations

| File | Path |
|------|------|
| Environment | `/var/www/ccth/.env` |
| Logs | `/var/log/ccth/` |
| Backups | `/var/www/ccth/backups/postgres/` |
| Checkpoints | `/var/www/ccth/checkpoints/` |
| Abeka Data | `/var/www/abeka_data/` |
| PM2 Config | `/var/www/ccth/ecosystem.config.js` |
| Nginx Config | `/etc/nginx/sites-available/ccth` |
| PostgreSQL | `/var/lib/postgresql/15/main/` |

### Support Resources

- **Documentation:** `docs/ABEKA-IMPORT-SETUP-GUIDE.md`
- **VPS Guide:** `docs/deployment/VPS-DEPLOYMENT-GUIDE.md`
- **Backup Runbook:** `docs/deployment/backup-restore-runbook.md`
- **Business Plan:** `docs/MASTER-ABEKA-CURRICULUM-BUSINESS-PLAN.md`

---

## ✅ DEPLOYMENT COMPLETE

**Sign-off:**

| Role | Name | Signature | Date |
|------|------|-----------|------|
| DevOps Lead | _________ | _________ | _________ |
| Database Admin | _________ | _________ | _________ |
| QA Lead | _________ | _________ | _________ |
| Product Owner | _________ | _________ | _________ |

---

*Generated for TinyGenius Hub - Abeka Curriculum System*  
*Version: 1.0.0 | 2026-04-04*

---

## WS4 Mandatory Gate: Production Verification + Observability (2026-04-04)

Deployment is blocked unless this gate script passes both pre-deploy and post-deploy.

### Required Commands

```bash
# Pre-deploy gate (run on production host)
STAGE=pre-deploy \
BASE_URL="http://localhost:3000" \
ENV_FILE=".env" \
bash scripts/production/production-gate-check.sh

# Post-deploy gate (run immediately after deploy)
STAGE=post-deploy \
BASE_URL="http://localhost:3000" \
ENV_FILE=".env" \
bash scripts/production/production-gate-check.sh
```

### Gate Coverage (must pass)

- UI smoke: `/`, `/pricing`, `/courses`, `/try-garden`, `/admin/login`
- Core API health: `/api/health` payload must return `ok=true` and `status=ok`
- Package parity: `/api/abeka/packages` must match canonical 8 package codes
- Secrets readiness: required secrets must exist and no placeholder values
- Worker observability: detect restart storm from PM2 restart delta in short window

### Worker Restart Storm Tracking

- Default threshold: fail if restart delta `> 2` within `20s`
- Worker process name default: `tinygeniushub-worker`
- Override when needed:

```bash
bash scripts/production/production-gate-check.sh \
  --worker-name "<pm2-worker-name>" \
  --restart-window 30 \
  --max-restart-delta 1
```

### Secrets Readiness Rules

- Baseline required: `DATABASE_URL`, `SESSION_SECRET`, `BETTER_AUTH_SECRET`, `ADMIN_AUTH_SECRET`, `BETTER_AUTH_URL`, `BILLING_WEBHOOK_SECRET`, `CRON_SECRET`, `MOCK_UPLOAD_SIGNING_SECRET`, `REDIS_URL`
- Provider-conditional requirements:
- `BILLING_PROVIDER=stripe` -> `STRIPE_SECRET_KEY`
- `COURSE_PAYMENT_PROVIDER=payos` -> `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`
- `REPORT_EMAIL_PROVIDER=resend` -> `REPORT_EMAIL_RESEND_API_KEY`, `REPORT_EMAIL_FROM`
- `REPORT_EMAIL_PROVIDER=brevo` -> `REPORT_EMAIL_BREVO_API_KEY`, `REPORT_EMAIL_FROM`
- Placeholder values (`replace-with`, `change_me`, `example.com`, `todo`) are treated as fail.

### Deploy Decision Rule

- `FAIL > 0` from gate script: stop deploy or rollback.
- `FAIL = 0`: deployment gate passed.

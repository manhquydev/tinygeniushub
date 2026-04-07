# Abeka Curriculum Deployment - Execution Plan

> **Version:** 1.0.0  
> **Last Updated:** 2026-04-04  
> **Target:** Production Server (152.42.246.218 - DigitalOcean)  
> **Scope:** Deploy Abeka curriculum (20,195 videos, 8 CurriculumPackage) to production  
> **Estimated Duration:** 45-90 minutes  
> **Risk Level:** HIGH (database migration + large data import)

---

## Table of Contents

1. [Pre-Deployment Overview](#1-pre-deployment-overview)
2. [Phase 1: Pre-Deployment Checks](#2-phase-1-pre-deployment-checks)
3. [Phase 2: Backup & Safety](#3-phase-2-backup--safety)
4. [Phase 3: Code Deployment](#4-phase-3-code-deployment)
5. [Phase 4: Database Migration](#5-phase-4-database-migration)
6. [Phase 5: Curriculum Data Import](#6-phase-5-curriculum-data-import)
7. [Phase 6: Build & Restart](#7-phase-6-build--restart)
8. [Phase 7: Post-Deployment Verification](#8-phase-7-post-deployment-verification)
9. [Rollback Procedures](#9-rollback-procedures)
10. [Emergency Contacts](#10-emergency-contacts)

---

## 1. Pre-Deployment Overview

### System Context

| Component | Current State | Target State |
|-----------|---------------|--------------|
| **Server** | 152.42.246.218 (DigitalOcean) | Same |
| **App Path** | /var/www/cungcontuhoc | Same |
| **PM2 Process** | cungcontuhoc | Same |
| **Database** | PostgreSQL (Docker) | Same + Abeka tables |
| **Curriculum Data** | Existing 3 courses | 8 CurriculumPackage + 20,195 videos |

### Resource Requirements

| Resource | Available | Required | Status |
|----------|-----------|----------|--------|
| **RAM** | 4GB + 2GB Swap | ~3GB for build | ⚠️ Tight |
| **Disk** | Check below | ~500MB DB + code | ✅ OK |
| **Network** | Stable | For CDN verification | ✅ OK |

### Deployment Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT STRATEGY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. STOP PM2 App (free memory for build)                        │
│         ↓                                                       │
│  2. Git Pull + Install Dependencies                             │
│         ↓                                                       │
│  3. Database Backup                                             │
│         ↓                                                       │
│  4. Database Migration (Prisma)                                │
│         ↓                                                       │
│  5. Seed 8 CurriculumPackage                                     │
│         ↓                                                       │
│  6. Import Abeka Videos (20,195)                               │
│         ↓                                                       │
│  7. Build Application (Next.js)                                │
│         ↓                                                       │
│  8. Start PM2 App                                               │
│         ↓                                                       │
│  9. Verify Deployment                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Phase 1: Pre-Deployment Checks

### 2.1 SSH Connection Verification

**Command:**
```bash
# Test SSH connection
ssh -i ~/.ssh/your_key root@152.42.246.218 "echo 'SSH Connection OK'"
```

**Expected Output:**
```
SSH Connection OK
```

**If Failed:**
- Check SSH key permissions: `chmod 600 ~/.ssh/your_key`
- Verify firewall allows port 22
- Contact server admin

---

### 2.2 Disk Space Check

**Command:**
```bash
ssh root@152.42.246.218 "df -h /var/www && df -h /var/lib/docker"
```

**Expected Output:**
```
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda1        50G   15G   35G  30% /
```

**Requirements:**
- Minimum 5GB free for safe deployment
- 20,195 videos = ~40MB database records (metadata only)
- Build artifacts: ~500MB

**If Low Disk Space:**
```bash
# Clean up old logs
ssh root@152.42.246.218 "find /var/log -name '*.log' -mtime +7 -delete"

# Clean Docker
ssh root@152.42.246.218 "docker system prune -f"

# Check again
ssh root@152.42.246.218 "df -h"
```

---

### 2.3 Memory Check

**Command:**
```bash
ssh root@152.42.246.218 "free -h && swapon -s"
```

**Expected Output:**
```
              total        used        free      shared  buff/cache   available
Mem:           3.8G        1.2G        1.5G        100M        1.1G        2.2G
Swap:          2.0G        200M        1.8G
```

**Build Memory Requirements:**
- Next.js build: ~2-2.5GB RAM
- With 4GB RAM + 2GB Swap: ✅ Safe

**Monitor During Build:**
```bash
# In separate terminal, watch memory
ssh root@152.42.246.218 "watch -n 2 'free -h'"
```

---

### 2.4 Current Process Status

**Command:**
```bash
ssh root@152.42.246.218 "pm2 list && pm2 describe cungcontuhoc-web"
```

**Expected Output:**
```
┌─────┬────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name                   │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ cungcontuhoc-web       │ default     │ 0.1.0   │ fork    │ 12345    │ 2D     │ 0    │ online    │ 0.2%     │ 85.4mb   │ root     │ disabled │
│ 1   │ cungcontuhoc-worker    │ default     │ 0.1.0   │ fork    │ 12346    │ 2D     │ 0    │ online    │ 0.1%     │ 45.2mb   │ root     │ disabled │
└─────┴────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

---

### 2.5 Database Connectivity Check

**Command:**
```bash
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && docker exec postgres psql -U cungcontuhoc -d cungcontuhoc -c 'SELECT version();'"
```

**Expected Output:**
```
                                                              version                                                               
───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 PostgreSQL 16.x on x86_64-pc-linux-gnu, compiled by gcc (Debian 10.2.1-6) 10.2.1 20210110, 64-bit
(1 row)
```

---

## 3. Phase 2: Backup & Safety

### 3.1 Create Database Backup

**⚠️ CRITICAL: Must complete before any migration**

**Command:**
```bash
# SSH into server
ssh root@152.42.246.218

# Create backup directory
cd /var/www/cungcontuhoc
mkdir -p backups/$(date +%Y%m%d)

# Backup database
docker exec postgres pg_dump -U cungcontuhoc -d cungcontuhoc \
  --verbose --no-owner --no-acl \
  --format=custom \
  -f /backups/cungcontuhoc-$(date +%Y%m%d-%H%M%S).dump

# Or use the built-in backup script
pnpm backup:create
```

**Expected Output:**
```
Creating backup: backups/20260404-143022.dump
Backup completed: 45.2 MB
Backup verified: ✓
```

**Verify Backup:**
```bash
# List backup files
ls -lh /var/www/cungcontuhoc/backups/

# Check file size (should be > 10MB)
du -h /var/www/cungcontuhoc/backups/*.dump | head -1
```

---

### 3.2 Save Git Commit Hash

**Command:**
```bash
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && git rev-parse HEAD > .pre-deploy-commit && cat .pre-deploy-commit"
```

**Expected Output:**
```
abc123def456789abcdef123456789abcdef123456
```

**For Rollback:**
```bash
# Save the commit hash for potential rollback
export ROLLBACK_COMMIT=$(cat .pre-deploy-commit)
echo "Rollback commit saved: $ROLLBACK_COMMIT"
```

---

### 3.3 Export Current Curriculum Data (Optional)

**Command:**
```bash
# If you want to preserve current curriculum data
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && \
  docker exec postgres psql -U cungcontuhoc -d cungcontuhoc -c \"COPY (SELECT * FROM \"Course\") TO STDOUT WITH CSV HEADER\" > /tmp/courses-backup.csv"
```

---

## 4. Phase 3: Code Deployment

### 4.1 Stop PM2 Processes (Memory-Safe Approach)

**⚠️ WARNING: This will cause temporary downtime (~10-30 minutes)**

**Command:**
```bash
ssh root@152.42.246.218 "pm2 stop all && pm2 save"
```

**Expected Output:**
```
[PM2] Applying action stopProcessId on app [all](ids: [ 0, 1 ])
[PM2] [cungcontuhoc-web](0) ✓
[PM2] [cungcontuhoc-worker](1) ✓
┌─────┬────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name                   │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ cungcontuhoc-web       │ default     │ 0.1.0   │ fork    │ N/A      │ 0s     │ 0    │ stopped   │ 0%       │ 0b       │ root     │ disabled │
│ 1   │ cungcontuhoc-worker    │ default     │ 0.1.0   │ fork    │ N/A      │ 0s     │ 0    │ stopped   │ 0%       │ 0b       │ root     │ disabled │
└─────┴────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

---

### 4.2 Git Pull Latest Code

**Command:**
```bash
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && git status && git pull origin main"
```

**Expected Output:**
```
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean
remote: Enumerating objects: 45, done.
remote: Counting objects: 100% (45/45), done.
remote: Compressing objects: 100% (23/23), done.
remote: Total 45 (delta 28), reused 42 (delta 26)
Unpacking objects: 100% (45/45), 12.34 KiB | 2.45 MiB/s, done.
From https://github.com/manhquydev/cungcontuhoc
   abc1234..def5678  main       -> origin/main
Updating abc1234..def5678
Fast-forward
 12 files changed, 450 insertions(+), 23 deletions(-)
 create mode 100644 prisma/migrations/20260404_add_abeka_tables/migration.sql
 create mode 100644 prisma/seeders/curriculum-packages.ts
```

**If Merge Conflicts:**
```bash
# Reset and pull fresh
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && git reset --hard HEAD && git pull origin main"
```

---

### 4.3 Install Dependencies

**Command:**
```bash
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && pnpm install --frozen-lockfile"
```

**Expected Output:**
```
Lockfile is up to date, resolution step is skipped
Already up to date
Done in 12.4s
```

**If Lockfile Issues:**
```bash
# Remove and reinstall
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && rm -rf node_modules pnpm-lock.yaml && pnpm install"
```

---

## 5. Phase 4: Database Migration

### 5.1 Generate Prisma Client

**Command:**
```bash
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && pnpm db:generate"
```

**Expected Output:**
```
Environment variables loaded from .env
Prisma Client generated (version: 6.16.0)
✓ Generated Prisma Client for PostgreSQL
```

---

### 5.2 Deploy Database Migration

**⚠️ CRITICAL: This modifies the database schema**

**Command:**
```bash
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && pnpm prisma migrate deploy"
```

**Expected Output:**
```
Environment variables loaded from .env
Prisma Migrate found the following migration(s) to apply:
  - 20260404_add_abeka_tables

Applying migration(s)...
The following migration(s) have been applied:
  - 20260404_add_abeka_tables

Applied migration(s) successfully
```

**If Migration Fails:**
```bash
# Check migration status
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && pnpm prisma migrate status"

# If needed, resolve manually
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && pnpm prisma migrate resolve --applied 20260404_add_abeka_tables"
```

---

### 5.3 Verify Migration

**Command:**
```bash
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && \
  docker exec postgres psql -U cungcontuhoc -d cungcontuhoc -c \"\\dt \"Abeka*\"\""
```

**Expected Output:**
```
                 List of relations
 Schema |         Name         | Type  |  Owner
────────┼──────────────────────┼───────┼───────────
 public | AbekaGrade           | table | cungcontuhoc
 public | AbekaLesson          | table | cungcontuhoc
 public | AbekaLessonPackage   | table | cungcontuhoc
 public | AbekaSubject         | table | cungcontuhoc
 public | AbekaVideo           | table | cungcontuhoc
(5 rows)
```

---

## 6. Phase 5: Curriculum Data Import

### 6.1 Seed 8 CurriculumPackage

**Command:**
```bash
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && pnpm db:seed:packages"
```

**Expected Output:**
```
Seeding Curriculum Packages...
✓ PRESCHOOL_PREMIUM (Mầm Non PREMIUM) - 680 videos
✓ ELEMENTARY_PRO (Tiểu Học PRO) - 2,550 videos
✓ MIDDLE_ADVANCED (Trung Học ADVANCED) - 2,040 videos
✓ HIGH_ELITE (THPT ELITE) - 1,530 videos
✓ ENGLISH_MASTER (Tiếng Anh MASTER) - 1,190 videos
✓ MATH_THINKING (Toán Tư Duy MATH) - 1,700 videos
✓ STEM_INNOVATOR (STEM INNOVATOR) - 2,040 videos
✓ ULTIMATE (K4-G12) - 8,500 videos

8 CurriculumPackage seeded successfully
```

**Verify:**
```bash
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && \
  docker exec postgres psql -U cungcontuhoc -d cungcontuhoc -c 'SELECT code, name, \"videoCount\", \"monthlyPrice\", \"yearlyPrice\" FROM \"CurriculumPackage\" ORDER BY \"displayOrder\";'"
```

---

### 6.1.1 Canonical Parity Check (Mandatory)

Run after `pnpm db:seed:packages` and again after import:

```bash
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && \
  docker exec postgres psql -U cungcontuhoc -d cungcontuhoc << 'SQL'
WITH canonical(code, \"videoCount\", \"monthlyPrice\", \"yearlyPrice\", \"displayOrder\") AS (
  VALUES
    ('PRESCHOOL_PREMIUM', 680, 199000, 1990000, 1),
    ('ELEMENTARY_PRO', 2550, 349000, 3490000, 2),
    ('MIDDLE_ADVANCED', 2040, 349000, 3490000, 3),
    ('HIGH_ELITE', 1530, 449000, 4490000, 4),
    ('ENGLISH_MASTER', 1190, 249000, 2490000, 5),
    ('MATH_THINKING', 1700, 199000, 1990000, 6),
    ('STEM_INNOVATOR', 2040, 299000, 2990000, 7),
    ('ULTIMATE', 8500, 699000, 6990000, 8)
)
SELECT c.code
FROM canonical c
LEFT JOIN \"CurriculumPackage\" p ON p.code = c.code
WHERE p.code IS NULL
   OR p.\"videoCount\" <> c.\"videoCount\"
   OR p.\"monthlyPrice\" <> c.\"monthlyPrice\"
   OR p.\"yearlyPrice\" <> c.\"yearlyPrice\"
   OR p.\"displayOrder\" <> c.\"displayOrder\";
SQL"
```

Expected: no rows.

---

### 6.2 Import Abeka Videos (20,195)

**⚠️ WARNING: This takes 30-60 minutes**

**Option A: Full Import (Recommended for production)**
```bash
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && \
  pnpm abeka:import:prod --verbose --checkpoint=./checkpoints/abeka-import.chk"
```

**Option B: Resume Import (if interrupted)**
```bash
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && \
  pnpm abeka:import:resume --checkpoint=./checkpoints/abeka-import.chk"
```

**Option C: Grade-by-Grade (if memory constrained)**
```bash
# Import one grade at a time
for grade in 0 1 2 3 4 5 6 7 8 9 10 11 12 13; do
  echo "Importing grade $grade..."
  ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && \
    pnpm abeka:import:grade --grade=$grade --verbose"
done
```

**Expected Output (Full Import):**
```
╔════════════════════════════════════════════════════════╗
║     ABEKA CURRICULUM IMPORT - PRODUCTION MODE          ║
╚════════════════════════════════════════════════════════╝

🔍 Validating preconditions...
✅ Data path accessible: /var/www/cungcontuhoc/data/abeka
✅ Database connection OK

📋 Configuration:
   Mode: PRODUCTION
   Batch Size: 100
   Rate Limit: 10ms
   Max Retries: 3
   CDN Verify: NO
   Checkpoint: ./checkpoints/abeka-import.chk
   Resume: NO

📚 Starting full curriculum import (K4-12)...
   Expected: 20,195 videos

Grade K4: 1,420 videos ✓
Grade K5: 1,580 videos ✓
Grade 1: 1,890 videos ✓
Grade 2: 2,100 videos ✓
Grade 3: 2,340 videos ✓
Grade 4: 2,150 videos ✓
Grade 5: 2,020 videos ✓
Grade 6: 1,890 videos ✓
Grade 7: 1,750 videos ✓
Grade 8: 1,620 videos ✓
Grade 9: 1,480 videos ✓
Grade 10: 1,390 videos ✓
Grade 11: 1,265 videos ✓
Grade 12: 1,280 videos ✓

═══════════════════════════════════════════════════════════
                  IMPORT SUMMARY
═══════════════════════════════════════════════════════════
Total Videos:            20,195
Created:                 20,195
Updated:                      0
Skipped:                      0
Grades Processed:            14
Lessons Processed:        2,847
Duration:               1845.32s
Status:               COMPLETED
──────────────────────────────────────────────────────────
Errors:                       0
  Critical:                   0
  Warnings:                   0
═══════════════════════════════════════════════════════════

📊 Verification: 20,195 videos in database
   ✅ Within expected range (95%+ of 20,195)

📌 Next Steps:
   • Verify import: pnpm abeka:validate
   • Create backup: pnpm backup:create
```

---

### 6.3 Validate Import

**Command:**
```bash
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && pnpm abeka:validate:db"
```

**Expected Output:**
```
Abeka Import Validation
========================

Database Verification:
  Total videos in DB: 20,195
  Expected: 20,195
  Match: ✅ 100%

Grade Distribution:
  K4: 1,420 ✅
  K5: 1,580 ✅
  G1: 1,890 ✅
  G2: 2,100 ✅
  G3: 2,340 ✅
  G4: 2,150 ✅
  G5: 2,020 ✅
  G6: 1,890 ✅
  G7: 1,750 ✅
  G8: 1,620 ✅
  G9: 1,480 ✅
  G10: 1,390 ✅
  G11: 1,265 ✅
  G12: 1,280 ✅

Validation: PASSED ✅
```

---

## 7. Phase 6: Build & Restart

### 7.1 Monitor Memory During Build

**In a separate terminal, run:**
```bash
ssh root@152.42.246.218 "watch -n 5 'free -h && echo \"---\" && swapon -s'"
```

**Keep this running during the build phase.**

---

### 7.2 Build Application

**Command:**
```bash
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && NODE_ENV=production pnpm build"
```

**Expected Output:**
```
> next build

   ▲ Next.js 16.1.7
   - Environments: .env.production.local, .env.production, .env.local, .env

 ✓ Linting and checking validity of types
   Creating an optimized production build ...
 ✓ Compiled successfully in 145.23s
 ✓ Collecting page data  
 ✓ Generating static pages (42/42)
 ✓ Finalizing page optimization  

Route (app)                              Size     First Load JS
┌ ○ /                                    12.4 kB         145 kB
├ ○ /about                               3.2 kB         128 kB
├ ○ /admin                               4.5 kB         132 kB
├ λ /api/...                             0 B            0 B
├ ...
└ ○ /packages                            5.6 kB         138 kB

○  (Static)  prerendered as static HTML
λ  (Server)  server-side renders at runtime

Build completed in 189.45s
```

**If Build Fails (OOM):**
```bash
# Increase swap temporarily
ssh root@152.42.246.218 "fallocate -l 4G /swapfile2 && chmod 600 /swapfile2 && mkswap /swapfile2 && swapon /swapfile2"

# Retry build
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && NODE_ENV=production pnpm build"

# Remove temporary swap after
ssh root@152.42.246.218 "swapoff /swapfile2 && rm /swapfile2"
```

---

### 7.3 Start PM2 Processes

**Command:**
```bash
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && pm2 start ecosystem.config.js --env production"
```

**Expected Output:**
```
[PM2] Starting /var/www/cungcontuhoc/node_modules/.bin/next in fork_mode (1 instance)
[PM2] Done.
┌─────┬────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name                   │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ cungcontuhoc-web       │ default     │ 0.2.0   │ fork    │ 23456    │ 3s     │ 0    │ online    │ 12%      │ 145.2mb  │ root     │ disabled │
│ 1   │ cungcontuhoc-worker    │ default     │ 0.2.0   │ fork    │ 23457    │ 3s     │ 0    │ online    │ 5%       │ 68.4mb   │ root     │ disabled │
└─────┴────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

---

### 7.4 Save PM2 Configuration

**Command:**
```bash
ssh root@152.42.246.218 "pm2 save"
```

**Expected Output:**
```
[PM2] Saving current process list...
[PM2] Successfully saved in /root/.pm2/dump.pm2
```

---

## 8. Phase 7: Post-Deployment Verification

### 8.1 Health Check

**Command:**
```bash
# Check application health
curl -s http://152.42.246.218:3000/api/health | jq .
```

**Expected Output:**
```json
{
  "status": "healthy",
  "timestamp": "2026-04-04T14:45:22.123Z",
  "version": "0.2.0",
  "checks": {
    "database": "connected",
    "redis": "connected",
    "disk": "ok"
  }
}
```

---

### 8.2 Verify Curriculum API

**Command:**
```bash
# Check curriculum packages
curl -s http://152.42.246.218:3000/api/curriculum/packages | jq '.packages | length'

# Check video count
curl -s http://152.42.246.218:3000/api/curriculum/stats | jq '.totalVideos'
```

**Expected Output:**
```
8
20195
```

---

### 8.3 Check Logs

**Command:**
```bash
ssh root@152.42.246.218 "pm2 logs cungcontuhoc-web --lines 20"
```

**Expected Output:**
```
2026-04-04 14:45:22: Ready on http://0.0.0.0:3000
2026-04-04 14:45:23: Database connected
2026-04-04 14:45:24: Curriculum packages loaded: 8
2026-04-04 14:45:25: Abeka videos indexed: 20195
```

---

### 8.4 Smoke Test (via Browser/Playwright)

**Manual Check:**
1. Open http://152.42.246.218:3000
2. Navigate to /packages
3. Verify 8 packages displayed
4. Click a package, verify videos load

**Automated:**
```bash
# Run E2E smoke test
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && pnpm test:e2e"
```

---

### 8.5 Create Post-Deployment Backup

**Command:**
```bash
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && pnpm backup:create"
```

---

## 9. Rollback Procedures

### 9.1 Quick Rollback (Emergency)

**If deployment fails catastrophically:**

```bash
# 1. Stop application
ssh root@152.42.246.218 "pm2 stop all"

# 2. Restore database from backup
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && \
  docker exec -i postgres pg_restore -U cungcontuhoc -d cungcontuhoc --clean --if-exists < \
  backups/20260404-143022.dump"

# 3. Revert code
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && \
  git reset --hard $(cat .pre-deploy-commit)"

# 4. Reinstall dependencies
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && pnpm install"

# 5. Rebuild
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && pnpm build"

# 6. Start application
ssh root@152.42.246.218 "pm2 start all"
```

---

### 9.2 Database-Only Rollback

**If only database migration failed:**

```bash
# Restore database only
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && \
  docker exec -i postgres pg_restore -U cungcontuhoc -d cungcontuhoc --clean --if-exists < \
  backups/20260404-143022.dump"

# Reset migration status
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && \
  pnpm prisma migrate resolve --rolled-back 20260404_add_abeka_tables"
```

---

### 9.3 Partial Rollback (Keep New Code)

**If import failed but code is OK:**

```bash
# Clear Abeka data only
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && \
  docker exec postgres psql -U cungcontuhoc -d cungcontuhoc -c \"DELETE FROM \\\"AbekaVideo\\\"; DELETE FROM \\\"AbekaLessonPackage\\\"; DELETE FROM \\\"AbekaLesson\\\"; DELETE FROM \\\"AbekaSubject\\\"; DELETE FROM \\\"AbekaGrade\\\"; DELETE FROM \\\"CurriculumPackage\\\";\""

# Rebuild and restart
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && pnpm build && pm2 reload all"
```

---

### 9.4 Verification After Rollback

```bash
# Check database is back to pre-deploy state
ssh root@152.42.246.218 "cd /var/www/cungcontuhoc && \
  docker exec postgres psql -U cungcontuhoc -d cungcontuhoc -c \"SELECT COUNT(*) FROM \\\"AbekaVideo\\\";\""

# Should return 0

# Check application is running
ssh root@152.42.246.218 "pm2 list"

# Check health endpoint
curl -s http://152.42.246.218:3000/api/health | jq '.status'
```

---

## 10. Emergency Contacts

| Role | Contact | When to Contact |
|------|---------|-----------------|
| **Tech Lead** | @manhquydev | Database corruption, total failure |
| **DevOps** | Server Admin | Server issues, Docker problems |
| **Database** | DBA | Migration failures, data loss |

---

## Appendix A: Quick Command Reference

```bash
# Full deployment (all phases)
ssh root@152.42.246.218 << 'EOF'
cd /var/www/cungcontuhoc

# Pre-checks
free -h && df -h

# Backup
pnpm backup:create
git rev-parse HEAD > .pre-deploy-commit

# Stop app
pm2 stop all

# Deploy code
git pull origin main
pnpm install --frozen-lockfile

# Database
pnpm db:generate
pnpm prisma migrate deploy

# Data
pnpm db:seed:packages
pnpm abeka:import:prod --verbose --checkpoint=./checkpoints/abeka-import.chk
pnpm abeka:validate:db

# Build
NODE_ENV=production pnpm build

# Start
pm2 start ecosystem.config.js --env production
pm2 save

# Verify
curl -s http://localhost:3000/api/health
echo "Deployment complete!"
EOF
```

---

## Appendix B: Monitoring During Deployment

```bash
# Terminal 1: Memory monitoring
ssh root@152.42.246.218 "watch -n 5 'free -h; echo; swapon -s'"

# Terminal 2: PM2 status
ssh root@152.42.246.218 "watch -n 2 'pm2 list'"

# Terminal 3: Database logs (if needed)
ssh root@152.42.246.218 "docker logs postgres -f"

# Terminal 4: Application logs
ssh root@152.42.246.218 "pm2 logs --lines 0 -f"
```

---

## Appendix C: Troubleshooting

### Build Fails with OOM
```bash
# Add temporary swap
fallocate -l 4G /tmp/swapfile && chmod 600 /tmp/swapfile && mkswap /tmp/swapfile && swapon /tmp/swapfile
# ...build...
swapoff /tmp/swapfile && rm /tmp/swapfile
```

### Database Connection Refused
```bash
# Check Docker container
docker ps | grep postgres
docker logs postgres

# Restart if needed
docker restart postgres
sleep 5
docker exec postgres pg_isready
```

### Import Interrupted
```bash
# Resume from checkpoint
pnpm abeka:import:resume --checkpoint=./checkpoints/abeka-import.chk
```

### PM2 Won't Start
```bash
# Clear PM2 logs and state
pm2 flush
pm2 delete all
pm2 start ecosystem.config.js --env production
```

---

**End of Deployment Execution Plan**

> **Remember:** Always test rollback procedures in staging first!

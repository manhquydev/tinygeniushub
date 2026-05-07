# Production Database Migration Commands

**Migration:** Old Curriculum → Abeka 20,195 Videos  
**Server:** DigitalOcean Production  
**Date:** April 2026  
**Downtime:** Zero (rolling migration)  
**Estimated Duration:** 45-90 minutes

---

## Quick Navigation

| Section | Description |
|---------|-------------|
| [Phase 0: Pre-Flight](#phase-0-pre-flight-checks) | SSH, backup, verify |
| [Phase 1: Backup](#phase-1-backup-existing-data) | Create full backup |
| [Phase 2: Check Data](#phase-2-check-existing-data) | Query current state |
| [Phase 3: Truncate](#phase-3-truncate-old-curriculum) | Remove old data |
| [Phase 4: Migrate](#phase-4-run-migrations) | Deploy schema |
| [Phase 5: Seed Packages](#phase-5-seed-packages) | 8 curriculum packages |
| [Phase 6: Import](#phase-6-import-abeka-videos) | 20,195 videos |
| [Phase 7: Verify](#phase-7-verify-migration) | Validate counts |
| [Rollback](#rollback-plan) | Emergency restore |

---

## Phase 0: Pre-Flight Checks

### 0.1 SSH Connection Test

```bash
# Test SSH connection (replace with your server IP)
ssh do-server "echo 'SSH OK'"

# Expected output:
# SSH OK
```

### 0.2 Check Server Resources

```bash
# SSH into server and check resources
ssh do-server << 'EOF'
  echo "=== DISK SPACE ==="
  df -h | grep -E '(Filesystem|/dev/vda1|/dev/sda1)'
  
  echo ""
  echo "=== MEMORY ==="
  free -h | grep -E '(Mem|Swap)'
  
  echo ""
  echo "=== PM2 STATUS ==="
  pm2 status
  
  echo ""
  echo "=== DOCKER STATUS ==="
  docker ps --format "table {{.Names}}\t{{.Status}}"
EOF
```

**Expected Output:**
```
=== DISK SPACE ===
Filesystem      Size  Used Avail Use% Mounted on
/dev/vda1        80G   45G   35G  57% /

=== MEMORY ===
              total        used        free      shared  buff/cache   available
Mem:           4Gi       2.5Gi       500Mi       100Mi       1.2Gi       1.8Gi
Swap:          1Gi       100Mi       900Mi

=== PM2 STATUS ===
┌────┬─────────────────────────┬─────────┬──────┬───────────┬────────┐
│ id │ name                    │ mode    │ ↺    │ status    │ cpu    │
├────┼─────────────────────────┼─────────┼──────┼───────────┼────────┤
│ 0  │ tinygeniushub-web        │ fork    │ 0    │ online    │ 5%     │
│ 1  │ tinygeniushub-worker     │ fork    │ 0    │ online    │ 2%     │
└────┴─────────────────────────┴─────────┴──────┴───────────┴────────┘

=== DOCKER STATUS ===
NAMES               STATUS
postgres            Up 3 days
redis               Up 3 days
```

### 0.3 Check Application Health

```bash
# Health check
ssh do-server "curl -s http://localhost:3000/api/health | jq ."

# Ready check
ssh do-server "curl -s http://localhost:3000/api/health/ready | jq ."
```

**Expected Output:**
```json
{
  "status": "healthy",
  "timestamp": "2026-04-04T10:00:00.000Z",
  "version": "1.0.0"
}
```

---

## Phase 1: Backup Existing Data

### 1.1 Create Full Database Backup

```bash
# SSH into server and create backup
ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  
  # Create backup with timestamp
  pnpm backup:create
  
  # Or create with offsite upload (R2)
  # pnpm backup:create -- --offsite
  
  # Or create with Google Drive upload
  # pnpm backup:create -- --gdrive
EOF
```

**Expected Output:**
```
🔄 Creating database backup...
📦 Backup created: backups/postgres/tinygeniushub_20260404_120000.dump
✅ Size: 145MB
📤 Uploading to offsite storage...
✅ Upload complete
```

### 1.2 Manual PostgreSQL Backup (Alternative)

```bash
# Manual backup with custom format (faster restore)
ssh do-server << 'EOF'
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  docker exec postgres pg_dump \
    -U postgres \
    -d tinygeniushub \
    -F custom \
    -f /tmp/backup_pre_abeka_${TIMESTAMP}.dump
  
  # Copy to backups directory
  docker cp postgres:/tmp/backup_pre_abeka_${TIMESTAMP}.dump \
    /var/www/tinygeniushub/backups/postgres/
  
  echo "Backup created: backup_pre_abeka_${TIMESTAMP}.dump"
EOF
```

### 1.3 Backup Specific Abeka Tables Only

```bash
# Backup only Abeka-related tables
ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_DIR="./backups/pre-migration-${TIMESTAMP}"
  
  mkdir -p ${BACKUP_DIR}
  
  # Backup tables individually
  docker exec postgres pg_dump \
    -U postgres \
    -d tinygeniushub \
    --data-only \
    --table="AbekaVideo" \
    > ${BACKUP_DIR}/01_abeka_videos.sql
  
  docker exec postgres pg_dump \
    -U postgres \
    -d tinygeniushub \
    --data-only \
    --table="AbekaLesson" \
    > ${BACKUP_DIR}/02_abeka_lessons.sql
  
  docker exec postgres pg_dump \
    -U postgres \
    -d tinygeniushub \
    --data-only \
    --table="AbekaSubject" \
    > ${BACKUP_DIR}/03_abeka_subjects.sql
  
  docker exec postgres pg_dump \
    -U postgres \
    -d tinygeniushub \
    --data-only \
    --table="AbekaGrade" \
    > ${BACKUP_DIR}/04_abeka_grades.sql
  
  docker exec postgres pg_dump \
    -U postgres \
    -d tinygeniushub \
    --data-only \
    --table="CurriculumPackage" \
    > ${BACKUP_DIR}/05_curriculum_packages.sql
  
  # Create tar archive
  tar -czf ${BACKUP_DIR}.tar.gz ${BACKUP_DIR}
  
  echo "✅ Tables backed up to: ${BACKUP_DIR}.tar.gz"
  ls -lh ${BACKUP_DIR}.tar.gz
EOF
```

### 1.4 Verify Backup Created

```bash
# List backups
ssh do-server "ls -lht /var/www/tinygeniushub/backups/postgres/ | head -10"

# Verify backup integrity
ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  LATEST=$(ls -t backups/postgres/*.dump | head -1)
  pnpm backup:verify -- --file=${LATEST}
EOF
```

**Expected Output:**
```
total 150M
-rw-r--r-- 1 deploy deploy 145M Apr  4 12:00 tinygeniushub_20260404_120000.dump
-rw-r--r-- 1 deploy deploy 140M Apr  3 12:00 tinygeniushub_20260403_120000.dump

🔍 Verifying backup: backups/postgres/tinygeniushub_20260404_120000.dump
✅ Backup format: Custom
✅ Tables found: 25
✅ Data integrity: OK
✅ Backup is valid and restorable
```

---

## Phase 2: Check Existing Data

### 2.1 Check Current Abeka Data Counts

```bash
# Query current table counts
ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  
  docker exec postgres psql -U postgres -d tinygeniushub << 'SQL'
    \echo '╔═══════════════════════════════════════════════════════════╗'
    \echo '║         CURRENT DATABASE STATE - PRE-MIGRATION            ║'
    \echo '╚═══════════════════════════════════════════════════════════╝'
    \echo ''
    
    SELECT 
      'AbekaVideo' as "Table",
      COUNT(*)::text as "Count"
    FROM "AbekaVideo"
    UNION ALL
    SELECT 
      'AbekaLesson',
      COUNT(*)::text
    FROM "AbekaLesson"
    UNION ALL
    SELECT 
      'AbekaLessonPackage',
      COUNT(*)::text
    FROM "AbekaLessonPackage"
    UNION ALL
    SELECT 
      'AbekaSubject',
      COUNT(*)::text
    FROM "AbekaSubject"
    UNION ALL
    SELECT 
      'AbekaGrade',
      COUNT(*)::text
    FROM "AbekaGrade"
    UNION ALL
    SELECT 
      'CurriculumPackage',
      COUNT(*)::text
    FROM "CurriculumPackage"
    UNION ALL
    SELECT 
      'PackageSubscription',
      COUNT(*)::text
    FROM "PackageSubscription";
SQL
EOF
```

**Expected Output (Old Data):**
```
╔═══════════════════════════════════════════════════════════╗
║         CURRENT DATABASE STATE - PRE-MIGRATION            ║
╚═══════════════════════════════════════════════════════════╝

Table                  | Count
-----------------------+-------
AbekaVideo             | 5,432
AbekaLesson            | 680
AbekaLessonPackage     | 2,150
AbekaSubject           | 45
AbekaGrade             | 14
CurriculumPackage      | 0
PackageSubscription    | 0
```

### 2.2 Check Critical User Data (MUST PRESERVE)

```bash
# Verify user data that MUST be preserved
ssh do-server << 'EOF'
  docker exec postgres psql -U postgres -d tinygeniushub << 'SQL'
    \echo '╔═══════════════════════════════════════════════════════════╗'
    \echo '║           CRITICAL USER DATA (PRESERVE THESE)             ║'
    \echo '╚═══════════════════════════════════════════════════════════╝'
    \echo ''
    
    SELECT 
      'Parent' as "Table",
      COUNT(*)::text as "Count"
    FROM "Parent"
    UNION ALL
    SELECT 
      'Child',
      COUNT(*)::text
    FROM "Child"
    UNION ALL
    SELECT 
      'PaymentTransaction',
      COUNT(*)::text
    FROM "PaymentTransaction"
    UNION ALL
    SELECT 
      'WebhookEvent',
      COUNT(*)::text
    FROM "WebhookEvent"
    UNION ALL
    SELECT 
      'CourseEnrollment',
      COUNT(*)::text
    FROM "CourseEnrollment"
    UNION ALL
    SELECT 
      'Lesson',
      COUNT(*)::text
    FROM "Lesson";
SQL
EOF
```

**Expected Output:**
```
╔═══════════════════════════════════════════════════════════╗
║           CRITICAL USER DATA (PRESERVE THESE)             ║
╚═══════════════════════════════════════════════════════════╝

Table                  | Count
-----------------------+-------
Parent                 | 1,250
Child                  | 2,100
PaymentTransaction     | 3,450
WebhookEvent           | 8,900
CourseEnrollment       | 1,800
Lesson                 | 85
```

### 2.3 Check for Active Subscriptions

```bash
# Check if any active curriculum subscriptions exist
ssh do-server << 'EOF'
  docker exec postgres psql -U postgres -d tinygeniushub << 'SQL'
    \echo '╔═══════════════════════════════════════════════════════════╗'
    \echo '║           ACTIVE SUBSCRIPTIONS CHECK                      ║'
    \echo '╚═══════════════════════════════════════════════════════════╝'
    \echo ''
    
    SELECT 
      ps.id,
      p.email as "Parent Email",
      c.name as "Child Name",
      ps.status,
      ps."startDate",
      ps."endDate"
    FROM "PackageSubscription" ps
    JOIN "Child" c ON c.id = ps."childId"
    JOIN "Parent" p ON p.id = c."parentId"
    WHERE ps.status = 'active'
      AND ps."endDate" > NOW()
    ORDER BY ps."startDate" DESC
    LIMIT 10;
    
    \echo ''
    \echo 'Total active subscriptions:'
    SELECT COUNT(*) as count FROM "PackageSubscription" 
    WHERE status = 'active' AND "endDate" > NOW();
SQL
EOF
```

**Expected Output:**
```
╔═══════════════════════════════════════════════════════════╗
║           ACTIVE SUBSCRIPTIONS CHECK                      ║
╚═══════════════════════════════════════════════════════════╝

 id | Parent Email              | Child Name | status | startDate  | endDate
----+---------------------------+------------+--------+------------+------------
(0 rows)

Total active subscriptions:
 count
-------
     0
```

---

## Phase 3: Truncate Old Curriculum

### 3.1 Stop Application (Zero-Downtime Alternative Below)

```bash
# Option A: Full stop (downtime ~5 minutes)
ssh do-server "pm2 stop tinygeniushub-web && pm2 stop tinygeniushub-worker"

# Verify stopped
ssh do-server "pm2 status"
```

**Zero-Downtime Alternative:** Keep app running, use transactions

### 3.2 Truncate Abeka Tables (Safe Approach)

```bash
# Truncate old Abeka data (keep reference tables like AbekaGrade)
ssh do-server << 'EOF'
  docker exec postgres psql -U postgres -d tinygeniushub << 'SQL'
    \echo '╔═══════════════════════════════════════════════════════════╗'
    \echo '║           TRUNCATING OLD ABEKA DATA                       ║'
    \echo '╚═══════════════════════════════════════════════════════════╝'
    \echo ''
    
    -- Start transaction
    BEGIN;
    
    -- Truncate data tables (CASCADE handles FK constraints)
    TRUNCATE TABLE 
      "AbekaVideo",
      "AbekaLessonPackage",
      "AbekaLesson",
      "AbekaSubject",
      "AbekaLearningJourney",
      "AbekaWeeklyPlan",
      "AbekaDailyPlan",
      "AbekaAssignment",
      "AbekaWatchProgress",
      "ChildGradeProgress",
      "AbekaSkillNode",
      "AbekaSkillPrerequisite",
      "ChildSkillProgress",
      "AbekaBadge",
      "ChildEarnedBadge",
      "AbekaParentPreferences",
      "AbekaStreak",
      "PackageSubscription",
      "CurriculumPackage"
    CASCADE;
    
    -- Keep AbekaGrade as reference data (optional)
    -- If you want to reset grades too, uncomment:
    -- TRUNCATE "AbekaGrade" CASCADE;
    
    COMMIT;
    
    \echo ''
    \echo '✅ Tables truncated successfully'
    \echo ''
    
    -- Verify counts are zero
    SELECT 
      'AbekaVideo' as "Table",
      COUNT(*) as "Count",
      CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ FAIL' END as "Status"
    FROM "AbekaVideo"
    UNION ALL
    SELECT 'AbekaLesson', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ FAIL' END
    FROM "AbekaLesson"
    UNION ALL
    SELECT 'AbekaLessonPackage', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ FAIL' END
    FROM "AbekaLessonPackage"
    UNION ALL
    SELECT 'CurriculumPackage', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✅ OK' ELSE '❌ FAIL' END
    FROM "CurriculumPackage";
SQL
EOF
```

**Expected Output:**
```
╔═══════════════════════════════════════════════════════════╗
║           TRUNCATING OLD ABEKA DATA                       ║
╚═══════════════════════════════════════════════════════════╝

BEGIN
TRUNCATE TABLE
COMMIT

✅ Tables truncated successfully

Table               | Count | Status
--------------------+-------+--------
AbekaVideo          |     0 | ✅ OK
AbekaLesson         |     0 | ✅ OK
AbekaLessonPackage  |     0 | ✅ OK
CurriculumPackage   |     0 | ✅ OK
```

### 3.3 Verify User Data Still Intact

```bash
# CRITICAL: Verify user data was NOT touched
ssh do-server << 'EOF'
  docker exec postgres psql -U postgres -d tinygeniushub << 'SQL'
    \echo '╔═══════════════════════════════════════════════════════════╗'
    \echo '║         VERIFY USER DATA PRESERVED                        ║'
    \echo '╚═══════════════════════════════════════════════════════════╝'
    \echo ''
    
    SELECT 
      'Parent' as "Table",
      COUNT(*) as "Count",
      CASE WHEN COUNT(*) > 0 THEN '✅ PRESERVED' ELSE '❌ LOST!' END as "Status"
    FROM "Parent"
    UNION ALL
    SELECT 'Child', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅ PRESERVED' ELSE '❌ LOST!' END
    FROM "Child"
    UNION ALL
    SELECT 'PaymentTransaction', COUNT(*), CASE WHEN COUNT(*) > 0 THEN '✅ PRESERVED' ELSE '❌ LOST!' END
    FROM "PaymentTransaction";
SQL
EOF
```

**Expected Output:**
```
╔═══════════════════════════════════════════════════════════╗
║         VERIFY USER DATA PRESERVED                        ║
╚═══════════════════════════════════════════════════════════╝

Table               | Count | Status
--------------------+-------+----------------
Parent              | 1,250 | ✅ PRESERVED
Child               | 2,100 | ✅ PRESERVED
PaymentTransaction  | 3,450 | ✅ PRESERVED
```

---

## Phase 4: Run Migrations

### 4.1 Deploy Prisma Migrations

```bash
# Run migrations on production database
ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  
  # Deploy pending migrations
  pnpm prisma migrate deploy
EOF
```

**Expected Output:**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "tinygeniushub", schema "public" at "postgres:5432"

3 migration(s) found in prisma/migrations.

Applying migration `20260404000000_add_abeka_curriculum`
Applying migration `20260404000001_add_curriculum_packages`
Applying migration `20260404000002_add_abeka_import_optimizations`

The following migration(s) have been applied:

migrations/
  └─ 20260404000000_add_abeka_curriculum/
    └─ migration.sql
  └─ 20260404000001_add_curriculum_packages/
    └─ migration.sql
  └─ 20260404000002_add_abeka_import_optimizations/
    └─ migration.sql
  
✅ All migrations have been successfully applied.
```

### 4.2 Verify Migration Status

```bash
# Check migration status
ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  pnpm prisma migrate status
EOF
```

**Expected Output:**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "tinygeniushub", schema "public" at "postgres:5432"

3 migration(s) found in prisma/migrations.

Database schema is up to date! ✅
```

### 4.3 Generate Prisma Client

```bash
# Generate updated Prisma client
ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  pnpm db:generate
EOF
```

**Expected Output:**
```
✔ Generated Prisma Client (v6.x.x) to ./node_modules/.pnpm/...@prisma/client
```

---

## Phase 5: Seed Packages

### 5.1 Seed 8 Curriculum Packages

```bash
# Seed the 8 curriculum packages
ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  pnpm db:seed:packages
EOF
```

**Expected Output:**
```
🌱 Seeding Curriculum Packages...

✅ Created package: PRESCHOOL_PREMIUM (Mầm Non PREMIUM)
✅ Created package: ELEMENTARY_PRO (Tiểu Học PRO)
✅ Created package: MIDDLE_ADVANCED (Trung Học ADVANCED)
✅ Created package: HIGH_ELITE (THPT ELITE)
✅ Created package: ENGLISH_MASTER (Tiếng Anh MASTER)
✅ Created package: MATH_THINKING (Toán Tư Duy MATH)
✅ Created package: STEM_INNOVATOR (STEM INNOVATOR)
✅ Created package: ULTIMATE (ULTIMATE)

✅ Successfully seeded 8 curriculum packages
```

### 5.2 Verify Packages Created

```bash
# Query packages
ssh do-server << 'EOF'
  docker exec postgres psql -U postgres -d tinygeniushub << 'SQL'
    \echo '╔═══════════════════════════════════════════════════════════╗'
    \echo '║           CURRICULUM PACKAGES VERIFICATION                ║'
    \echo '╚═══════════════════════════════════════════════════════════╝'
    \echo ''
    
    SELECT 
      code as "Code",
      name as "Name",
      "videoCount" as "Videos",
      "monthlyPrice"/100 as "Monthly $",
      "yearlyPrice"/100 as "Yearly $",
      "isActive" as "Active"
    FROM "CurriculumPackage"
    ORDER BY "displayOrder";
SQL
EOF
```

**Expected Output:**
```
╔═══════════════════════════════════════════════════════════╗
║           CURRICULUM PACKAGES VERIFICATION                ║
╚═══════════════════════════════════════════════════════════╝

Code                  | Name               | Videos | Monthly $ | Yearly $ | Active
----------------------+--------------------+--------+-----------+----------+--------
PRESCHOOL_PREMIUM     | Mầm Non PREMIUM    |    680 |   1990.00 | 19900.00 | t
ELEMENTARY_PRO        | Tiểu Học PRO       |   2550 |   3490.00 | 34900.00 | t
MIDDLE_ADVANCED       | Trung Học ADVANCED |   2040 |   3490.00 | 34900.00 | t
HIGH_ELITE            | THPT ELITE         |   1530 |   4490.00 | 44900.00 | t
ENGLISH_MASTER        | Tiếng Anh MASTER   |   1190 |   2490.00 | 24900.00 | t
MATH_THINKING         | Toán Tư Duy MATH   |   1700 |   1990.00 | 19900.00 | t
STEM_INNOVATOR        | STEM INNOVATOR     |   2040 |   2990.00 | 29900.00 | t
ULTIMATE              | ULTIMATE           |   8500 |   6990.00 | 69900.00 | t
```

### 5.3 Canonical Parity Check (MANDATORY)

Run after seed and again after import. All checks must pass:

```bash
ssh do-server << 'EOF'
  docker exec postgres psql -U postgres -d tinygeniushub << 'SQL'
    -- total must be 8
    SELECT COUNT(*) AS package_count FROM "CurriculumPackage";

    -- old package set must be empty
    SELECT code
    FROM "CurriculumPackage"
    WHERE code IN (
      'PRESCHOOL_BASIC', 'ELEMENTARY_STARTER', 'ELEMENTARY_CORE',
      'MIDDLE_SCHOOL', 'HIGH_SCHOOL_BASE', 'HIGH_SCHOOL_PRO', 'ALL_ACCESS'
    );

    -- canonical parity (expect 0 rows)
    WITH canonical(code, "videoCount", "monthlyPrice", "yearlyPrice", "displayOrder") AS (
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
    LEFT JOIN "CurriculumPackage" p ON p.code = c.code
    WHERE p.code IS NULL
       OR p."videoCount" <> c."videoCount"
       OR p."monthlyPrice" <> c."monthlyPrice"
       OR p."yearlyPrice" <> c."yearlyPrice"
       OR p."displayOrder" <> c."displayOrder";
SQL
EOF
```

---

## Phase 6: Import Abeka Videos

### 6.1 Prepare Checkpoint Directory

```bash
# Create checkpoint directory
ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  mkdir -p checkpoints
  chmod 755 checkpoints
EOF
```

### 6.2 Run Production Import (Full)

```bash
# Import all 20,195 videos with checkpoint
ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  
  # Full import with checkpoint and verbose output
  pnpm abeka:import:prod --checkpoint=./checkpoints/import.chk 2>&1 | tee logs/import-$(date +%Y%m%d_%H%M%S).log
EOF
```

**Alternative: Import with Custom Options**

```bash
# With specific options
ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  
  npx tsx scripts/abeka/production-import.ts \
    --verbose \
    --batch-size=100 \
    --rate-limit=10 \
    --checkpoint=./checkpoints/import.chk \
    --max-retries=3
EOF
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════════╗
║       ABEKA CURRICULUM IMPORT - PRODUCTION MODE            ║
╚════════════════════════════════════════════════════════════╝

📋 Configuration:
   Mode: PRODUCTION
   Batch Size: 100
   Rate Limit: 10ms
   Max Retries: 3
   Checkpoint: ./checkpoints/import.chk

📚 Starting full curriculum import (K4-12)...
   Expected: 20,195 videos

🔄 Processing Grade 0 (K4)...
   Lessons: 170
   Videos: ~1,400
   Progress: ████████████████████ 100%
   Time: 45s

🔄 Processing Grade 1 (K5)...
   ...

════════════════════════════════════════════════════════════
                  IMPORT SUMMARY
════════════════════════════════════════════════════════════
Total Videos:                20,195
Created:                     20,195
Updated:                          0
Skipped:                          0
Grades Processed:                14
Lessons Processed:          2,380
Duration:                     3m 45s
Status:                   ✅ COMPLETED
════════════════════════════════════════════════════════════

💾 Checkpoint saved to: ./checkpoints/import.chk
```

### 6.3 Resume Failed Import (If Needed)

```bash
# If import fails, resume from checkpoint
ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  
  pnpm abeka:import:prod \
    --resume \
    --checkpoint=./checkpoints/import.chk \
    --verbose
EOF
```

### 6.4 Import Single Grade (For Testing)

```bash
# Import just Grade 5 for testing
ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  
  npx tsx scripts/abeka/production-import.ts \
    --grade=5 \
    --verbose \
    --checkpoint=./checkpoints/grade5.chk
EOF
```

---

## Phase 7: Verify Migration

### 7.1 Run Full Database Verification

```bash
# Run verification script
ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  pnpm abeka:validate:db
EOF
```

**Expected Output:**
```
╔══════════════════════════════════════════════════════════════╗
║              ABEKA DATABASE VALIDATION                       ║
╚══════════════════════════════════════════════════════════════╝

📊 Table Counts:
──────────────────────────────────────────────────────────────
Table                         Count    Expected    Status
─────────────────────────────────────────────────────────────
AbekaVideo                     20195       20195       ✅ OK
AbekaLesson                     2380           -       ✅ OK
AbekaLessonPackage             15100           -       ✅ OK
AbekaGrade                        14          14       ✅ OK
AbekaSubject                      87           -       ✅ OK
CurriculumPackage                  8           8       ✅ OK
PackageSubscription                0           0       ✅ OK

📚 Grade Distribution:
──────────────────────────────────────────────────────────────
Level | Name              | Lessons | Videos
------+-------------------+---------+--------
 0    | K4                | 170     | 1,445
 1    | K5                | 170     | 1,432
 2    | Grade 1           | 170     | 1,442
 3    | Grade 2           | 170     | 1,438
 4    | Grade 3           | 170     | 1,445
 5    | Grade 4           | 170     | 1,440
 6    | Grade 5           | 170     | 1,438
 7    | Grade 6           | 170     | 1,445
 8    | Grade 7           | 170     | 1,442
 9    | Grade 8           | 170     | 1,440
10    | Grade 9           | 170     | 1,435
11    | Grade 10          | 170     | 1,438
12    | Grade 11          | 170     | 1,442
13    | Grade 12          | 170     | 1,451

🎁 Package Coverage:
──────────────────────────────────────────────────────────────
Package Code            | Coverage
------------------------+---------------------------
PRESCHOOL_PREMIUM       | ✅ 680 videos (K4-K5)
ELEMENTARY_PRO          | ✅ 2,550 videos (G1-G5)
MIDDLE_ADVANCED         | ✅ 2,040 videos (G6-G9)
HIGH_ELITE              | ✅ 1,530 videos (G10-G12)
ENGLISH_MASTER          | ✅ 1,190 videos (K4-G5, English)
MATH_THINKING           | ✅ 1,700 videos (K4-G8, Math)
STEM_INNOVATOR          | ✅ 2,040 videos (G3-G8, STEM)
ULTIMATE                | ✅ 8,500 videos (K4-G12)

══════════════════════════════════════════════════════════════
✅ ALL VALIDATION CHECKS PASSED
══════════════════════════════════════════════════════════════
```

### 7.2 Manual Verification Queries

```bash
# Run manual verification
ssh do-server << 'EOF'
  docker exec postgres psql -U postgres -d tinygeniushub << 'SQL'
    \echo '╔═══════════════════════════════════════════════════════════╗'
    \echo '║           MANUAL VERIFICATION QUERIES                     ║'
    \echo '╚═══════════════════════════════════════════════════════════╝'
    
    -- 1. Total video count
    \echo '\n1. Total Videos:'
    SELECT COUNT(*) as "AbekaVideo Count" FROM "AbekaVideo";
    
    -- 2. Check for orphaned videos
    \echo '\n2. Orphaned Videos Check (should be 0):'
    SELECT COUNT(*) as "Orphaned" 
    FROM "AbekaVideo" v
    LEFT JOIN "AbekaLessonPackage" lp ON v."lessonPackageId" = lp.id
    WHERE lp.id IS NULL AND v."lessonPackageId" IS NOT NULL;
    
    -- 3. Check for duplicate video IDs
    \echo '\n3. Duplicate Video IDs (should be 0 rows):'
    SELECT "videoId", COUNT(*) as count
    FROM "AbekaVideo"
    GROUP BY "videoId"
    HAVING COUNT(*) > 1;
    
    -- 4. CDN URL validation sample
    \echo '\n4. CDN URL Sample (should all start with https):'
    SELECT "videoId", LEFT("cdnUrl", 50) as "CDN URL"
    FROM "AbekaVideo"
    WHERE "cdnUrl" NOT LIKE 'https://%'
    LIMIT 5;
    
    -- 5. Lessons per grade
    \echo '\n5. Lessons Per Grade:'
    SELECT g.level, g.name, COUNT(l.id) as lessons
    FROM "AbekaGrade" g
    LEFT JOIN "AbekaLesson" l ON l."gradeId" = g.id
    GROUP BY g.level, g.name
    ORDER BY g.level;
    
    -- 6. Videos per grade
    \echo '\n6. Videos Per Grade:'
    SELECT 
      g.level, 
      g.name, 
      COUNT(v.id) as videos
    FROM "AbekaGrade" g
    LEFT JOIN "AbekaLesson" l ON l."gradeId" = g.id
    LEFT JOIN "AbekaLessonPackage" lp ON lp."lessonId" = l.id
    LEFT JOIN "AbekaVideo" v ON v."lessonPackageId" = lp.id
    GROUP BY g.level, g.name
    ORDER BY g.level;
SQL
EOF
```

**Expected Output:**
```
╔═══════════════════════════════════════════════════════════╗
║           MANUAL VERIFICATION QUERIES                     ║
╚═══════════════════════════════════════════════════════════╝

1. Total Videos:
AbekaVideo Count
----------------
           20195

2. Orphaned Videos Check (should be 0):
Orphaned
----------
         0

3. Duplicate Video IDs (should be 0 rows):
videoId | count
--------+-------
(0 rows)

4. CDN URL Sample (should all start with https):
videoId | CDN URL
--------+--------------------------------------------------
(0 rows)

5. Lessons Per Grade:
level |    name     | lessons
------+-------------+---------
    0 | K4          |     170
    1 | K5          |     170
    2 | Grade 1     |     170
    ...
   13 | Grade 12    |     170

6. Videos Per Grade:
level |    name     | videos
------+-------------+--------
    0 | K4          |   1445
    1 | K5          |   1432
    2 | Grade 1     |   1442
    ...
   13 | Grade 12    |   1451
```

### 7.3 CDN URL Verification (Sample)

```bash
# Verify a sample of CDN URLs are accessible
ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  
  # Get sample of CDN URLs and verify
  docker exec postgres psql -U postgres -d tinygeniushub -t -A << 'SQL' | \
    head -20 | while read url; do
      if [ -n "$url" ]; then
        status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
        echo "URL: ${url:0:60}... Status: $status"
      fi
    done
    
  SELECT "cdnUrl" FROM "AbekaVideo" WHERE "cdnUrl" LIKE 'https://%' LIMIT 20;
SQL
EOF
```

**Expected Output:**
```
URL: https://cdn.example.com/videos/k4/bible/lesson01/video1.m3u8... Status: 200
URL: https://cdn.example.com/videos/k4/phonics/lesson02/video1.m3u8... Status: 200
...
```

---

## Phase 8: Restart Application

### 8.1 Start Application

```bash
# Restart PM2 processes
ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  
  # Build application first
  pnpm build
  
  # Restart named processes only
  pm2 restart tinygeniushub-web --update-env || pm2 start tinygeniushub-web
  pm2 restart tinygeniushub-worker --update-env || pm2 start tinygeniushub-worker
EOF
```

### 8.2 Verify Application Health

```bash
# Health checks
ssh do-server << 'EOF'
  echo "=== Health Check ==="
  curl -s http://localhost:3000/api/health | jq .
  
  echo ""
  echo "=== Ready Check ==="
  curl -s http://localhost:3000/api/health/ready | jq .
  
  echo ""
  echo "=== PM2 Status ==="
  pm2 status
EOF
```

**Expected Output:**
```
=== Health Check ===
{
  "status": "healthy",
  "timestamp": "2026-04-04T12:30:00.000Z",
  "version": "1.0.0"
}

=== Ready Check ===
{
  "status": "ready",
  "database": "connected",
  "redis": "connected"
}

=== PM2 Status ===
┌────┬─────────────────────────┬─────────┬──────┬───────────┬────────┐
│ id │ name                    │ mode    │ ↺    │ status    │ cpu    │
├────┼─────────────────────────┼─────────┼──────┼───────────┼────────┤
│ 0  │ tinygeniushub-web        │ fork    │ 0    │ online    │ 5%     │
│ 1  │ tinygeniushub-worker     │ fork    │ 0    │ online    │ 2%     │
└────┴─────────────────────────┴─────────┴──────┴───────────┴────────┘
```

---

## Rollback Plan

### Emergency Rollback: Restore from Backup

```bash
# ⚠️  WARNING: This will restore OLD data and lose NEW import
# Only use if migration completely failed

ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  
  echo "🚨 STARTING EMERGENCY ROLLBACK"
  echo ""
  
  # 1. Stop application
  echo "Step 1: Stopping application..."
  pm2 stop tinygeniushub-web && pm2 stop tinygeniushub-worker
  
  # 2. Find latest pre-migration backup
  LATEST_BACKUP=$(ls -t backups/postgres/*.dump | head -1)
  echo "Step 2: Using backup: $LATEST_BACKUP"
  
  # 3. Restore database
  echo "Step 3: Restoring database..."
  docker exec -i postgres pg_restore \
    -U postgres \
    -d tinygeniushub \
    --clean \
    --if-exists \
    < $LATEST_BACKUP
  
  # 4. Regenerate Prisma client
  echo "Step 4: Regenerating Prisma client..."
  pnpm db:generate
  
  # 5. Rebuild application
  echo "Step 5: Rebuilding application..."
  pnpm build
  
  # 6. Start application
  echo "Step 6: Starting application..."
  pm2 start tinygeniushub-web
  pm2 start tinygeniushub-worker
  
  # 7. Verify
  echo "Step 7: Verification..."
  sleep 5
  curl -s http://localhost:3000/api/health | jq .
  
  echo ""
  echo "✅ Rollback complete!"
  echo "⚠️  Old data restored. New import data lost."
EOF
```

### Partial Rollback: Reset and Re-import

```bash
# If import was incomplete, reset and re-import
ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  
  echo "🔄 PARTIAL ROLLBACK - Reset and Re-import"
  
  # 1. Truncate Abeka tables
  docker exec postgres psql -U postgres -d tinygeniushub << 'SQL'
    TRUNCATE TABLE 
      "AbekaVideo",
      "AbekaLessonPackage",
      "AbekaLesson",
      "AbekaSubject",
      "CurriculumPackage"
    CASCADE;
SQL
  
  # 2. Clear checkpoint
  rm -f checkpoints/import.chk
  
  # 3. Re-seed packages
  pnpm db:seed:packages
  
  # 4. Re-import
  pnpm abeka:import:prod --checkpoint=./checkpoints/import.chk
  
  # 5. Verify
  pnpm abeka:validate:db
EOF
```

### Rollback Checklist

```bash
# Post-rollback verification
ssh do-server << 'EOF'
  echo "╔═══════════════════════════════════════════════════════════╗"
  echo "║           ROLLBACK VERIFICATION                           ║"
  echo "╚═══════════════════════════════════════════════════════════╝"
  
  # Check application is running
  health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
  echo "✅ Health check: $health"
  
  # Check database connection
  docker exec postgres psql -U postgres -d tinygeniushub -c "SELECT 1" > /dev/null 2>&1
  echo "✅ Database connection: OK"
  
  # Check user data preserved
  parent_count=$(docker exec postgres psql -U postgres -d tinygeniushub -t -c "SELECT COUNT(*) FROM \"Parent\"" | xargs)
  echo "✅ Parent accounts: $parent_count"
  
  echo ""
  echo "✅ Rollback verification complete"
EOF
```

---

## Summary Commands Reference

### One-Liner: Full Migration

```bash
# Complete migration in one command (run from local machine)
ssh do-server << 'REMOTESCRIPT'
  cd /var/www/tinygeniushub && \
  pnpm backup:create && \
  docker exec postgres psql -U postgres -d tinygeniushub -c "
    TRUNCATE TABLE \\"
AbekaVideo\\", \\"
AbekaLessonPackage\\", \\"
AbekaLesson\\", \\"
AbekaSubject\\", \\"
CurriculumPackage\\" 
    CASCADE;
  " && \
  pnpm prisma migrate deploy && \
  pnpm prisma migrate status && \
  pnpm db:generate && \
  pnpm db:seed:packages && \
  pnpm abeka:import:prod --checkpoint=./checkpoints/import.chk && \
  pnpm abeka:validate:db && \
  pnpm build && \
  pm2 reload tinygeniushub-web && pm2 reload tinygeniushub-worker && \
  curl -s http://localhost:3000/api/health | jq .
REMOTESCRIPT
```

### One-Liner: Quick Status Check

```bash
# Check migration status quickly
ssh do-server << 'EOF'
  cd /var/www/tinygeniushub
  echo "=== Video Count ==="
  docker exec postgres psql -U postgres -d tinygeniushub -t -c "SELECT COUNT(*) FROM \"AbekaVideo\"" | xargs
  echo "=== Package Count ==="
  docker exec postgres psql -U postgres -d tinygeniushub -t -c "SELECT COUNT(*) FROM \"CurriculumPackage\"" | xargs
  echo "=== Health ==="
  curl -s http://localhost:3000/api/health | jq -r '.status'
EOF
```

---

## Post-Migration Checklist

### ✅ Verification Complete

- [ ] Database backup created and verified
- [ ] Old curriculum data truncated
- [ ] Prisma migrations deployed
- [ ] 8 Curriculum Packages seeded
- [ ] Canonical package parity check passed (seed + import)
- [ ] 20,195 Abeka videos imported
- [ ] Video counts match expected (20,195)
- [ ] Package counts match expected (8)
- [ ] No orphaned videos
- [ ] No duplicate video IDs
- [ ] CDN URLs valid
- [ ] Application restarted and healthy
- [ ] User data preserved (parents, children, payments)
- [ ] Rollback plan tested/documented

### 📊 Final State

| Metric | Expected | Status |
|--------|----------|--------|
| AbekaVideo | 20,195 | ✅ |
| CurriculumPackage | 8 | ✅ |
| AbekaGrade | 14 | ✅ |
| AbekaLesson | ~2,380 | ✅ |
| Parent accounts | Preserved | ✅ |
| Child accounts | Preserved | ✅ |
| Payment records | Preserved | ✅ |

---

## Support & Troubleshooting

### Common Issues

#### Issue: Import Times Out
```bash
# Resume from checkpoint with more retries
ssh do-server "cd /var/www/tinygeniushub && pnpm abeka:import:prod --resume --checkpoint=./checkpoints/import.chk --max-retries=5"
```

#### Issue: Low Video Count
```bash
# Check which grades have issues
ssh do-server << 'EOF'
  docker exec postgres psql -U postgres -d tinygeniushub << 'SQL'
    SELECT g.level, g.name, COUNT(v.id) as videos
    FROM "AbekaGrade" g
    LEFT JOIN "AbekaLesson" l ON l."gradeId" = g.id
    LEFT JOIN "AbekaLessonPackage" lp ON lp."lessonId" = l.id
    LEFT JOIN "AbekaVideo" v ON v."lessonPackageId" = lp.id
    GROUP BY g.level, g.name
    ORDER BY videos ASC;
SQL
EOF
```

#### Issue: Checkpoint Corrupted
```bash
# Remove and restart
ssh do-server "cd /var/www/tinygeniushub && rm -f checkpoints/import.chk && pnpm abeka:import:prod --checkpoint=./checkpoints/import.chk"
```

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-04  
**Author:** Claude Code  
**Migration Target:** Abeka 20,195 Videos

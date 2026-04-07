# Database Migration Plan - Abeka Curriculum Production

**Version:** 1.0  
**Date:** April 2026  
**Status:** Ready for Review  
**Author:** Claude Code  

---

## Executive Summary

This document outlines the database migration plan for transitioning from the old Abeka curriculum system to the new Abeka curriculum packages in production. The migration involves:

- **Backup** of existing data (20,195 videos, 14 grades, ~170 lessons per grade)
- **Truncate** old curriculum data tables
- **Seed** 8 new Curriculum Packages
- **Import** Abeka videos with checkpoint support
- **Verify** data integrity and counts

**Expected Duration:** 45-90 minutes (depending on hardware)  
**Downtime:** None (rolling migration)  
**Rollback Time:** 15-30 minutes

---

## Table of Contents

1. [Pre-Migration Checklist](#pre-migration-checklist)
2. [Migration Steps](#migration-steps)
3. [Rollback Plan](#rollback-plan)
4. [Verification](#verification)
5. [Troubleshooting](#troubleshooting)
6. [Appendix](#appendix)

---

## Pre-Migration Checklist

### Prerequisites

- [ ] Database backup storage available (minimum 500MB free)
- [ ] `DATABASE_URL` environment variable configured
- [ ] `ABEKA_DATA_PATH` environment variable configured
- [ ] PostgreSQL client tools installed (`psql`, `pg_dump`)
- [ ] Node.js and `npx` available
- [ ] Network access to database and CDN

### Pre-Validation

Run the pre-import check to validate source data:

```bash
npx tsx scripts/abeka/pre-import-check.ts
```

Expected output:
- ✅ Source path exists
- ✅ Grade directories found (14/14)
- ✅ JSON files valid
- ✅ Database connection OK
- ✅ Video count: ~20,195

### Backup Existing Data

**IMPORTANT:** Always backup before migration!

```bash
# Create backup directory
mkdir -p backups

# Backup Abeka tables
pg_dump --data-only --table=AbekaVideo > backup_abeka_videos_$(date +%Y%m%d).sql
pg_dump --data-only --table=AbekaLesson > backup_abeka_lessons_$(date +%Y%m%d).sql
pg_dump --data-only --table=AbekaSubject > backup_abeka_subjects_$(date +%Y%m%d).sql
pg_dump --data-only --table=AbekaGrade > backup_abeka_grades_$(date +%Y%m%d).sql
```

---

## Migration Steps

### Option 1: Automated Migration (Recommended)

Run the comprehensive migration script:

```bash
cd scripts/db-migrate

# Dry run to preview changes
./db-migrate-production.sh --dry-run

# Execute migration
./db-migrate-production.sh

# With all options
./db-migrate-production.sh --verbose --reset
```

### Option 2: Manual Step-by-Step

#### Step 1: Backup Existing Data

```bash
# Create timestamped backups
export TIMESTAMP=$(date +%Y%m%d_%H%M%S)
export BACKUP_DIR=./backups

pg_dump --data-only --table=AbekaVideo $DATABASE_URL > \
  $BACKUP_DIR/backup_abekavideo_$TIMESTAMP.sql

pg_dump --data-only --table=AbekaLesson $DATABASE_URL > \
  $BACKUP_DIR/backup_abekalesson_$TIMESTAMP.sql

pg_dump --data-only --table=AbekaSubject $DATABASE_URL > \
  $BACKUP_DIR/backup_abekasubject_$TIMESTAMP.sql

pg_dump --data-only --table=AbekaGrade $DATABASE_URL > \
  $BACKUP_DIR/backup_abekagrade_$TIMESTAMP.sql
```

#### Step 2: Truncate Old Abeka Tables

```sql
-- Truncate old Abeka data tables
-- Keep AbekaGrade, AbekaStreak, etc. (reference tables)
TRUNCATE TABLE 
    "AbekaVideo",
    "AbekaLesson",
    "AbekaLessonPackage",
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
    "AbekaParentPreferences"
CASCADE;
```

**Verify truncation:**
```sql
SELECT COUNT(*) FROM "AbekaVideo"; -- Should be 0
```

#### Step 3: Run New Migrations

```bash
# Deploy Prisma migrations
npx prisma migrate deploy

# Verify migration status
npx prisma migrate status
```

#### Step 4: Seed CurriculumPackage (8 Packages, Canonical)

Use the canonical seed source only:
- `prisma/seeders/curriculum-packages.ts`

```bash
# Canonical package seed (recommended)
pnpm db:seed:packages

# Equivalent direct run
# npx tsx prisma/seeders/curriculum-packages.ts
```

Do not maintain manual SQL `INSERT` blocks in this runbook. They drift from source-of-truth.

**Canonical snapshot (must match seed file):**

| Order | Code | VideoCount | Monthly (VND) | Yearly (VND) |
|------:|------|-----------:|--------------:|-------------:|
| 1 | `PRESCHOOL_PREMIUM` | 680 | 199000 | 1990000 |
| 2 | `ELEMENTARY_PRO` | 2550 | 349000 | 3490000 |
| 3 | `MIDDLE_ADVANCED` | 2040 | 349000 | 3490000 |
| 4 | `HIGH_ELITE` | 1530 | 449000 | 4490000 |
| 5 | `ENGLISH_MASTER` | 1190 | 249000 | 2490000 |
| 6 | `MATH_THINKING` | 1700 | 199000 | 1990000 |
| 7 | `STEM_INNOVATOR` | 2040 | 299000 | 2990000 |
| 8 | `ULTIMATE` | 8500 | 699000 | 6990000 |

**Verify packages:**
```sql
SELECT code, name, "videoCount", "monthlyPrice", "yearlyPrice"
FROM "CurriculumPackage"
ORDER BY "displayOrder";
```

Expected: 8 rows

#### Step 5: Import Abeka Videos with Checkpoint

```bash
# Run production import with checkpoint
npx tsx scripts/abeka/production-import.ts \
  --verbose \
  --checkpoint=./backups/import_checkpoint.json

# If import fails, resume from checkpoint
npx tsx scripts/abeka/production-import.ts \
  --resume \
  --checkpoint=./backups/import_checkpoint.json
```

#### Step 5.1: Parity Check Checklist (MANDATORY after seed/import)

Run these checks and proceed only when all pass:

```sql
-- 1) Total package rows must be exactly 8
SELECT COUNT(*) AS package_count FROM "CurriculumPackage";

-- 2) Old package codes must not exist
SELECT code
FROM "CurriculumPackage"
WHERE code IN (
  'PRESCHOOL_BASIC', 'ELEMENTARY_STARTER', 'ELEMENTARY_CORE',
  'MIDDLE_SCHOOL', 'HIGH_SCHOOL_BASE', 'HIGH_SCHOOL_PRO', 'ALL_ACCESS'
);

-- 3) Canonical parity check (expect 0 rows)
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
SELECT
  c.code,
  p."videoCount" AS actual_video_count,
  c."videoCount" AS expected_video_count,
  p."monthlyPrice" AS actual_monthly_price,
  c."monthlyPrice" AS expected_monthly_price,
  p."yearlyPrice" AS actual_yearly_price,
  c."yearlyPrice" AS expected_yearly_price,
  p."displayOrder" AS actual_display_order,
  c."displayOrder" AS expected_display_order
FROM canonical c
LEFT JOIN "CurriculumPackage" p ON p.code = c.code
WHERE p.code IS NULL
   OR p."videoCount" <> c."videoCount"
   OR p."monthlyPrice" <> c."monthlyPrice"
   OR p."yearlyPrice" <> c."yearlyPrice"
   OR p."displayOrder" <> c."displayOrder";
```

**Import Options:**
- `--verbose`: Show detailed progress
- `--checkpoint=FILE`: Save progress for resume
- `--resume`: Continue from checkpoint
- `--batch-size=100`: Process N lessons per batch
- `--rate-limit=10`: Delay between batches (ms)

**Expected Output:**
```
╔════════════════════════════════════════════════════════╗
║     ABEKA CURRICULUM IMPORT - PRODUCTION MODE          ║
╚════════════════════════════════════════════════════════╝

📋 Configuration:
   Mode: PRODUCTION
   Batch Size: 100
   Rate Limit: 10ms
   Max Retries: 3

📚 Starting full curriculum import (K4-12)...
   Expected: 20,195 videos

... (progress output) ...

════════════════════════════════════════════════════════════
                  IMPORT SUMMARY
════════════════════════════════════════════════════════════
Total Videos:                20,195
Created:                     20,195
Updated:                          0
Skipped:                          0
Grades Processed:                14
Lessons Processed:          2,380
Duration:                     3,456s
Status:                   COMPLETED
════════════════════════════════════════════════════════════
```

#### Step 6: Verify Counts

Run verification script:

```bash
# Standard verification
./scripts/db-migrate/db-verify.sh

# Full verification with CDN checks
./scripts/db-migrate/db-verify.sh --full

# JSON output for automation
./scripts/db-migrate/db-verify.sh --json --output=verify_result.json
```

**Expected Results:**
```
══════════════════════════════════════════════════════════════
                   VERIFICATION RESULTS
══════════════════════════════════════════════════════════════

📊 Table Counts:
──────────────────────────────────────────────────────────────
Table                             Count   Expected    Status
───────────────────────────────────────────────────────────────
AbekaVideo                         20195      20195       OK
AbekaLesson                         2380          -       OK
AbekaGrade                            14         14       OK
AbekaSubject                          87          -       OK
CurriculumPackage                      8          8       OK
PackageSubscription                    0          0       OK

📚 Grade Distribution:
──────────────────────────────────────────────────────────────
Level | Name              | Lessons | Videos
------+-------------------+---------+--------
0     | K4                | 170     | ~1,400
1     | K5                | 170     | ~1,400
2     | Grade 1           | 170     | ~1,450
...
13    | Grade 12          | 170     | ~1,500

🎁 Package Details:
──────────────────────────────────────────────────────────────
Code                  | Name              | VideoCount
----------------------+-------------------+------------
PRESCHOOL_PREMIUM     | Mầm Non PREMIUM   | 680
ELEMENTARY_PRO        | Tiểu Học PRO      | 2550
MIDDLE_ADVANCED       | Trung Học ADVANCED| 2040
...
ULTIMATE              | ULTIMATE          | 8500

══════════════════════════════════════════════════════════════
                      VERIFICATION COMPLETE
══════════════════════════════════════════════════════════════

✅ ALL CHECKS PASSED
```

---

## Rollback Plan

### When to Rollback

Rollback if:
- Import fails catastrophically (>50% data loss)
- Video count < 18,175 (90% of expected)
- Critical data integrity issues
- Application errors after migration

### Rollback Steps

#### Option 1: Automated Rollback

```bash
# Restore from backup files
psql $DATABASE_URL < backups/backup_abekavideo_YYYYMMDD.sql
psql $DATABASE_URL < backups/backup_abekalesson_YYYYMMDD.sql
psql $DATABASE_URL < backups/backup_abekasubject_YYYYMMDD.sql
psql $DATABASE_URL < backups/backup_abekagrade_YYYYMMDD.sql

# Verify restore
./scripts/db-migrate/db-verify.sh
```

#### Option 2: Manual Rollback

```bash
# 1. Truncate new data
psql $DATABASE_URL -c 'TRUNCATE "AbekaVideo", "AbekaLesson", "CurriculumPackage" CASCADE;'

# 2. Restore from backup
psql $DATABASE_URL < backups/backup_abekavideo_YYYYMMDD.sql

# 3. Verify
psql $DATABASE_URL -c 'SELECT COUNT(*) FROM "AbekaVideo";'
```

### Post-Rollback

1. Notify team of rollback
2. Investigate migration failure cause
3. Fix issues before retry
4. Update migration plan if needed

---

## Verification

### Quick Verification

```bash
# Run full verification suite
./scripts/db-migrate/db-verify.sh --full
```

### Manual Verification Queries

```sql
-- Check video count
SELECT COUNT(*) FROM "AbekaVideo";
-- Expected: 20,195

-- Check packages
SELECT * FROM "CurriculumPackage";
-- Expected: 8 packages

-- Check grade distribution
SELECT g.level, g.name, COUNT(v.id) as videos
FROM "AbekaGrade" g
LEFT JOIN "AbekaLesson" l ON l."gradeId" = g.id
LEFT JOIN "AbekaLessonPackage" lp ON lp."lessonId" = l.id
LEFT JOIN "AbekaVideo" v ON v."lessonPackageId" = lp.id
GROUP BY g.level, g.name
ORDER BY g.level;

-- Check for orphaned videos
SELECT COUNT(*) FROM "AbekaVideo" v
LEFT JOIN "AbekaLessonPackage" lp ON v."lessonPackageId" = lp.id
WHERE lp.id IS NULL AND v."lessonPackageId" IS NOT NULL;
-- Expected: 0

-- Check for duplicate video IDs
SELECT "videoId", COUNT(*) 
FROM "AbekaVideo" 
GROUP BY "videoId" 
HAVING COUNT(*) > 1;
-- Expected: 0 rows
```

### Application-Level Verification

1. **Test video playback**: Select random videos from each grade
2. **Test package assignment**: Create test subscriptions
3. **Test progress tracking**: Complete lessons and verify persistence
4. **Test CDN URLs**: Verify video streaming works

---

## Troubleshooting

### Common Issues

#### Issue: Import Times Out

**Symptoms:** Import stops after 4 hours

**Solution:**
```bash
# Resume from checkpoint
./db-migrate-production.sh --checkpoint --verbose
```

#### Issue: Low Video Count

**Symptoms:** Verification shows < 90% of expected videos

**Diagnosis:**
```bash
# Check which grades failed
psql $DATABASE_URL -c "
SELECT g.level, g.name, COUNT(v.id) as videos
FROM \"AbekaGrade\" g
LEFT JOIN \"AbekaLesson\" l ON l.\"gradeId\" = g.id
LEFT JOIN \"AbekaLessonPackage\" lp ON lp.\"lessonId\" = l.id
LEFT JOIN \"AbekaVideo\" v ON v.\"lessonPackageId\" = lp.id
GROUP BY g.level, g.name
ORDER BY videos ASC;
"
```

**Solution:**
```bash
# Re-import specific grade
npx tsx scripts/abeka/production-import.ts --grade=5 --verbose
```

#### Issue: Database Connection Fails

**Symptoms:** "Cannot connect to database" error

**Check:**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1;"

# Check if database exists
psql $DATABASE_URL -c "\dt"
```

**Solution:**
- Verify DATABASE_URL format: `postgresql://user:pass@host:port/db`
- Check network connectivity
- Verify PostgreSQL service is running

#### Issue: CDN URLs Invalid

**Symptoms:** Videos have malformed CDN URLs

**Check:**
```sql
-- Find videos with invalid CDN URLs
SELECT id, "videoId", "cdnUrl"
FROM "AbekaVideo"
WHERE "cdnUrl" NOT LIKE 'https://%.m3u8';
```

**Solution:**
- Re-run import with CDN verification
- Check source JSON files

---

## Appendix

### A. Script Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `db-migrate-production.sh` | Full migration | `./db-migrate-production.sh` |
| `db-verify.sh` | Verify migration | `./db-verify.sh --full` |
| `pre-import-check.ts` | Pre-validation | `npx tsx scripts/abeka/pre-import-check.ts` |
| `production-import.ts` | Import videos | `npx tsx scripts/abeka/production-import.ts` |

### B. Expected Data Volumes

| Entity | Count | Storage |
|--------|-------|---------|
| AbekaVideo | 20,195 | ~40MB |
| AbekaLesson | ~2,380 | ~5MB |
| AbekaLessonPackage | ~15,000 | ~3MB |
| AbekaGrade | 14 | ~10KB |
| AbekaSubject | ~87 | ~50KB |
| CurriculumPackage | 8 | ~5KB |

### C. Migration Checklist

**Before Migration:**
- [ ] All team members notified
- [ ] Database backup completed
- [ ] Pre-validation passed
- [ ] Rollback plan reviewed
- [ ] Monitoring in place

**During Migration:**
- [ ] Run dry-run first
- [ ] Monitor import progress
- [ ] Log all output
- [ ] Watch for errors

**After Migration:**
- [ ] Run verification suite
- [ ] Test application
- [ ] Verify CDN URLs
- [ ] Update documentation
- [ ] Notify team of completion

### D. Emergency Contacts

| Role | Contact |
|------|---------|
| Database Admin | [Add contact] |
| DevOps Lead | [Add contact] |
| Product Owner | [Add contact] |

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-04 | Claude Code | Initial version |

---

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tech Lead | | | |
| Database Admin | | | |
| Product Owner | | | |

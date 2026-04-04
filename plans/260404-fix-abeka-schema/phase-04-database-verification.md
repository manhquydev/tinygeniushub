# Phase 4: Database Verification

**Phase ID:** phase-04-database-verification  
**Priority:** P2 - HIGH  
**Estimated Time:** 0.5 hours  
**Dependencies:** Phase 3 Complete

---

## Overview

This phase verifies that the Prisma schema matches the existing database tables created by the migration. Since the migration already created all tables, we're just confirming alignment.

---

## Steps

### Step 4.1: Check Migration Status (5 min)

**Command:**
```bash
cd D:/project/cungcontuhoc && npx prisma migrate status
```

**Expected Output:**
```
Datasource "db": PostgreSQL database "cungcontuhoc" at "localhost:5432"

Migration            Status
-------------------  ---------
20260221000000_abeka_curriculum_system  Applied
```

**If migration not applied:**
```bash
npx prisma migrate resolve --applied 20260221000000_abeka_curriculum_system
```

---

### Step 4.2: Run Dry-Run Introspection (10 min)

**Command:**
```bash
cd D:/project/cungcontuhoc && npx prisma db pull --dry-run
```

**This will:**
- Compare schema to database
- Show any differences
- NOT modify the schema file

**Expected:** No differences or only cosmetic differences.

**If differences found:**
Review the diff - are they just naming convention differences (e.g., `@map`)? Or are there actual mismatches?

**Example acceptable difference:**
```prisma
// Schema has
watchSeconds Int @default(0)

// Database has
watchSeconds INTEGER DEFAULT 0
```
→ This is fine, just different syntax for the same thing.

**Example unacceptable difference:**
```
Database has table "AbekaWatchProgress" but schema is missing model
```
→ Schema is incomplete, go back to Phase 1.

---

### Step 4.3: Verify Table Existence (10 min)

**Connect to database and verify tables exist:**

**Using psql:**
```sql
\dt "Abeka"*
```

**Expected tables:**
```
AbekaAssignment
AbekaBadge
AbekaDailyPlan
AbekaGrade
AbekaLearningJourney
AbekaLesson
AbekaLessonPackage
AbekaParentPreferences
AbekaSkillNode
AbekaSkillPrerequisite
AbekaStreak
AbekaStreakHistory
AbekaSubject
AbekaVideo
AbekaWatchProgress
AbekaWeeklyPlan
```

**Also verify child tables:**
```
ChildEarnedBadge
ChildGradeProgress
ChildSkillProgress
```

---

### Step 4.4: Verify Key Indexes (10 min)

**Command:**
```sql
\di "Abeka"*
```

**Key indexes to verify:**
- `AbekaWatchProgress_childId_videoId_key` (UNIQUE)
- `AbekaBadge_code_key` (UNIQUE)
- `ChildEarnedBadge_childId_badgeId_key` (UNIQUE)
- `AbekaWeeklyPlan_journeyId_weekNumber_key` (UNIQUE)
- `AbekaDailyPlan_weeklyPlanId_dayOfWeek_key` (UNIQUE)
- `AbekaStreak_childId_key` (UNIQUE)
- `AbekaSkillPrerequisite_skillId_prerequisiteId_key` (UNIQUE)
- `ChildSkillProgress_childId_skillNodeId_key` (UNIQUE)
- `ChildGradeProgress_childId_gradeId_key` (UNIQUE)
- `AbekaParentPreferences_parentId_key` (UNIQUE)

---

### Step 4.5: Verify Foreign Keys (10 min)

**Command:**
```sql
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name LIKE 'Abeka%'
    OR tc.table_name LIKE 'Child%';
```

**Verify these key relationships:**
- `AbekaWatchProgress.childId` → `ChildProfile.id`
- `AbekaWatchProgress.videoId` → `AbekaVideo.id`
- `ChildEarnedBadge.childId` → `ChildProfile.id`
- `ChildEarnedBadge.badgeId` → `AbekaBadge.id`
- `AbekaWeeklyPlan.journeyId` → `AbekaLearningJourney.id`
- `AbekaDailyPlan.weeklyPlanId` → `AbekaWeeklyPlan.id`
- `AbekaStreak.childId` → `ChildProfile.id`
- `AbekaStreakHistory.streakId` → `AbekaStreak.id`
- `ChildSkillProgress.childId` → `ChildProfile.id`
- `ChildSkillProgress.skillNodeId` → `AbekaSkillNode.id`
- `ChildGradeProgress.childId` → `ChildProfile.id`
- `ChildGradeProgress.gradeId` → `AbekaGrade.id`
- `AbekaParentPreferences.parentId` → `ParentAccount.id`

---

### Step 4.6: Document Any Drift (5 min)

If differences are found between schema and database:

**Create file:** `plans/260404-fix-abeka-schema/database-drift-report.md`

```markdown
# Database Drift Report

## Date: 2026-04-04

## Differences Found:

### 1. [Table/Field Name]
- **Schema:** X
- **Database:** Y
- **Impact:** [Low/Medium/High]
- **Action:** [Fix/Ignore/Document]

...
```

**Decision criteria:**
- **Fix:** Schema is wrong, database is source of truth
- **Ignore:** Cosmetic difference (e.g., VARCHAR vs TEXT)
- **Document:** Known difference that doesn't affect functionality

---

## Deliverables

1. ✅ Migration status confirmed (applied)
2. ✅ All 20 Abeka tables exist in database
3. ✅ All unique indexes present
4. ✅ All foreign keys properly configured
5. ✅ Schema-database alignment verified
6. ✅ Any drift documented (if applicable)

---

## Verification Checklist

- [ ] `npx prisma migrate status` shows migration applied
- [ ] `npx prisma db pull --dry-run` shows no significant differences
- [ ] All expected tables exist in database
- [ ] All unique constraints present
- [ ] All foreign key relationships valid
- [ ] No blocking drift detected

---

## Troubleshooting

### Migration Not Applied
```bash
npx prisma migrate deploy
```

### Schema Drift Detected
If schema and database differ significantly:

**Option A - Database is correct:**
```bash
npx prisma db pull
# Review the pulled schema, then manually merge changes
```

**Option B - Schema is correct:**
```bash
# Create a migration to align database with schema
npx prisma migrate dev --name align_abeka_schema
```

**⚠️ WARNING:** Option B may DROP columns/tables. Use with caution.

---

## Notes

1. **Database is source of truth** - The migration already created correct tables
2. **Schema must match exactly** - Any mismatch could cause runtime errors
3. **Don't run `prisma migrate dev`** - This could create unnecessary migrations
4. **Use `prisma db pull` for comparison only** - Don't overwrite the hand-crafted schema

---

**Phase 4 Complete → Proceed to Phase 5: Testing & Validation**

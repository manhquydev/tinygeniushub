---
title: "Fix Abeka Curriculum Schema - Add Missing Prisma Models"
description: "Add all missing Abeka models to Prisma schema to fix build errors and enable production deployment of the Abeka curriculum system with 20,195 videos"
status: pending
priority: P1
effort: 6h
branch: main
tags: [prisma, database, abeka, schema, blocking]
created: 2026-04-04
---

# Fix Abeka Curriculum Schema - Implementation Plan

## Executive Summary

**Status:** URGENT - Blocking Production Deployment  
**Impact:** Build failures preventing Abeka curriculum system deployment (20,195 videos)  
**Effort:** 6 hours  
**Risk:** HIGH if not completed - Production deployment blocked

---

## Problem Statement

The Prisma schema contains only **8 of the 20 Abeka curriculum tables** that exist in the database. The migration `20260221000000_abeka_curriculum_system` successfully created all tables, but the Prisma schema was only partially updated.

### Current State
- Migration exists with 20+ tables created in database ✅
- Only 8 Abeka models defined in Prisma schema ❌
- 12 models missing, causing TypeScript/build errors ❌
- Production deployment blocked ❌

### Missing Models (12)
1. `AbekaWatchProgress` - video watch progress tracking
2. `ChildEarnedBadge` - badges earned by children
3. `AbekaBadge` - badge definitions
4. `AbekaWeeklyPlan` - weekly learning plans
5. `AbekaDailyPlan` - daily learning plans
6. `AbekaStreak` - streak tracking
7. `AbekaStreakHistory` - streak history
8. `AbekaSkillNode` - skill tree nodes
9. `AbekaSkillPrerequisite` - skill prerequisites
10. `ChildSkillProgress` - child skill progress
11. `ChildGradeProgress` - child grade progress
12. `AbekaParentPreferences` - parent preferences

### Build-Blocking Files
- `app/api/abeka/progress/watch/route.ts`
- `app/api/curriculum/badges/check/route.ts`
- `app/api/curriculum/badges/[badgeId]/view/route.ts`
- `app/api/curriculum/complete/route.ts`
- `prisma/seeders/abeka-curriculum.ts`
- `app/api/webhooks/package-subscription/route.ts`
- `src/modules/billing/package-service.ts`

---

## Models to Add

### Model 1: AbekaWatchProgress

**Source:** Migration SQL lines 162-178  
**Purpose:** Track detailed video watch progress for each child

**Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| id | String @id @default(cuid()) | auto | Primary key |
| childId | String | - | FK to ChildProfile |
| videoId | String | - | FK to AbekaVideo |
| watchPercent | Int | 0 | Percentage watched (0-100) |
| watchSeconds | Int | 0 | Total seconds watched |
| durationSeconds | Int? | - | Total video duration |
| isCompleted | Boolean | false | Video fully watched |
| lastPosition | Int | 0 | Last playback position (seconds) |
| lastWatchedAt | DateTime? | - | Timestamp of last watch |
| completedAt | DateTime? | - | When video was completed |
| createdAt | DateTime | now() | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Indexes:**
```prisma
@@unique([childId, videoId])
@@index([childId, lastWatchedAt])
@@index([childId, isCompleted])
```

**Relations:**
```prisma
child ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
video AbekaVideo @relation(fields: [videoId], references: [id], onDelete: Cascade)
```

---

### Model 2: ChildEarnedBadge

**Source:** Migration SQL lines 274-285  
**Purpose:** Track badges earned by each child

**Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| id | String @id @default(cuid()) | auto | Primary key |
| childId | String | - | FK to ChildProfile |
| badgeId | String | - | FK to AbekaBadge |
| earnedAt | DateTime | now() | When badge was earned |
| earnedContext | Json? | - | Context of how badge was earned |
| isNew | Boolean | true | Has child viewed the badge |
| viewedAt | DateTime? | - | When child viewed the badge |

**Indexes:**
```prisma
@@unique([childId, badgeId])
@@index([childId, earnedAt])
```

**Relations:**
```prisma
child ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
badge AbekaBadge @relation(fields: [badgeId], references: [id], onDelete: Cascade)
```

---

### Model 3: AbekaBadge

**Source:** Migration SQL lines 253-273  
**Purpose:** Define achievement badges available in the system

**Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| id | String @id @default(cuid()) | auto | Primary key |
| code | String | - | Unique badge code (e.g., "FIRST_LESSON") |
| name | String | - | Badge name (English) |
| nameVi | String | - | Badge name (Vietnamese) |
| description | String | - | Description (English) |
| descriptionVi | String | - | Description (Vietnamese) |
| iconUrl | String | - | URL to badge icon |
| colorHex | String | '#FFD700' | Badge color |
| animationUrl | String? | - | URL to badge animation |
| requirementType | String | - | Type: 'lessons', 'streak', 'time', 'subject_mastery' |
| requirementValue | Int | - | Numeric threshold |
| isSecret | Boolean | false | Hidden until earned |
| orderNo | Int | - | Display order |
| status | ContentStatus | PUBLISHED | Badge availability |
| createdAt | DateTime | now() | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Indexes:**
```prisma
@@unique([code])
@@index([requirementType])
```

**Relations:**
```prisma
earnedBadges ChildEarnedBadge[]
```

---

### Model 4: AbekaWeeklyPlan

**Source:** Migration SQL lines 104-119  
**Purpose:** Weekly learning schedule within a journey

**Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| id | String @id @default(cuid()) | auto | Primary key |
| journeyId | String | - | FK to AbekaLearningJourney |
| weekNumber | Int | - | Week number (1-52) |
| startDate | DateTime | - | Week start date |
| endDate | DateTime | - | Week end date |
| targetLessons | Int | - | Target lessons for week |
| targetMinutes | Int | - | Target learning minutes |
| completedLessons | Int | 0 | Actual completed lessons |
| actualMinutes | Int | 0 | Actual minutes spent |
| status | ContentStatus | PUBLISHED | Plan status |
| createdAt | DateTime | now() | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Indexes:**
```prisma
@@unique([journeyId, weekNumber])
@@index([journeyId, weekNumber])
```

**Relations:**
```prisma
journey AbekaLearningJourney @relation(fields: [journeyId], references: [id], onDelete: Cascade)
dailyPlans AbekaDailyPlan[]
```

---

### Model 5: AbekaDailyPlan

**Source:** Migration SQL lines 121-137  
**Purpose:** Daily learning schedule within a week

**Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| id | String @id @default(cuid()) | auto | Primary key |
| weeklyPlanId | String | - | FK to AbekaWeeklyPlan |
| dayOfWeek | Int | - | Day (1-7, Monday-Sunday) |
| date | DateTime | - | Specific date |
| targetMinutes | Int | 120 | Target minutes for day |
| completedAssignments | Int | 0 | Completed assignments count |
| actualMinutes | Int | 0 | Actual minutes spent |
| isCompleted | Boolean | false | Day fully completed |
| completedAt | DateTime? | - | When day was completed |
| parentNotes | String? | - | Notes from parents |
| createdAt | DateTime | now() | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Indexes:**
```prisma
@@unique([weeklyPlanId, dayOfWeek])
@@index([weeklyPlanId, date])
```

**Relations:**
```prisma
weeklyPlan AbekaWeeklyPlan @relation(fields: [weeklyPlanId], references: [id], onDelete: Cascade)
assignments AbekaAssignment[]
```

---

### Model 6: AbekaStreak

**Source:** Migration SQL lines 200-214  
**Purpose:** Track learning streaks for children

**Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| id | String @id @default(cuid()) | auto | Primary key |
| childId | String | - | FK to ChildProfile |
| currentStreak | Int | 0 | Current consecutive days |
| longestStreak | Int | 0 | Longest streak achieved |
| lastActivityDate | DateTime? | - | Last learning activity date |
| freezeCount | Int | 0 | Available freeze tokens |
| freezeUsedDate | DateTime? | - | When freeze was last used |
| createdAt | DateTime | now() | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Indexes:**
```prisma
@@unique([childId])
```

**Relations:**
```prisma
child ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
histories AbekaStreakHistory[]
```

---

### Model 7: AbekaStreakHistory

**Source:** Migration SQL lines 216-230  
**Purpose:** Daily streak history records

**Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| id | String @id @default(cuid()) | auto | Primary key |
| streakId | String | - | FK to AbekaStreak |
| date | DateTime | - | Activity date |
| streakCount | Int | - | Streak count on this date |
| activityMinutes | Int | - | Minutes learned |
| lessonsCompleted | Int | - | Lessons completed |
| streakMaintained | Boolean | true | Whether streak continued |
| freezeUsed | Boolean | false | Whether freeze was used |
| createdAt | DateTime | now() | Creation timestamp |

**Indexes:**
```prisma
@@unique([streakId, date])
@@index([streakId, date])
```

**Relations:**
```prisma
streak AbekaStreak @relation(fields: [streakId], references: [id], onDelete: Cascade)
```

---

### Model 8: AbekaSkillNode

**Source:** Migration SQL lines 232-251  
**Purpose:** Skill tree nodes for visualizing learning progress

**Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| id | String @id @default(cuid()) | auto | Primary key |
| gradeId | String | - | FK to AbekaGrade |
| parentId | String? | - | FK to parent skill node (self-relation) |
| subjectCode | AbekaSubjectCode | - | Subject |
| name | String | - | Skill name (English) |
| nameVi | String | - | Skill name (Vietnamese) |
| description | String? | - | Skill description |
| iconEmoji | String? | - | Display icon |
| positionX | Float | 0 | X position in skill tree |
| positionY | Float | 0 | Y position in skill tree |
| requiredLessons | Int[] | - | Lesson numbers required |
| status | ContentStatus | PUBLISHED | Node status |
| createdAt | DateTime | now() | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Indexes:**
```prisma
@@index([gradeId, subjectCode])
@@index([parentId])
```

**Relations:**
```prisma
grade AbekaGrade @relation(fields: [gradeId], references: [id], onDelete: Cascade)
parent AbekaSkillNode? @relation("SkillTree", fields: [parentId], references: [id], onDelete: SetNull)
children AbekaSkillNode[] @relation("SkillTree")
prerequisites AbekaSkillPrerequisite[] @relation("DependentSkill")
dependents AbekaSkillPrerequisite[] @relation("PrereqSkill")
childProgress ChildSkillProgress[]
```

---

### Model 9: AbekaSkillPrerequisite

**Source:** Migration SQL lines 252-262  
**Purpose:** Define skill prerequisites/dependencies

**Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| id | String @id @default(cuid()) | auto | Primary key |
| skillId | String | - | FK to dependent skill |
| prerequisiteId | String | - | FK to prerequisite skill |

**Indexes:**
```prisma
@@unique([skillId, prerequisiteId])
```

**Relations:**
```prisma
skill AbekaSkillNode @relation("DependentSkill", fields: [skillId], references: [id], onDelete: Cascade)
prerequisite AbekaSkillNode @relation("PrereqSkill", fields: [prerequisiteId], references: [id], onDelete: Cascade)
```

---

### Model 10: ChildSkillProgress

**Source:** Migration SQL lines 263-280  
**Purpose:** Track child's progress through skill tree

**Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| id | String @id @default(cuid()) | auto | Primary key |
| childId | String | - | FK to ChildProfile |
| skillNodeId | String | - | FK to AbekaSkillNode |
| status | String | 'locked' | Status: 'locked', 'unlocked', 'in_progress', 'completed' |
| progressPercent | Int | 0 | Completion percentage |
| unlockedAt | DateTime? | - | When skill was unlocked |
| startedAt | DateTime? | - | When child started skill |
| completedAt | DateTime? | - | When skill was completed |
| createdAt | DateTime | now() | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Indexes:**
```prisma
@@unique([childId, skillNodeId])
@@index([childId, status])
```

**Relations:**
```prisma
child ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
skillNode AbekaSkillNode @relation(fields: [skillNodeId], references: [id], onDelete: Cascade)
```

---

### Model 11: ChildGradeProgress

**Source:** Migration SQL lines 181-198  
**Purpose:** Track overall grade-level progress for each child

**Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| id | String @id @default(cuid()) | auto | Primary key |
| childId | String | - | FK to ChildProfile |
| gradeId | String | - | FK to AbekaGrade |
| currentLessonNo | Int | 1 | Current lesson number |
| totalLessons | Int | - | Total lessons in grade |
| completedLessons | Int | 0 | Completed lessons count |
| totalMinutes | Int | 0 | Total minutes learned |
| subjectProgress | Json? | - | Per-subject progress data |
| startedAt | DateTime | now() | When grade was started |
| completedAt | DateTime? | - | When grade was completed |
| createdAt | DateTime | now() | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Indexes:**
```prisma
@@unique([childId, gradeId])
@@index([childId, gradeId])
```

**Relations:**
```prisma
child ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
grade AbekaGrade @relation(fields: [gradeId], references: [id], onDelete: Cascade)
```

---

### Model 12: AbekaParentPreferences

**Source:** Migration SQL lines 286-304  
**Purpose:** Store parent preferences for Abeka curriculum

**Fields:**
| Field | Type | Default | Description |
|-------|------|---------|-------------|
| id | String @id @default(cuid()) | auto | Primary key |
| parentId | String | - | FK to ParentAccount |
| defaultStartTime | String | '08:00' | Default daily start time |
| defaultDaysPerWeek | Int | 5 | Days per week target |
| defaultMinutesPerDay | Int | 120 | Minutes per day target |
| notifyOnLessonComplete | Boolean | true | Notify when lesson completed |
| notifyOnStreakMilestone | Boolean | true | Notify on streak milestones |
| notifyWeeklyProgress | Boolean | true | Weekly progress notifications |
| preferredSubjects | AbekaSubjectCode[] | - | Subjects to prioritize |
| skipSubjects | AbekaSubjectCode[] | - | Subjects to skip |
| showBibleContent | Boolean | true | Show Bible content |
| showSkillTree | Boolean | true | Show skill tree UI |
| createdAt | DateTime | now() | Creation timestamp |
| updatedAt | DateTime | @updatedAt | Last update timestamp |

**Indexes:**
```prisma
@@unique([parentId])
```

**Relations:**
```prisma
parent ParentAccount @relation(fields: [parentId], references: [id], onDelete: Cascade)
```

---

## Current Schema Issues

### Issue 1: AbekaProgress vs AbekaWatchProgress

**Problem:** The schema has `AbekaProgress` but the migration and code expect `AbekaWatchProgress`.

**Migration SQL (correct):**
```sql
CREATE TABLE "AbekaWatchProgress" (
    "watchPercent" INTEGER NOT NULL DEFAULT 0,
    "watchSeconds" INTEGER NOT NULL DEFAULT 0,
    ...
)
```

**Current Schema (incorrect):**
```prisma
model AbekaProgress {
  watchedMinutes        Int      @default(0)
  // Missing: watchPercent, watchSeconds
  ...
}
```

**Resolution:** Rename `AbekaProgress` to `AbekaWatchProgress` and add missing fields.

### Issue 2: Missing Relations

The following models need relation fields added to existing models:

1. **ChildProfile** needs:
   - `abekaWatchProgress AbekaWatchProgress[]`
   - `childEarnedBadges ChildEarnedBadge[]`
   - `childSkillProgress ChildSkillProgress[]`
   - `childGradeProgress ChildGradeProgress[]`
   - `abekaStreak AbekaStreak?`

2. **ParentAccount** needs:
   - `abekaParentPreferences AbekaParentPreferences?`

3. **AbekaVideo** needs:
   - `watchProgress AbekaWatchProgress[]` (already has `AbekaProgress[]`)

4. **AbekaGrade** needs:
   - `childGradeProgress ChildGradeProgress[]`
   - `skillNodes AbekaSkillNode[]`

5. **AbekaLearningJourney** needs:
   - `weeklyPlans AbekaWeeklyPlan[]`

---

## Implementation Phases

### Phase 1: Schema Update (2 hours)
**Priority: P1 - CRITICAL**

1. **Backup current schema**
   ```bash
   cp prisma/schema.prisma prisma/schema.prisma.backup
   ```

2. **Rename AbekaProgress → AbekaWatchProgress**
   - Add missing fields: `watchPercent`, `watchSeconds`, `durationSeconds`, `lastPosition`
   - Update field names to match migration
   - Update relation references

3. **Add all 12 missing models** in order:
   - AbekaWatchProgress (renamed from AbekaProgress)
   - AbekaBadge
   - ChildEarnedBadge
   - AbekaWeeklyPlan
   - AbekaDailyPlan
   - AbekaStreak
   - AbekaStreakHistory
   - AbekaSkillNode
   - AbekaSkillPrerequisite
   - ChildSkillProgress
   - ChildGradeProgress
   - AbekaParentPreferences

4. **Add relations to existing models:**
   - Update `ChildProfile` model
   - Update `ParentAccount` model
   - Update `AbekaVideo` model
   - Update `AbekaGrade` model
   - Update `AbekaLearningJourney` model

5. **Validate schema syntax**
   ```bash
   npx prisma validate
   ```

**Deliverable:** Updated `prisma/schema.prisma` with all models

---

### Phase 2: Code Migration (1.5 hours)
**Priority: P1 - CRITICAL**

Update code references from `abekaProgress` to `abekaWatchProgress`:

**Files to update:**

1. **app/api/abeka/progress/watch/route.ts**
   - Line ~30: `prisma.abekaProgress.findMany` → `prisma.abekaWatchProgress.findMany`
   - Update include/select fields to match new schema

2. **app/api/curriculum/complete/route.ts**
   - Line ~82: `prisma.abekaWatchProgress.upsert` → verify exists
   - Line ~130: `prisma.abekaWatchProgress.aggregate` → verify exists

3. **app/api/curriculum/badges/check/route.ts**
   - Line ~35: `prisma.abekaWatchProgress.aggregate` → verify exists

4. **Any other files referencing `abekaProgress`**
   - Search: `grep -r "abekaProgress" --include="*.ts" --include="*.tsx" app/ src/`

**Deliverable:** All code using new model names

---

### Phase 3: Prisma Generate & Type Check (1 hour)
**Priority: P1 - CRITICAL**

1. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

2. **Run TypeScript check**
   ```bash
   npx tsc --noEmit
   ```

3. **Fix any type errors**
   - Review all errors
   - Fix field name mismatches
   - Update type imports

**Deliverable:** Clean TypeScript build

---

### Phase 4: Database Verification (0.5 hours)
**Priority: P2 - HIGH**

1. **Verify schema matches database**
   ```bash
   npx prisma db pull --dry-run
   ```

2. **Check for drift**
   ```bash
   npx prisma migrate status
   ```

3. **If drift exists, create baseline**
   ```bash
   npx prisma migrate resolve --applied 20260221000000_abeka_curriculum_system
   ```

**Deliverable:** Verified schema-database alignment

---

### Phase 5: Testing & Validation (1 hour)
**Priority: P2 - HIGH**

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Run affected API tests**
   - Test watch progress endpoints
   - Test badge check endpoints
   - Test completion endpoints

3. **Verify seeders work**
   ```bash
   pnpm db:seed:abeka --dry-run
   ```

**Deliverable:** Successful build and tests

---

## SQL Migration Reference

**Migration File:** `prisma/migrations/20260221000000_abeka_curriculum_system/migration.sql`

**Key SQL patterns to replicate:**

### Table Creation Pattern
```sql
CREATE TABLE "TableName" (
    "id" TEXT NOT NULL,
    "fieldName" TYPE [NOT] NULL [DEFAULT value],
    ...
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TableName_pkey" PRIMARY KEY ("id")
);
```

### Index Creation Pattern
```sql
CREATE UNIQUE INDEX "TableName_uniqueFields_key" ON "TableName"("field1", "field2");
CREATE INDEX "TableName_field1_field2_idx" ON "TableName"("field1", "field2");
```

### Foreign Key Pattern
```sql
ALTER TABLE "ChildTable" 
ADD CONSTRAINT "ChildTable_parentId_fkey" 
FOREIGN KEY ("parentId") REFERENCES "ParentTable"("id") 
ON DELETE CASCADE ON UPDATE CASCADE;
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Schema syntax error | Low | High | Run `prisma validate` after each change |
| Field name mismatch | Medium | High | Compare every field with migration SQL |
| Missing relation | Medium | Medium | Check all foreign keys in migration |
| Build failure | Medium | High | Full TypeScript check after changes |
| Data loss | Very Low | Critical | No data migration needed - tables already exist |
| Production regression | Low | Critical | Deploy to staging first |

---

## Testing Strategy

### Unit Tests
- No new unit tests needed for schema changes

### Integration Tests
1. **API Endpoint Tests:**
   ```bash
   # Test watch progress
   curl /api/abeka/progress/watch?childId=xxx
   
   # Test badge check
   curl -X POST /api/curriculum/badges/check -d '{"childId":"xxx"}'
   
   # Test completion
   curl -X POST /api/curriculum/complete -d '{"childId":"xxx","assignmentId":"xxx"}'
   ```

2. **Database Integration:**
   - Verify all models can be queried
   - Verify relations work correctly
   - Verify indexes are used

### Build Tests
```bash
# Clean build
rm -rf .next
npm run build

# Type check
npx tsc --noEmit

# Prisma validation
npx prisma validate
```

---

## Rollback Plan

If issues occur:

1. **Restore schema backup:**
   ```bash
   cp prisma/schema.prisma.backup prisma/schema.prisma
   ```

2. **Regenerate Prisma client:**
   ```bash
   npx prisma generate
   ```

3. **Verify database unchanged:**
   - Database tables remain intact
   - No data loss occurs

---

## Success Criteria

- [ ] All 12 missing models added to schema
- [ ] `AbekaProgress` renamed to `AbekaWatchProgress` with correct fields
- [ ] All relations defined correctly
- [ ] All indexes from migration included
- [ ] `npx prisma validate` passes
- [ ] `npx tsc --noEmit` passes (no TypeScript errors)
- [ ] `npm run build` succeeds
- [ ] All affected API files compile
- [ ] Seeders compile without errors

---

## Unresolved Questions

1. Should `AbekaProgress` be kept as an alias or completely replaced by `AbekaWatchProgress`?
   - **Answer:** Replace completely. Migration SQL has `AbekaWatchProgress`.

2. Are there any other files using `abekaProgress` that weren't listed?
   - Need to run full grep to verify.

3. Should we add the inverse relations to all models at once or incrementally?
   - **Answer:** All at once to ensure referential integrity.

---

## Appendix: Complete Model Definitions

### Prisma Schema Location
Insert all new models **before** the `// ========== END ABEKA CURRICULUM SYSTEM ==========` comment at line 1654.

### Insertion Order
1. First: Independent models (AbekaBadge, AbekaParentPreferences)
2. Second: Models with simple relations (AbekaWeeklyPlan, AbekaDailyPlan)
3. Third: Complex relation models (AbekaStreak, AbekaStreakHistory)
4. Fourth: Skill tree models (AbekaSkillNode, AbekaSkillPrerequisite, ChildSkillProgress)
5. Fifth: Progress models (AbekaWatchProgress, ChildGradeProgress, ChildEarnedBadge)

### Naming Conventions to Follow
- **Models:** PascalCase (e.g., `AbekaWatchProgress`)
- **Fields:** camelCase (e.g., `watchPercent`)
- **Enums:** PascalCase (e.g., `AbekaSubjectCode`)
- **Relations:** camelCase, descriptive (e.g., `earnedBadges`)
- **Indexes:** snake_case in @@index names

---

**Plan Created:** 2026-04-04  
**Author:** Claude (OpenCode)  
**Review Required:** Yes - Before implementation  
**Estimated Completion:** 6 hours

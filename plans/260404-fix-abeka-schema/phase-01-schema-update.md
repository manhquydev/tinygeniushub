# Phase 1: Schema Update

**Phase ID:** phase-01-schema-update  
**Priority:** P1 - CRITICAL  
**Estimated Time:** 2 hours  
**Dependencies:** None

---

## Overview

This phase involves updating the Prisma schema to add all 12 missing Abeka curriculum models. This is the foundation for fixing the build errors and enabling production deployment.

---

## Steps

### Step 1.1: Backup Current Schema (5 min)

**Command:**
```bash
cp prisma/schema.prisma prisma/schema.prisma.backup.$(date +%Y%m%d-%H%M%S)
```

**Verification:**
```bash
ls -la prisma/schema.prisma.backup.*
```

---

### Step 1.2: Rename AbekaProgress to AbekaWatchProgress (15 min)

**Current Model (lines 1630-1652):**
```prisma
model AbekaProgress {
  id                    String   @id @default(cuid())
  childId               String
  gradeId               String
  lessonId              String
  subjectCode           AbekaSubjectCode
  videoId               String
  watchedMinutes        Int      @default(0)
  isCompleted           Boolean  @default(false)
  completedAt           DateTime?
  lastPositionSeconds   Int      @default(0)
  watchCount            Int      @default(0)
  lastWatchedAt         DateTime @default(now())
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  video                 AbekaVideo @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@unique([childId, videoId])
  @@index([childId, gradeId])
  @@index([completedAt])
  @@index([lastWatchedAt])
}
```

**Required Changes:**
1. Rename model: `AbekaProgress` → `AbekaWatchProgress`
2. Add fields from migration:
   - `watchPercent Int @default(0)`
   - `watchSeconds Int @default(0)`
   - `durationSeconds Int?`
   - `lastPosition Int @default(0)` (replacing `lastPositionSeconds`)
   - Remove `watchedMinutes` (not in migration)
   - Remove `watchCount` (not in migration)
   - Remove `gradeId` (not in migration)
   - Remove `lessonId` (not in migration)
   - Remove `subjectCode` (not in migration)
3. Add relation to ChildProfile

**New Model:**
```prisma
model AbekaWatchProgress {
  id                    String   @id @default(cuid())
  childId               String
  videoId               String
  watchPercent          Int      @default(0)
  watchSeconds          Int      @default(0)
  durationSeconds       Int?
  isCompleted           Boolean  @default(false)
  lastPosition          Int      @default(0)
  lastWatchedAt         DateTime?
  completedAt           DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  child                 ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  video                 AbekaVideo @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@unique([childId, videoId])
  @@index([childId, lastWatchedAt])
  @@index([childId, isCompleted])
}
```

**Update AbekaVideo relation:**
Change:
```prisma
progress        AbekaProgress[]
```
To:
```prisma
watchProgress   AbekaWatchProgress[]
```

---

### Step 1.3: Add AbekaBadge Model (10 min)

**Insert after AbekaWatchProgress:**
```prisma
model AbekaBadge {
  id                String        @id @default(cuid())
  code              String        @unique
  name              String
  nameVi            String
  description       String
  descriptionVi     String
  iconUrl           String
  colorHex          String        @default("#FFD700")
  animationUrl      String?
  requirementType   String
  requirementValue  Int
  isSecret          Boolean       @default(false)
  orderNo           Int
  status            ContentStatus @default(PUBLISHED)
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  earnedBadges      ChildEarnedBadge[]

  @@index([requirementType])
}
```

---

### Step 1.4: Add ChildEarnedBadge Model (10 min)

**Insert after AbekaBadge:**
```prisma
model ChildEarnedBadge {
  id            String    @id @default(cuid())
  childId       String
  badgeId       String
  earnedAt      DateTime  @default(now())
  earnedContext Json?
  isNew         Boolean   @default(true)
  viewedAt      DateTime?

  child         ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  badge         AbekaBadge   @relation(fields: [badgeId], references: [id], onDelete: Cascade)

  @@unique([childId, badgeId])
  @@index([childId, earnedAt])
}
```

---

### Step 1.5: Add AbekaWeeklyPlan Model (10 min)

**Insert after ChildEarnedBadge:**
```prisma
model AbekaWeeklyPlan {
  id                String            @id @default(cuid())
  journeyId         String
  weekNumber        Int
  startDate         DateTime
  endDate           DateTime
  targetLessons     Int
  targetMinutes     Int
  completedLessons  Int               @default(0)
  actualMinutes     Int               @default(0)
  status            ContentStatus     @default(PUBLISHED)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  journey           AbekaLearningJourney @relation(fields: [journeyId], references: [id], onDelete: Cascade)
  dailyPlans        AbekaDailyPlan[]

  @@unique([journeyId, weekNumber])
  @@index([journeyId, weekNumber])
}
```

---

### Step 1.6: Add AbekaDailyPlan Model (10 min)

**Insert after AbekaWeeklyPlan:**
```prisma
model AbekaDailyPlan {
  id                    String            @id @default(cuid())
  weeklyPlanId          String
  dayOfWeek             Int
  date                  DateTime
  targetMinutes         Int               @default(120)
  completedAssignments  Int               @default(0)
  actualMinutes         Int               @default(0)
  isCompleted           Boolean           @default(false)
  completedAt           DateTime?
  parentNotes           String?
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt

  weeklyPlan            AbekaWeeklyPlan @relation(fields: [weeklyPlanId], references: [id], onDelete: Cascade)
  assignments           AbekaAssignment[]

  @@unique([weeklyPlanId, dayOfWeek])
  @@index([weeklyPlanId, date])
}
```

---

### Step 1.7: Update AbekaAssignment Model (10 min)

**Current Model needs updating:**

Add field:
```prisma
dailyPlanId     String
```

Add relation:
```prisma
dailyPlan       AbekaDailyPlan @relation(fields: [dailyPlanId], references: [id], onDelete: Cascade)
```

Add index:
```prisma
@@index([dailyPlanId, status])
@@index([dailyPlanId, orderNo])
```

**Note:** The assignment model needs to be updated to reference daily plans instead of journeys directly.

---

### Step 1.8: Add AbekaStreak Model (10 min)

**Insert after AbekaDailyPlan:**
```prisma
model AbekaStreak {
  id                String    @id @default(cuid())
  childId           String    @unique
  currentStreak     Int       @default(0)
  longestStreak     Int       @default(0)
  lastActivityDate  DateTime?
  freezeCount       Int       @default(0)
  freezeUsedDate    DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  child             ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  histories         AbekaStreakHistory[]
}
```

---

### Step 1.9: Add AbekaStreakHistory Model (10 min)

**Insert after AbekaStreak:**
```prisma
model AbekaStreakHistory {
  id                String    @id @default(cuid())
  streakId          String
  date              DateTime
  streakCount       Int
  activityMinutes   Int
  lessonsCompleted  Int
  streakMaintained  Boolean   @default(true)
  freezeUsed        Boolean   @default(false)
  createdAt         DateTime  @default(now())

  streak            AbekaStreak @relation(fields: [streakId], references: [id], onDelete: Cascade)

  @@unique([streakId, date])
  @@index([streakId, date])
}
```

---

### Step 1.10: Add AbekaSkillNode Model (10 min)

**Insert after AbekaStreakHistory:**
```prisma
model AbekaSkillNode {
  id                String            @id @default(cuid())
  gradeId           String
  parentId          String?
  subjectCode       AbekaSubjectCode
  name              String
  nameVi            String
  description       String?
  iconEmoji         String?
  positionX         Float             @default(0)
  positionY         Float             @default(0)
  requiredLessons   Int[]
  status            ContentStatus     @default(PUBLISHED)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  grade             AbekaGrade        @relation(fields: [gradeId], references: [id], onDelete: Cascade)
  parent            AbekaSkillNode?   @relation("SkillTree", fields: [parentId], references: [id], onDelete: SetNull)
  children          AbekaSkillNode[]  @relation("SkillTree")
  prerequisites     AbekaSkillPrerequisite[] @relation("DependentSkill")
  dependents        AbekaSkillPrerequisite[] @relation("PrereqSkill")
  childProgress     ChildSkillProgress[]

  @@index([gradeId, subjectCode])
  @@index([parentId])
}
```

---

### Step 1.11: Add AbekaSkillPrerequisite Model (10 min)

**Insert after AbekaSkillNode:**
```prisma
model AbekaSkillPrerequisite {
  id                String    @id @default(cuid())
  skillId           String
  prerequisiteId    String

  skill             AbekaSkillNode @relation("DependentSkill", fields: [skillId], references: [id], onDelete: Cascade)
  prerequisite      AbekaSkillNode @relation("PrereqSkill", fields: [prerequisiteId], references: [id], onDelete: Cascade)

  @@unique([skillId, prerequisiteId])
}
```

---

### Step 1.12: Add ChildSkillProgress Model (10 min)

**Insert after AbekaSkillPrerequisite:**
```prisma
model ChildSkillProgress {
  id                String    @id @default(cuid())
  childId           String
  skillNodeId       String
  status            String    @default("locked")
  progressPercent   Int       @default(0)
  unlockedAt        DateTime?
  startedAt         DateTime?
  completedAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  child             ChildProfile   @relation(fields: [childId], references: [id], onDelete: Cascade)
  skillNode         AbekaSkillNode @relation(fields: [skillNodeId], references: [id], onDelete: Cascade)

  @@unique([childId, skillNodeId])
  @@index([childId, status])
}
```

---

### Step 1.13: Add ChildGradeProgress Model (10 min)

**Insert after ChildSkillProgress:**
```prisma
model ChildGradeProgress {
  id                String    @id @default(cuid())
  childId           String
  gradeId           String
  currentLessonNo   Int       @default(1)
  totalLessons      Int
  completedLessons  Int       @default(0)
  totalMinutes      Int       @default(0)
  subjectProgress   Json?
  startedAt         DateTime  @default(now())
  completedAt       DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  child             ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  grade             AbekaGrade   @relation(fields: [gradeId], references: [id], onDelete: Cascade)

  @@unique([childId, gradeId])
  @@index([childId, gradeId])
}
```

---

### Step 1.14: Add AbekaParentPreferences Model (10 min)

**Insert after ChildGradeProgress:**
```prisma
model AbekaParentPreferences {
  id                      String            @id @default(cuid())
  parentId                String            @unique
  defaultStartTime        String            @default("08:00")
  defaultDaysPerWeek      Int               @default(5)
  defaultMinutesPerDay    Int               @default(120)
  notifyOnLessonComplete  Boolean           @default(true)
  notifyOnStreakMilestone Boolean           @default(true)
  notifyWeeklyProgress    Boolean           @default(true)
  preferredSubjects       AbekaSubjectCode[]
  skipSubjects            AbekaSubjectCode[]
  showBibleContent        Boolean           @default(true)
  showSkillTree           Boolean           @default(true)
  createdAt               DateTime          @default(now())
  updatedAt               DateTime          @updatedAt

  parent                  ParentAccount     @relation(fields: [parentId], references: [id], onDelete: Cascade)
}
```

---

### Step 1.15: Update ChildProfile Relations (10 min)

**Add to ChildProfile model:**
```prisma
  // Abeka Curriculum Relations
  abekaJourneys         AbekaLearningJourney[]
  abekaWatchProgress    AbekaWatchProgress[]
  childEarnedBadges     ChildEarnedBadge[]
  childSkillProgress    ChildSkillProgress[]
  childGradeProgress    ChildGradeProgress[]
  abekaStreak           AbekaStreak?
```

---

### Step 1.16: Update ParentAccount Relations (5 min)

**Add to ParentAccount model:**
```prisma
  // Abeka Parent Preferences
  abekaParentPreferences AbekaParentPreferences?
```

---

### Step 1.17: Update AbekaGrade Relations (5 min)

**Add to AbekaGrade model:**
```prisma
  childGradeProgress    ChildGradeProgress[]
  skillNodes            AbekaSkillNode[]
```

---

### Step 1.18: Update AbekaLearningJourney Relations (5 min)

**Add to AbekaLearningJourney model:**
```prisma
  weeklyPlans           AbekaWeeklyPlan[]
```

---

### Step 1.19: Validate Schema (10 min)

**Command:**
```bash
npx prisma validate
```

**Expected Output:**
```
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database
✔ Valid schema
```

**If errors:**
- Read error messages carefully
- Fix syntax issues
- Re-run validate until clean

---

## Deliverables

1. ✅ Updated `prisma/schema.prisma` with all 12 missing models
2. ✅ Renamed `AbekaProgress` → `AbekaWatchProgress` with correct fields
3. ✅ All relations properly defined
4. ✅ All indexes from migration included
5. ✅ `npx prisma validate` passes

---

## Verification Checklist

- [ ] Backup created successfully
- [ ] AbekaProgress renamed to AbekaWatchProgress
- [ ] AbekaBadge model added
- [ ] ChildEarnedBadge model added
- [ ] AbekaWeeklyPlan model added
- [ ] AbekaDailyPlan model added
- [ ] AbekaStreak model added
- [ ] AbekaStreakHistory model added
- [ ] AbekaSkillNode model added
- [ ] AbekaSkillPrerequisite model added
- [ ] ChildSkillProgress model added
- [ ] ChildGradeProgress model added
- [ ] AbekaParentPreferences model added
- [ ] ChildProfile relations updated
- [ ] ParentAccount relations updated
- [ ] AbekaGrade relations updated
- [ ] AbekaLearningJourney relations updated
- [ ] Schema validation passes

---

## Notes

1. **Order matters:** Add models in the order specified to avoid forward reference errors
2. **Relations:** Self-referential relations (SkillNode → SkillNode) use the `@relation("Name")` syntax
3. **Indexes:** Must match the migration SQL exactly
4. **Enum arrays:** Use `AbekaSubjectCode[]` for array fields

---

**Phase 1 Complete → Proceed to Phase 2: Code Migration**

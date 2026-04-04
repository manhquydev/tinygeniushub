# Abeka Curriculum Database Schema Design

## Overview

Database schema for organizing 20,195 Abeka curriculum videos across 14 grades (K4-12), with flexible learning paths, progress tracking, and assignment management.

---

## 1. Curriculum Tables (Read-Only, Synced from Abeka)

### 1.1 Grade

Maps to Abeka's grade levels K4 through 12.

```prisma
model AbekaGrade {
  id          String    @id @default(cuid())
  code        String    @unique // "K4", "K5", "1", "2", ..., "12"
  name        String    // "Kindergarten 4", "Grade 1", etc.
  displayName String    // "Lớp Mầm 4 tuổi", "Lớp 1"
  orderNo     Int       // 0=K4, 1=K5, 2=Grade1, etc.
  isActive    Boolean   @default(true)
  metadata    Json?     // Abeka-specific metadata
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  subjects    AbekaSubject[]
  journeys    LearningJourney[]

  @@index([orderNo])
  @@index([isActive])
}
```

### 1.2 Subject

Subjects within each grade (Phonics, Math, Science, etc.)

```prisma
model AbekaSubject {
  id          String    @id @default(cuid())
  gradeId     String
  code        String    // "PHONICS", "MATH", "SCIENCE", "BIBLE"
  name        String    // "Phonics"
  displayName String    // "Phonics - Học vần"
  orderNo     Int       // Order within grade
  color       String?   // UI color coding
  iconUrl     String?   // Subject icon
  isActive    Boolean   @default(true)
  metadata    Json?     // Abeka subject metadata
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  grade   AbekaGrade @relation(fields: [gradeId], references: [id], onDelete: Cascade)
  lessons AbekaLesson[]

  @@unique([gradeId, code])
  @@index([gradeId, orderNo])
}
```

### 1.3 Lesson

170 lessons per grade, mapped to existing Lesson model via bridge table.

```prisma
model AbekaLesson {
  id          String    @id @default(cuid())
  subjectId   String
  lessonNo    Int       // 1-170
  code        String    // "K4-PHONICS-001"
  title       String
  description String?
  objective   String?
  durationMin Int       @default(30)
  orderNo     Int       // Sequential order within subject
  isActive    Boolean   @default(true)
  metadata    Json?     // Abeka lesson metadata
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  subject      AbekaSubject      @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  videos       AbekaVideo[]
  lessonLinks  LessonPackageItem[]
  prerequisites AbekaLessonPrereq[] @relation("LessonPrereqs")
  dependents   AbekaLessonPrereq[] @relation("LessonDependents")

  @@unique([subjectId, lessonNo])
  @@unique([subjectId, code])
  @@index([subjectId, orderNo])
  @@index([isActive])
}
```

### 1.4 Video

Atomic video units with CDN references.

```prisma
model AbekaVideo {
  id          String    @id @default(cuid())
  lessonId    String
  code        String    @unique // "K4-PHONICS-001-V1"
  title       String
  description String?
  segmentNo   Int       // 1, 2, 3 for multi-segment lessons
  durationSec Int
  cdnUrl      String    // hoctienganh.xyz URL
  thumbnailUrl String?
  transcript  String?   @db.Text // Video transcript for search
  tags        String[]  // Searchable tags
  isActive    Boolean   @default(true)
  metadata    Json?     // CDN metadata, quality variants
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Relations
  lesson            AbekaLesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  watchProgresses   VideoWatchProgress[]

  @@unique([lessonId, segmentNo])
  @@index([lessonId])
  @@index([code])
  @@index([tags])
}
```

### 1.5 Lesson Prerequisite Chain

Enables prerequisite relationships between lessons.

```prisma
model AbekaLessonPrereq {
  id             String @id @default(cuid())
  lessonId       String // The lesson that has prerequisites
  prerequisiteId String // The required prerequisite lesson
  isStrict       Boolean @default(true) // Must complete before access
  minWatchPercent Int @default(80) // Required watch % for completion

  lesson       AbekaLesson @relation("LessonPrereqs", fields: [lessonId], references: [id], onDelete: Cascade)
  prerequisite AbekaLesson @relation("LessonDependents", fields: [prerequisiteId], references: [id], onDelete: Cascade)

  @@unique([lessonId, prerequisiteId])
  @@index([lessonId])
  @@index([prerequisiteId])
}
```

---

## 2. Learning Structure Tables

### 2.1 LearningJourney

Top-level organizational unit mapping to Grade or custom paths.

```prisma
enum JourneyType {
  ABEKA_GRADE      // Standard Abeka grade path
  CUSTOM_PATH      // Custom learning path
  REMEDIAL         // Remedial/summer school path
  ACCELERATED      // Accelerated learning path
}

enum JourneyStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model LearningJourney {
  id          String        @id @default(cuid())
  type        JourneyType   @default(ABEKA_GRADE)
  abekaGradeId String?      // Nullable for custom paths
  name        String        // "Grade 1 Complete Curriculum"
  description String?
  authorId    String?       // Parent/teacher who created custom path
  status      JourneyStatus @default(DRAFT)
  totalWeeks  Int           @default(36) // Standard school year
  targetDailyMin Int       @default(30)
  isDefault   Boolean       @default(false) // System default for grade
  metadata    Json?         // Custom configuration
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  // Relations
  abekaGrade    AbekaGrade?    @relation(fields: [abekaGradeId], references: [id], onDelete: SetNull)
  author        ParentAccount? @relation(fields: [authorId], references: [id], onDelete: SetNull)
  weeks         WeeklyPlan[]
  userProgress  UserJourneyProgress[]
  childJourneys ChildJourney[]

  @@index([abekaGradeId])
  @@index([authorId])
  @@index([status, isDefault])
  @@index([type, status])
}
```

### 2.2 WeeklyPlan

Subdivides journey into weeks (36 weeks per grade).

```prisma
model WeeklyPlan {
  id          String   @id @default(cuid())
  journeyId   String
  weekNo      Int      // 1-36
  name        String   // "Week 1: Introduction to Phonics"
  description String?
  theme       String?  // Weekly theme/topic
  startDate   DateTime? // Optional fixed start date
  endDate     DateTime?
  isActive    Boolean  @default(true)
  metadata    Json?    // Week-specific config
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  journey       LearningJourney @relation(fields: [journeyId], references: [id], onDelete: Cascade)
  days          DailyPlan[]
  userProgress  UserWeeklyProgress[]

  @@unique([journeyId, weekNo])
  @@index([journeyId, weekNo])
  @@index([isActive])
}
```

### 2.3 DailyPlan

Micro-learning sessions within a week (5 days per week).

```prisma
model DailyPlan {
  id          String   @id @default(cuid())
  weekId      String
  dayNo       Int      // 1-5 (Monday-Friday)
  name        String   // "Day 1: Letter A Sounds"
  description String?
  targetMin   Int      @default(30)
  isReviewDay Boolean  @default(false) // Review/test day
  isActive    Boolean  @default(true)
  metadata    Json?    // Day-specific config
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  week         WeeklyPlan @relation(fields: [weekId], references: [id], onDelete: Cascade)
  packages     LessonPackage[]
  assignments  Assignment[]
  userProgress UserDailyProgress[]

  @@unique([weekId, dayNo])
  @@index([weekId, dayNo])
  @@index([isActive])
}
```

### 2.4 LessonPackage

Groups videos + activities for a daily session.

```prisma
model LessonPackage {
  id           String   @id @default(cuid())
  dailyPlanId  String
  name         String   // "Phonics Session - Lesson 1"
  description  String?
  orderNo      Int      // Order within daily plan
  subjectCodes String[] // ["PHONICS", "MATH"] for filtering
  targetMin    Int      @default(15)
  isRequired   Boolean  @default(true) // Required vs optional
  isActive     Boolean  @default(true)
  metadata     Json?    // Package config
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  dailyPlan DailyPlan         @relation(fields: [dailyPlanId], references: [id], onDelete: Cascade)
  items     LessonPackageItem[]
  
  // For assignments
  assignments Assignment[]

  @@unique([dailyPlanId, orderNo])
  @@index([dailyPlanId, orderNo])
}
```

### 2.5 LessonPackageItem

Bridge linking Abeka lessons to packages with position control.

```prisma
model LessonPackageItem {
  id            String  @id @default(cuid())
  packageId     String
  abekaLessonId String
  orderNo       Int     // Position within package
  isPrimary     Boolean @default(false) // Main lesson vs supplement
  watchPercent  Int     @default(0) // Required watch % for completion
  allowSkip     Boolean @default(false)
  notes         String? // Teacher/parent notes

  package     LessonPackage @relation(fields: [packageId], references: [id], onDelete: Cascade)
  abekaLesson AbekaLesson   @relation(fields: [abekaLessonId], references: [id], onDelete: Cascade)

  @@unique([packageId, abekaLessonId])
  @@unique([packageId, orderNo])
  @@index([abekaLessonId])
}
```

---

## 3. User Progress Tables

### 3.1 UserJourneyProgress

Child's progress through a LearningJourney.

```prisma
model UserJourneyProgress {
  id              String    @id @default(cuid())
  childId         String
  journeyId       String
  startedAt       DateTime  @default(now())
  completedAt     DateTime?
  currentWeekNo   Int       @default(1)
  currentDayNo    Int       @default(1)
  totalProgress   Float     @default(0) // 0-100%
  totalMinutes    Int       @default(0)
  lessonsComplete Int       @default(0)
  lessonsTotal    Int       @default(0)
  streakDays      Int       @default(0)
  lastActivityAt  DateTime?
  isPaused        Boolean   @default(false)
  pausedAt        DateTime?
  metadata        Json?     // Progress snapshot
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  child    ChildProfile    @relation(fields: [childId], references: [id], onDelete: Cascade)
  journey  LearningJourney @relation(fields: [journeyId], references: [id], onDelete: Cascade)
  weeklyProgress UserWeeklyProgress[]
  dailyProgress  UserDailyProgress[]

  @@unique([childId, journeyId])
  @@index([childId, journeyId])
  @@index([childId, lastActivityAt])
  @@index([journeyId, completedAt])
}
```

### 3.2 UserWeeklyProgress

Progress within a specific week.

```prisma
model UserWeeklyProgress {
  id               String   @id @default(cuid())
  childId          String
  journeyProgressId String
  weekId           String
  status           String   @default("NOT_STARTED") // NOT_STARTED, IN_PROGRESS, COMPLETED
  startedAt        DateTime?
  completedAt      DateTime?
  progressPercent  Float    @default(0) // 0-100%
  minutesSpent     Int      @default(0)
  daysCompleted    Int      @default(0)
  daysTotal        Int      @default(5)
  metadata         Json?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  child           ChildProfile        @relation(fields: [childId], references: [id], onDelete: Cascade)
  journeyProgress UserJourneyProgress @relation(fields: [journeyProgressId], references: [id], onDelete: Cascade)
  week            WeeklyPlan          @relation(fields: [weekId], references: [id], onDelete: Cascade)

  @@unique([childId, weekId])
  @@index([childId, weekId])
  @@index([journeyProgressId, status])
}
```

### 3.3 UserDailyProgress

Progress for a specific day.

```prisma
model UserDailyProgress {
  id               String   @id @default(cuid())
  childId          String
  weeklyProgressId String
  dayId            String
  status           String   @default("NOT_STARTED")
  startedAt        DateTime?
  completedAt      DateTime?
  progressPercent  Float    @default(0)
  minutesSpent     Int      @default(0)
  packagesComplete Int      @default(0)
  packagesTotal    Int      @default(0)
  metadata         Json?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  child           ChildProfile        @relation(fields: [childId], references: [id], onDelete: Cascade)
  weeklyProgress  UserWeeklyProgress @relation(fields: [weeklyProgressId], references: [id], onDelete: Cascade)
  day             DailyPlan           @relation(fields: [dayId], references: [id], onDelete: Cascade)
  lessonCompletions UserLessonCompletion[]

  @@unique([childId, dayId])
  @@index([childId, dayId])
  @@index([weeklyProgressId, status])
}
```

### 3.4 UserLessonCompletion

Individual lesson completion tracking.

```prisma
model UserLessonCompletion {
  id              String   @id @default(cuid())
  childId         String
  dailyProgressId String
  packageItemId   String
  abekaLessonId   String
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  watchPercent    Float    @default(0) // Actual watch percentage
  watchDuration   Int      @default(0) // Seconds watched
  isCompleted     Boolean  @default(false)
  completionDate  DateTime?
  score           Int?     // Quiz score if applicable
  notes           String?
  metadata        Json?    // Watch events, pauses, etc.
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  child          ChildProfile       @relation(fields: [childId], references: [id], onDelete: Cascade)
  dailyProgress  UserDailyProgress  @relation(fields: [dailyProgressId], references: [id], onDelete: Cascade)
  packageItem    LessonPackageItem  @relation(fields: [packageItemId], references: [id], onDelete: Cascade)
  abekaLesson    AbekaLesson        @relation(fields: [abekaLessonId], references: [id], onDelete: Cascade)

  @@unique([childId, packageItemId])
  @@index([childId, abekaLessonId])
  @@index([dailyProgressId, isCompleted])
}
```

### 3.5 VideoWatchProgress

Granular video watch tracking.

```prisma
model VideoWatchProgress {
  id           String   @id @default(cuid())
  childId      String
  videoId      String
  lessonCompletionId String?
  watchPercent Float    @default(0)
  watchSeconds Int      @default(0)
  totalSeconds Int      // Video duration
  lastPosition Int      @default(0) // Last playback position
  watchEvents  Json?    // [{start: 10, end: 120}, ...]
  isCompleted  Boolean  @default(false)
  completedAt  DateTime?
  lastWatchedAt DateTime @default(now())
  metadata     Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  child    ChildProfile        @relation(fields: [childId], references: [id], onDelete: Cascade)
  video    AbekaVideo          @relation(fields: [videoId], references: [id], onDelete: Cascade)

  @@unique([childId, videoId])
  @@index([childId, lastWatchedAt])
  @@index([videoId, isCompleted])
}
```

---

## 4. Assignment Tables

### 4.1 Assignment

Parent/teacher assignments linking DailyPlan to students.

```prisma
enum AssignmentStatus {
  DRAFT
  SCHEDULED
  ACTIVE
  COMPLETED
  OVERDUE
  CANCELLED
}

enum AssignmentType {
  DAILY_PLAN    // Complete daily plan
  CUSTOM        // Custom selection
  REVIEW        // Review assignment
  TEST          // Test/quiz
}

model Assignment {
  id              String           @id @default(cuid())
  assignerId      String           // Parent/teacher
  childId         String
  type            AssignmentType   @default(DAILY_PLAN)
  dailyPlanId     String?          // For DAILY_PLAN type
  // For CUSTOM type, items stored in AssignmentItem
  name            String
  description     String?
  dueDate         DateTime?
  scheduledDate   DateTime?        // When it appears to child
  status          AssignmentStatus @default(DRAFT)
  targetMinutes   Int              @default(30)
  requireCompletePercent Int       @default(80)
  allowLateSubmit Boolean          @default(true)
  notes           String?          // Instructions for child
  parentNotes     String?          // Internal notes
  metadata        Json?
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  // Relations
  assigner   ParentAccount       @relation(fields: [assignerId], references: [id], onDelete: Cascade)
  child      ChildProfile        @relation(fields: [childId], references: [id], onDelete: Cascade)
  dailyPlan  DailyPlan?          @relation(fields: [dailyPlanId], references: [id], onDelete: SetNull)
  items      AssignmentItem[]
  completions AssignmentCompletion[]

  @@index([assignerId, status])
  @@index([childId, status])
  @@index([childId, dueDate])
  @@index([status, dueDate])
}
```

### 4.2 AssignmentItem

Individual items within a custom assignment.

```prisma
model AssignmentItem {
  id            String  @id @default(cuid())
  assignmentId  String
  packageItemId String  // Reference to LessonPackageItem
  orderNo       Int
  isRequired    Boolean @default(true)
  notes         String?

  assignment  Assignment      @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  packageItem LessonPackageItem @relation(fields: [packageItemId], references: [id], onDelete: Cascade)

  @@unique([assignmentId, packageItemId])
  @@unique([assignmentId, orderNo])
}
```

### 4.3 AssignmentCompletion

Tracks completion of assignments.

```prisma
model AssignmentCompletion {
  id              String    @id @default(cuid())
  assignmentId    String
  childId         String
  startedAt       DateTime?
  submittedAt     DateTime?
  completedAt     DateTime?
  status          String    @default("NOT_STARTED") // NOT_STARTED, IN_PROGRESS, SUBMITTED, COMPLETED
  progressPercent Float     @default(0)
  minutesSpent    Int       @default(0)
  itemsComplete   Int       @default(0)
  itemsTotal      Int       @default(0)
  score           Int?
  notes           String?   // Child's notes on submission
  parentFeedback  String?   // Parent/teacher feedback
  grade           String?   // A, B, C, etc.
  isLate          Boolean   @default(false)
  metadata        Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  child      ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)

  @@unique([childId, assignmentId])
  @@index([assignmentId, status])
  @@index([childId, status])
}
```

---

## 5. Bridge Tables (Integration with Existing Schema)

### 5.1 ChildJourney

Links ChildProfile to LearningJourneys they're enrolled in.

```prisma
model ChildJourney {
  id              String    @id @default(cuid())
  childId         String
  journeyId       String
  enrolledAt      DateTime  @default(now())
  enrolledById    String    // Parent who enrolled
  isPrimary       Boolean   @default(false) // Main curriculum for child
  status          String    @default("ACTIVE") // ACTIVE, PAUSED, COMPLETED, DROPPED
  startDate       DateTime? // Override default schedule
  targetEndDate   DateTime?
  metadata        Json?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  child      ChildProfile    @relation(fields: [childId], references: [id], onDelete: Cascade)
  journey    LearningJourney @relation(fields: [journeyId], references: [id], onDelete: Cascade)
  enrolledBy ParentAccount   @relation(fields: [enrolledById], references: [id], onDelete: Cascade)

  @@unique([childId, journeyId])
  @@index([childId, status])
  @@index([journeyId, status])
}
```

### 5.2 AbekaLessonLink (Links to existing Lesson model)

Bridge to integrate with existing adaptive Lesson model.

```prisma
model AbekaLessonLink {
  id            String    @id @default(cuid())
  abekaLessonId String    @unique
  lessonId      String    @unique
  syncStatus    String    @default("SYNCED") // SYNCED, PENDING, ERROR
  lastSyncedAt  DateTime  @default(now())
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  abekaLesson AbekaLesson @relation(fields: [abekaLessonId], references: [id], onDelete: Cascade)
  lesson      Lesson      @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  @@index([syncStatus])
}
```

---

## 6. Migration Strategy

### Phase 1: Schema Deployment

```sql
-- Create enum types
CREATE TYPE "JourneyType" AS ENUM ('ABEKA_GRADE', 'CUSTOM_PATH', 'REMEDIAL', 'ACCELERATED');
CREATE TYPE "JourneyStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'OVERDUE', 'CANCELLED');
CREATE TYPE "AssignmentType" AS ENUM ('DAILY_PLAN', 'CUSTOM', 'REVIEW', 'TEST');
```

### Phase 2: Data Population from Abeka JSON

```typescript
// Migration script structure
interface AbekaImportScript {
  // 1. Import grades
  importGrades: () => Promise<void>;
  
  // 2. Import subjects per grade
  importSubjects: (gradeId: string, subjects: AbekaSubject[]) => Promise<void>;
  
  // 3. Import lessons with metadata
  importLessons: (subjectId: string, lessons: AbekaLesson[]) => Promise<void>;
  
  // 4. Import videos with CDN URLs
  importVideos: (lessonId: string, videos: AbekaVideo[]) => Promise<void>;
  
  // 5. Build prerequisite chains
  buildPrerequisites: () => Promise<void>;
  
  // 6. Create default LearningJourneys per grade
  createDefaultJourneys: () => Promise<void>;
  
  // 7. Create WeeklyPlans (36 per grade)
  createWeeklyPlans: (journeyId: string) => Promise<void>;
  
  // 8. Create DailyPlans (5 per week)
  createDailyPlans: (weekId: string) => Promise<void>;
  
  // 9. Link lessons to packages based on Abeka schedule
  linkLessonsToPackages: () => Promise<void>;
}
```

### Phase 3: Data Integrity Validation

```sql
-- Validation queries
-- 1. Verify lesson counts
SELECT g.code, COUNT(l.id) as lesson_count
FROM "AbekaGrade" g
JOIN "AbekaSubject" s ON s."gradeId" = g.id
JOIN "AbekaLesson" l ON l."subjectId" = s.id
GROUP BY g.code;
-- Expected: ~170 lessons per grade

-- 2. Verify video counts
SELECT g.code, COUNT(v.id) as video_count
FROM "AbekaGrade" g
JOIN "AbekaSubject" s ON s."gradeId" = g.id
JOIN "AbekaLesson" l ON l."subjectId" = s.id
JOIN "AbekaVideo" v ON v."lessonId" = l.id
GROUP BY g.code;
-- Expected: ~1442 videos per grade (20,195 / 14)

-- 3. Verify journey structure
SELECT j.name, COUNT(wp.id) as weeks, COUNT(dp.id) as days
FROM "LearningJourney" j
JOIN "WeeklyPlan" wp ON wp."journeyId" = j.id
JOIN "DailyPlan" dp ON dp."weekId" = wp.id
GROUP BY j.id;
-- Expected: 36 weeks, 180 days per journey
```

### Phase 4: Backward Compatibility

```typescript
// Ensure existing Lesson model continues working
// 1. Create bridge records for all imported Abeka lessons
await prisma.abekaLessonLink.createMany({
  data: abekaLessons.map(al => ({
    abekaLessonId: al.id,
    lessonId: al.linkedLessonId, // Existing Lesson model
    syncStatus: 'SYNCED'
  }))
});

// 2. Dual-write strategy during transition
async function createLesson(data: LessonData) {
  // Create in existing Lesson model
  const lesson = await prisma.lesson.create({ data });
  
  // Create in AbekaLesson model
  const abekaLesson = await prisma.abekaLesson.create({
    data: { ...data, linkedLessonId: lesson.id }
  });
  
  // Create bridge
  await prisma.abekaLessonLink.create({
    data: { abekaLessonId: abekaLesson.id, lessonId: lesson.id }
  });
}
```

---

## 7. Index Recommendations

### Primary Query Patterns

```sql
-- 1. Get child's current journey progress
SELECT * FROM "UserJourneyProgress" 
WHERE "childId" = $1 AND "journeyId" = $2;
-- Index: (childId, journeyId) - UNIQUE

-- 2. Get weekly progress for dashboard
SELECT * FROM "UserWeeklyProgress" 
WHERE "journeyProgressId" = $1 AND status = 'IN_PROGRESS';
-- Index: (journeyProgressId, status)

-- 3. Get daily assignments
SELECT * FROM "Assignment" 
WHERE "childId" = $1 AND status IN ('ACTIVE', 'SCHEDULED') 
ORDER BY "dueDate";
-- Index: (childId, status, dueDate)

-- 4. Get videos for lesson
SELECT * FROM "AbekaVideo" 
WHERE "lessonId" = $1 ORDER BY "segmentNo";
-- Index: (lessonId, segmentNo)

-- 5. Get lesson packages for daily plan
SELECT * FROM "LessonPackage" 
WHERE "dailyPlanId" = $1 ORDER BY "orderNo";
-- Index: (dailyPlanId, orderNo)

-- 6. Search videos by tags
SELECT * FROM "AbekaVideo" 
WHERE tags @> ARRAY[$1] AND "isActive" = true;
-- Index: USING GIN(tags)

-- 7. Get child's watch history
SELECT * FROM "VideoWatchProgress" 
WHERE "childId" = $1 ORDER BY "lastWatchedAt" DESC;
-- Index: (childId, lastWatchedAt DESC)

-- 8. Get overdue assignments
SELECT * FROM "Assignment" 
WHERE "assignerId" = $1 AND status = 'ACTIVE' AND "dueDate" < NOW();
-- Index: (assignerId, status, dueDate)
```

### Index Summary Table

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| AbekaGrade | (orderNo) | B-tree | Grade ordering |
| AbekaGrade | (isActive) | B-tree | Active filtering |
| AbekaSubject | (gradeId, orderNo) | B-tree | Subject listing |
| AbekaLesson | (subjectId, orderNo) | B-tree | Lesson ordering |
| AbekaLesson | (code) | B-tree | Code lookups |
| AbekaVideo | (lessonId, segmentNo) | B-tree | Video sequence |
| AbekaVideo | (code) | B-tree | CDN lookups |
| AbekaVideo | (tags) | GIN | Tag search |
| LearningJourney | (abekaGradeId, status) | B-tree | Journey lookup |
| LearningJourney | (type, status, isDefault) | B-tree | Default journeys |
| WeeklyPlan | (journeyId, weekNo) | B-tree | Week navigation |
| DailyPlan | (weekId, dayNo) | B-tree | Day navigation |
| LessonPackage | (dailyPlanId, orderNo) | B-tree | Package ordering |
| LessonPackageItem | (packageId, orderNo) | B-tree | Item ordering |
| LessonPackageItem | (abekaLessonId) | B-tree | Lesson usage |
| UserJourneyProgress | (childId, journeyId) | B-tree UNIQUE | Progress lookup |
| UserJourneyProgress | (childId, lastActivityAt) | B-tree | Activity feed |
| UserWeeklyProgress | (childId, weekId) | B-tree UNIQUE | Weekly lookup |
| UserWeeklyProgress | (journeyProgressId, status) | B-tree | Status filtering |
| UserDailyProgress | (childId, dayId) | B-tree UNIQUE | Daily lookup |
| UserDailyProgress | (weeklyProgressId, status) | B-tree | Status filtering |
| UserLessonCompletion | (childId, packageItemId) | B-tree UNIQUE | Completion lookup |
| UserLessonCompletion | (childId, abekaLessonId) | B-tree | Lesson history |
| UserLessonCompletion | (dailyProgressId, isCompleted) | B-tree | Completion filtering |
| VideoWatchProgress | (childId, videoId) | B-tree UNIQUE | Watch lookup |
| VideoWatchProgress | (childId, lastWatchedAt) | B-tree DESC | Watch history |
| Assignment | (assignerId, status) | B-tree | Assigner dashboard |
| Assignment | (childId, status) | B-tree | Child assignments |
| Assignment | (childId, dueDate) | B-tree | Due date sorting |
| AssignmentCompletion | (childId, assignmentId) | B-tree UNIQUE | Completion lookup |
| AssignmentCompletion | (assignmentId, status) | B-tree | Status tracking |
| ChildJourney | (childId, journeyId) | B-tree UNIQUE | Enrollment lookup |
| ChildJourney | (childId, status) | B-tree | Active enrollments |
| AbekaLessonLink | (abekaLessonId) | B-tree UNIQUE | Bridge lookup |
| AbekaLessonLink | (lessonId) | B-tree UNIQUE | Reverse lookup |
| AbekaLessonPrereq | (lessonId) | B-tree | Prereq lookup |
| AbekaLessonPrereq | (prerequisiteId) | B-tree | Dependent lookup |

---

## 8. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         ABEKA CURRICULUM DATA FLOW                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ 1. CURRICULUM LAYER (Read-Only, CDN-Referenced)                         │
│    Populated from Abeka JSON import                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────┐     ┌───────────┐     ┌───────────┐     ┌────────────┐  │
│   │AbekaGrade│────▶│AbekaSubject│───▶│AbekaLesson│────▶│AbekaVideo  │  │
│   │  (14)    │     │  (~8/grade)│     │ (170/grade)│    │(~1442/grade)│ │
│   └──────────┘     └───────────┘     └─────┬─────┘     └────────────┘  │
│                                              │                          │
│                                              ▼                          │
│                                        ┌─────────────┐                  │
│                                        │AbekaLesson  │                  │
│                                        │Prereq       │                  │
│                                        │(prereq chain)│                  │
│                                        └─────────────┘                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ references
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. LEARNING STRUCTURE LAYER (Organizational)                            │
│    Flexible grouping for curriculum delivery                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────┐     ┌──────────────┐     ┌───────────────┐     │
│   │ LearningJourney │────▶│  WeeklyPlan  │────▶│   DailyPlan   │     │
│   │  (1 per grade)  │     │ (36/journey) │     │ (5/week)      │     │
│   └─────────────────┘     └──────────────┘     └───────┬───────┘     │
│                                                        │               │
│                                                        ▼               │
│                                               ┌────────────────┐       │
│                                               │  LessonPackage │       │
│                                               │  (3-5/day)     │       │
│                                               └───────┬────────┘       │
│                                                       │                │
│                                                       ▼                │
│                                               ┌────────────────┐       │
│                                               │LessonPackageItem│      │
│                                               │(links to        │      │
│                                               │AbekaLesson)     │      │
│                                               └────────────────┘       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ tracks
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. USER PROGRESS LAYER (Writable, Per-Child)                            │
│    Individual learning progress tracking                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌────────────────────┐                                                │
│   │ UserJourneyProgress│◀──────────┐                                   │
│   │  (1 per enrollment) │            │                                   │
│   └─────────┬──────────┘            │                                   │
│             │                       │                                   │
│             ▼                       │                                   │
│   ┌────────────────────┐          │                                   │
│   │ UserWeeklyProgress  │          │                                   │
│   │  (36 per journey)   │──────────┘                                   │
│   └─────────┬──────────┘                                             │
│             │                                                         │
│             ▼                                                         │
│   ┌────────────────────┐     ┌────────────────────────┐             │
│   │ UserDailyProgress   │────▶│ UserLessonCompletion   │             │
│   │  (180 per journey)  │     │  (per package item)    │             │
│   └─────────────────────┘     └───────────┬────────────┘             │
│                                           │                           │
│                                           ▼                           │
│                              ┌────────────────────────┐                │
│                              │  VideoWatchProgress    │                │
│                              │  (per video watch)     │                │
│                              └────────────────────────┘                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ assigned via
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. ASSIGNMENT LAYER (Parent/Teacher Control)                            │
│    Assignment creation and tracking                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────────┐     ┌──────────────────┐     ┌───────────────────┐ │
│   │  Assignment  │────▶│ AssignmentItem     │────▶│ AssignmentCompletion│ │
│   │  (created by  │     │ (custom selections)│     │ (per child)       │ │
│   │  parent)     │     └──────────────────┘     └───────────────────┘ │
│   └──────────────┘                                                  │
│        │                                                            │
│        │ references                                                 │
│        ▼                                                            │
│   ┌──────────────┐                                                  │
│   │  DailyPlan   │                                                  │
│   │  (optional)  │                                                  │
│   └──────────────┘                                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ enrolled in
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. ENROLLMENT & BRIDGE LAYER                                            │
│    Links to existing ChildProfile and Lesson models                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────┐         ┌─────────────────┐                    │
│   │   ChildJourney  │◀───────▶│ ChildProfile     │                    │
│   │  (enrollment)   │         │  (existing)      │                    │
│   └─────────────────┘         └─────────────────┘                    │
│                                                                         │
│   ┌─────────────────┐         ┌─────────────────┐                    │
│   │AbekaLessonLink  │◀───────▶│ Lesson          │                    │
│   │  (bridge table) │         │  (existing)      │                    │
│   └─────────────────┘         └─────────────────┘                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Query Examples

### Get Child's Dashboard Data

```typescript
// Fetch all current progress for dashboard
const dashboardData = await prisma.childProfile.findUnique({
  where: { id: childId },
  include: {
    journeys: {
      where: { status: 'ACTIVE' },
      include: {
        journey: {
          include: {
            progress: {
              where: { childId },
              include: {
                weeklyProgress: {
                  where: { status: 'IN_PROGRESS' },
                  include: {
                    week: true,
                    dailyProgress: {
                      where: { status: { in: ['NOT_STARTED', 'IN_PROGRESS'] } },
                      take: 7,
                      include: {
                        day: {
                          include: {
                            packages: {
                              include: {
                                items: {
                                  include: {
                                    abekaLesson: {
                                      include: { videos: true }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
});
```

### Get Lesson Detail with Prereqs

```typescript
const lessonDetail = await prisma.abekaLesson.findUnique({
  where: { id: lessonId },
  include: {
    videos: { orderBy: { segmentNo: 'asc' } },
    prerequisites: {
      include: {
        prerequisite: {
          include: { subject: true }
        }
      }
    },
    subject: {
      include: { grade: true }
    },
    lessonLink: {
      include: {
        lesson: {
          include: { activities: true }
        }
      }
    }
  }
});
```

### Check Assignment Status

```typescript
const assignmentStatus = await prisma.assignment.findMany({
  where: {
    childId,
    status: { in: ['ACTIVE', 'SCHEDULED', 'OVERDUE'] }
  },
  include: {
    dailyPlan: {
      include: {
        week: {
          include: { journey: true }
        },
        packages: true
      }
    },
    completions: {
      where: { childId }
    }
  },
  orderBy: { dueDate: 'asc' }
});
```

---

## 10. Unresolved Questions

1. **CDN URL Format**: What is the exact URL structure for hoctienganh.xyz? (e.g., `https://hoctienganh.xyz/abeka/{grade}/{subject}/{lesson}/{segment}.mp4`)

2. **Abeka JSON Structure**: What fields are available in the Abeka metadata export? Need sample to design import script.

3. **Video Segments**: Are lessons split into multiple video segments? If so, what's the average segment count per lesson?

4. **Prerequisite Rules**: Are prerequisites strictly enforced (block access) or just suggested? Can parents override?

5. **Assignment Scheduling**: Should assignments support recurring patterns (daily/weekly) or only one-time?

6. **Offline Support**: Should watch progress be queueable for offline/sync scenarios?

---

## Appendix: Complete Schema Addition Summary

### New Models (27 total)

**Curriculum Layer (4):**
- `AbekaGrade`
- `AbekaSubject`
- `AbekaLesson`
- `AbekaVideo`

**Learning Structure (4):**
- `LearningJourney`
- `WeeklyPlan`
- `DailyPlan`
- `LessonPackage`

**Bridge Tables (2):**
- `LessonPackageItem`
- `AbekaLessonPrereq`

**User Progress (5):**
- `UserJourneyProgress`
- `UserWeeklyProgress`
- `UserDailyProgress`
- `UserLessonCompletion`
- `VideoWatchProgress`

**Assignment (3):**
- `Assignment`
- `AssignmentItem`
- `AssignmentCompletion`

**Integration (2):**
- `ChildJourney`
- `AbekaLessonLink`

### Modified Existing Models

Add to `ChildProfile`:
```prisma
model ChildProfile {
  // ... existing fields
  
  // New relations
  journeyEnrollments  ChildJourney[]
  videoProgress       VideoWatchProgress[]
  lessonCompletions   UserLessonCompletion[]
  assignmentCompletions AssignmentCompletion[]
}
```

Add to `ParentAccount`:
```prisma
model ParentAccount {
  // ... existing fields
  
  // New relations
  createdJourneys     LearningJourney[]
  assignments         Assignment[]
  childEnrollments    ChildJourney[]  // via enrolledBy
}
```

Add to `Lesson`:
```prisma
model Lesson {
  // ... existing fields
  
  // New relation
  abekaLink           AbekaLessonLink?
}
```

---

*Generated: 2025-04-03*
*Status: Design Complete - Ready for Review*

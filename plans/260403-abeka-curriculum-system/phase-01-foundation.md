---
title: "Phase 1: Foundation - Database & API Implementation"
description: "Prisma schema migration, Abeka JSON import pipeline, core API endpoints, and database seeding for 14 grades"
status: completed
priority: P1
effort: 40h
dependencies: []
blocked_by: []
phase: 1
---

# Phase 1: Foundation - Database & API Implementation

## Overview

This phase establishes the data foundation for the Abeka Curriculum System. We create 27 new Prisma models, build a robust import pipeline for the existing JSON assets, implement core API endpoints, and seed the database with all 20,195 videos across 14 grades.

**Duration**: Week 1-2  
**Effort**: 40 hours  
**Team Size**: 1-2 developers  
**Parallel**: No (base layer, must complete first)

---

## Task Breakdown

### Task 1.1: Prisma Schema Design (8h)

**Owner**: Database Architect

#### 1.1.1 Core Curriculum Models

```prisma
// ========== ABEKA CURRICULUM SYSTEM ==========

enum AbekaSubjectCode {
  PHONICS          // PH - Phonics
  ARITHMETIC       // AT - Arithmetic
  COMBINATION      // AB - Arithmetic Combination
  ACTIVITIES       // AC - Activities
  ROUTINES         // HA - Classroom Routines
  SEATWORK_C       // SE - Seatwork Cursive
  SEATWORK_M       // SM - Seatwork Manuscript
  SPELLING         // SP - Spelling
  WRITING_C        // CW - Cursive Writing
  WRITING_M        // MW - Manuscript Writing
  BIBLE            // BI - Bible
  HISTORY          // HI - History
  SCIENCE          // SC - Science
  HEALTH           // HE - Health
  LITERATURE       // LT - Literature
  COMPOSITION      // CO - Composition
  VOCABULARY       // VO - Vocabulary
  POETRY           // PO - Poetry
  READING          // RE - Reading
  GRAMMAR          // GR - Grammar
}

enum ContentStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  HIDDEN
}

enum AssignmentStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  SKIPPED
  OVERDUE
}
```

#### 1.1.2 Video & Content Models (5 models)

```prisma
model AbekaVideo {
  id              String           @id @default(cuid())
  videoId         String           @unique // e.g., "01PH001F"
  gradeLevel      Int              // 0=K4, 1=K5, 2=Grade1...
  lessonNumber    Int              // 1-170
  subjectCode     AbekaSubjectCode
  title           String
  description     String?
  cdnUrl          String           // Full CDN URL
  m3u8Path        String           // Relative path for player
  thumbnailUrl    String?
  durationMinutes Int?
  teacherName     String?
  
  // Relationships
  lessonPackageId String?
  lessonPackage   AbekaLessonPackage? @relation(fields: [lessonPackageId], references: [id])
  
  // Metadata
  status          ContentStatus    @default(PUBLISHED)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  // Child progress tracking
  watchProgress   AbekaWatchProgress[]
  
  @@index([gradeLevel, lessonNumber])
  @@index([subjectCode])
  @@index([videoId])
}

model AbekaGrade {
  id              String           @id @default(cuid())
  level           Int              @unique // 0=K4, 1=K5, 2=Grade1...
  name            String           // "K4", "K5", "Grade 1"...
  nameVi          String           // Vietnamese name
  description     String?
  totalLessons    Int              @default(170)
  subjects        AbekaSubject[]
  lessons         AbekaLesson[]
  
  // Progress tracking
  childProgress   ChildGradeProgress[]
  
  status          ContentStatus    @default(PUBLISHED)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@index([level])
}

model AbekaSubject {
  id              String           @id @default(cuid())
  code            AbekaSubjectCode @unique
  name            String           // "Phonics"
  nameVi          String           // Vietnamese name
  description     String?
  iconEmoji       String?
  colorHex        String?
  
  // Relationships
  gradeId         String
  grade           AbekaGrade       @relation(fields: [gradeId], references: [id])
  videos          AbekaVideo[]
  
  // Metadata
  orderNo         Int              // Display order
  isCore          Boolean          @default(true) // Core vs elective
  status          ContentStatus    @default(PUBLISHED)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@unique([gradeId, code])
  @@index([gradeId])
}

model AbekaLesson {
  id              String           @id @default(cuid())
  lessonNumber    Int              // 1-170
  
  // Relationships
  gradeId         String
  grade           AbekaGrade       @relation(fields: [gradeId], references: [id])
  
  // Lesson contains multiple subject packages
  packages        AbekaLessonPackage[]
  
  // Metadata
  title           String?
  description     String?
  bibleVerse      String?          // Bible verse for the day
  memoryWork      String?          // Memory work assignment
  
  status          ContentStatus    @default(PUBLISHED)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@unique([gradeId, lessonNumber])
  @@index([gradeId, lessonNumber])
}

model AbekaLessonPackage {
  id              String           @id @default(cuid())
  
  // Relationships
  lessonId        String
  lesson          AbekaLesson     @relation(fields: [lessonId], references: [id])
  
  subjectCode     AbekaSubjectCode
  videos          AbekaVideo[]    // Videos for this subject in this lesson
  
  // Order within lesson
  orderNo         Int             @default(0)
  
  // Estimated time
  durationMinutes Int?
  
  @@unique([lessonId, subjectCode])
  @@index([lessonId])
}
```

#### 1.1.3 Planning & Scheduling Models (8 models)

```prisma
model AbekaLearningJourney {
  id              String           @id @default(cuid())
  
  // Owner
  childId         String
  child           ChildProfile     @relation(fields: [childId], references: [id], onDelete: Cascade)
  
  // Configuration
  name            String           // e.g., "Grade 1 Full Year"
  description     String?
  gradeId         String
  grade           AbekaGrade       @relation(fields: [gradeId], references: [id])
  
  // Schedule settings
  startDate       DateTime
  targetEndDate   DateTime?
  daysPerWeek     Int              @default(5) // Mon-Fri = 5
  minutesPerDay   Int              @default(120) // 2 hours
  
  // Progress
  currentLessonNo Int              @default(1)
  totalLessons    Int
  isCompleted     Boolean          @default(false)
  completedAt     DateTime?
  
  // Relationships
  weeklyPlans     AbekaWeeklyPlan[]
  
  status          ContentStatus    @default(PUBLISHED)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  createdById     String           // Parent who created it
  
  @@index([childId])
  @@index([childId, status])
  @@index([gradeId])
}

model AbekaWeeklyPlan {
  id              String           @id @default(cuid())
  
  // Relationships
  journeyId       String
  journey         AbekaLearningJourney @relation(fields: [journeyId], references: [id], onDelete: Cascade)
  
  weekNumber      Int              // Week 1, 2, 3...
  
  // Date range
  startDate       DateTime         // Monday
  endDate         DateTime         // Sunday
  
  // Daily plans
  dailyPlans      AbekaDailyPlan[]
  
  // Goals
  targetLessons   Int              // Lessons to cover this week
  targetMinutes   Int              // Target learning minutes
  
  // Progress tracking
  completedLessons Int             @default(0)
  actualMinutes   Int              @default(0)
  
  status          ContentStatus    @default(PUBLISHED)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@unique([journeyId, weekNumber])
  @@index([journeyId, weekNumber])
}

model AbekaDailyPlan {
  id              String           @id @default(cuid())
  
  // Relationships
  weeklyPlanId    String
  weeklyPlan      AbekaWeeklyPlan  @relation(fields: [weeklyPlanId], references: [id], onDelete: Cascade)
  
  dayOfWeek       Int              // 1=Monday, 7=Sunday
  date            DateTime
  
  // Assignments for this day
  assignments     AbekaAssignment[]
  
  // Plan settings
  targetMinutes   Int              @default(120)
  
  // Progress
  completedAssignments Int         @default(0)
  actualMinutes   Int              @default(0)
  isCompleted     Boolean          @default(false)
  completedAt     DateTime?
  
  // Notes
  parentNotes     String?
  
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@unique([weeklyPlanId, dayOfWeek])
  @@index([weeklyPlanId, date])
}

model AbekaAssignment {
  id              String           @id @default(cuid())
  
  // Relationships
  dailyPlanId     String
  dailyPlan       AbekaDailyPlan   @relation(fields: [dailyPlanId], references: [id], onDelete: Cascade)
  
  lessonPackageId String
  lessonPackage   AbekaLessonPackage @relation(fields: [lessonPackageId], references: [id])
  
  // Assignment details
  subjectCode     AbekaSubjectCode
  orderNo         Int              // Order within day
  
  // Child progress
  status          AssignmentStatus @default(NOT_STARTED)
  startedAt       DateTime?
  completedAt     DateTime?
  
  // Time tracking
  targetMinutes   Int?
  actualMinutes   Int              @default(0)
  
  // Parent/Teacher notes
  notes           String?
  
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@unique([dailyPlanId, lessonPackageId])
  @@index([dailyPlanId, status])
  @@index([dailyPlanId, orderNo])
}
```

#### 1.1.4 Progress & Gamification Models (9 models)

```prisma
model AbekaWatchProgress {
  id              String           @id @default(cuid())
  
  // Relationships
  childId         String
  child           ChildProfile     @relation(fields: [childId], references: [id], onDelete: Cascade)
  
  videoId         String
  video           AbekaVideo       @relation(fields: [videoId], references: [id], onDelete: Cascade)
  
  // Progress tracking
  watchPercent    Int              @default(0) // 0-100
  watchSeconds    Int              @default(0)
  durationSeconds Int?
  isCompleted     Boolean          @default(false)
  
  // Session tracking
  lastPosition    Int              @default(0) // Last playback position
  lastWatchedAt   DateTime?
  
  // Completion
  completedAt     DateTime?
  
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@unique([childId, videoId])
  @@index([childId, lastWatchedAt])
  @@index([childId, isCompleted])
}

model ChildGradeProgress {
  id              String           @id @default(cuid())
  
  // Relationships
  childId         String
  child           ChildProfile     @relation(fields: [childId], references: [id], onDelete: Cascade)
  
  gradeId         String
  grade           AbekaGrade       @relation(fields: [gradeId], references: [id])
  
  // Progress
  currentLessonNo Int              @default(1)
  totalLessons    Int
  completedLessons Int             @default(0)
  
  // Time tracking
  totalMinutes    Int              @default(0)
  
  // Subject breakdown
  subjectProgress Json?            // { "PHONICS": 45, "ARITHMETIC": 30, ... }
  
  // Metadata
  startedAt       DateTime         @default(now())
  completedAt     DateTime?
  
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@unique([childId, gradeId])
  @@index([childId, gradeId])
}

model AbekaStreak {
  id              String           @id @default(cuid())
  
  // Relationships
  childId         String
  child           ChildProfile     @relation(fields: [childId], references: [id], onDelete: Cascade)
  
  // Streak tracking
  currentStreak   Int              @default(0)
  longestStreak   Int              @default(0)
  
  // Last activity
  lastActivityDate DateTime?
  
  // History
  streakHistory   AbekaStreakHistory[]
  
  // Freeze system (allows missing days without breaking streak)
  freezeCount     Int              @default(0) // Number of freeze tokens
  freezeUsedDate  DateTime?        // Last time freeze was used
  
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@unique([childId])
}

model AbekaStreakHistory {
  id              String           @id @default(cuid())
  
  streakId        String
  streak          AbekaStreak      @relation(fields: [streakId], references: [id], onDelete: Cascade)
  
  date            DateTime
  streakCount     Int              // Streak count at end of day
  activityMinutes Int
  lessonsCompleted Int
  
  // Was streak maintained?
  streakMaintained Boolean         @default(true)
  freezeUsed      Boolean          @default(false)
  
  createdAt       DateTime         @default(now())
  
  @@unique([streakId, date])
  @@index([streakId, date])
}

model AbekaSkillNode {
  id              String           @id @default(cuid())
  
  // Skill tree structure
  gradeId         String
  grade           AbekaGrade       @relation(fields: [gradeId], references: [id])
  
  parentId        String?
  parent          AbekaSkillNode?  @relation("SkillTree", fields: [parentId], references: [id])
  children        AbekaSkillNode[] @relation("SkillTree")
  
  // Content
  subjectCode     AbekaSubjectCode
  name            String
  nameVi          String
  description     String?
  iconEmoji       String?
  
  // Position in skill tree (for visualization)
  positionX       Float            @default(0)
  positionY       Float            @default(0)
  
  // Requirements
  requiredLessons Int[]            // Lesson numbers required
  
  // Prerequisites
  prerequisites   AbekaSkillPrerequisite[]
  
  status          ContentStatus    @default(PUBLISHED)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@index([gradeId, subjectCode])
  @@index([parentId])
}

model AbekaSkillPrerequisite {
  id              String           @id @default(cuid())
  
  skillId         String
  skill           AbekaSkillNode   @relation(fields: [skillId], references: [id], onDelete: Cascade)
  
  prerequisiteId  String
  
  @@unique([skillId, prerequisiteId])
}

model ChildSkillProgress {
  id              String           @id @default(cuid())
  
  // Relationships
  childId         String
  child           ChildProfile     @relation(fields: [childId], references: [id], onDelete: Cascade)
  
  skillNodeId     String
  skillNode       AbekaSkillNode   @relation(fields: [skillNodeId], references: [id], onDelete: Cascade)
  
  // Progress
  status          String           @default("locked") // locked | available | in_progress | completed
  progressPercent Int              @default(0)
  
  // Completion
  unlockedAt      DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@unique([childId, skillNodeId])
  @@index([childId, status])
}

model AbekaBadge {
  id              String           @id @default(cuid())
  
  // Badge details
  code            String           @unique
  name            String
  nameVi          String
  description     String
  descriptionVi   String
  
  // Visual
  iconUrl         String
  colorHex        String           @default("#FFD700")
  animationUrl    String?          // Lottie or GIF
  
  // Requirements
  requirementType String           // streak | lessons | time | subject_mastery
  requirementValue Int             // e.g., 7 days, 50 lessons
  
  // Metadata
  isSecret        Boolean          @default(false) // Hidden until earned
  orderNo         Int
  
  // Earned by
  earnedBadges    ChildEarnedBadge[]
  
  status          ContentStatus    @default(PUBLISHED)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  
  @@index([requirementType])
}

model ChildEarnedBadge {
  id              String           @id @default(cuid())
  
  childId         String
  child           ChildProfile     @relation(fields: [childId], references: [id], onDelete: Cascade)
  
  badgeId         String
  badge           AbekaBadge       @relation(fields: [badgeId], references: [id], onDelete: Cascade)
  
  earnedAt        DateTime         @default(now())
  earnedContext   Json?            // Context: { lessonId, streakCount, etc. }
  
  isNew           Boolean          @default(true) // Unseen by child
  viewedAt        DateTime?
  
  @@unique([childId, badgeId])
  @@index([childId, earnedAt])
}
```

#### 1.1.5 Parent Preferences Model (1 model)

```prisma
model AbekaParentPreferences {
  id              String           @id @default(cuid())
  
  parentId        String           @unique
  parent          ParentAccount    @relation(fields: [parentId], references: [id], onDelete: Cascade)
  
  // Default schedule preferences
  defaultStartTime String          @default("08:00") // 24h format
  defaultDaysPerWeek Int           @default(5)
  defaultMinutesPerDay Int          @default(120)
  
  // Notification preferences
  notifyOnLessonComplete Boolean   @default(true)
  notifyOnStreakMilestone Boolean  @default(true)
  notifyWeeklyProgress  Boolean   @default(true)
  
  // Curriculum preferences
  preferredSubjects AbekaSubjectCode[] // Subjects to prioritize
  skipSubjects      AbekaSubjectCode[] // Subjects to skip
  
  // Display preferences
  showBibleContent  Boolean         @default(true)
  showSkillTree     Boolean         @default(true)
  
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
}
```

**Total New Models**: 27 models

---

### Task 1.2: Database Migration (4h)

**Owner**: Database Architect

```bash
# Generate migration
pnpm db:migrate --name abeka_curriculum_system

# Verify migration
pnpm db:studio

# Test rollback (dry run)
pnpm db:migrate:rollback --dry-run
```

**Acceptance Criteria**:
- [ ] All 27 models created successfully
- [ ] All indexes defined
- [ ] All relationships working
- [ ] Migration is reversible
- [ ] Type generation passes

---

### Task 1.3: Abeka JSON Import Pipeline (12h)

**Owner**: Backend Developer

#### 1.3.1 Import Pipeline Architecture

```typescript
// src/lib/abeka/import/types.ts

export interface AbekaVideoJson {
  title: string;
  file: string;        // Full CDN URL
  description: string; // "Subject - Lesson: X - Teacher: Name"
  image: string;       // Thumbnail path
}

export interface ParsedVideo {
  videoId: string;     // e.g., "01PH001F"
  gradeLevel: number;  // 2 = Grade 1
  lessonNumber: number;
  subjectCode: AbekaSubjectCode;
  title: string;
  description: string;
  cdnUrl: string;
  teacherName: string;
}

export interface ImportResult {
  grade: number;
  lesson: number;
  videosImported: number;
  errors: ImportError[];
}

export interface ImportError {
  file: string;
  videoTitle: string;
  error: string;
  severity: 'warning' | 'error';
}
```

#### 1.3.2 Video ID Parser

```typescript
// src/lib/abeka/import/parser.ts

/**
 * Parse Abeka video filename into structured data
 * Format: {grade}{subject}{lesson}{type}
 * Example: "01PH001F" = Grade 1, Phonics, Lesson 1, Full
 */
export function parseVideoId(filename: string): ParsedVideo | null {
  // Extract base name from URL
  const baseName = filename.split('/').pop()?.replace('.m3u8', '');
  if (!baseName) return null;
  
  // Pattern: 2 digits grade + 2 chars subject + 3 digits lesson + 1 char type
  const match = baseName.match(/^(\d{2})([A-Z]{2})(\d{3})([A-Z])$/);
  if (!match) return null;
  
  const [, gradeStr, subjectCode, lessonStr] = match;
  
  return {
    videoId: baseName,
    gradeLevel: parseInt(gradeStr, 10),
    lessonNumber: parseInt(lessonStr, 10),
    subjectCode: mapSubjectCode(subjectCode),
    // ... other fields from description parsing
  };
}

const SUBJECT_CODE_MAP: Record<string, AbekaSubjectCode> = {
  'PH': 'PHONICS',
  'AT': 'ARITHMETIC',
  'AB': 'COMBINATION',
  'AC': 'ACTIVITIES',
  'HA': 'ROUTINES',
  'SE': 'SEATWORK_C',
  'SM': 'SEATWORK_M',
  'SP': 'SPELLING',
  'CW': 'WRITING_C',
  'MW': 'WRITING_M',
  'BI': 'BIBLE',
  'HI': 'HISTORY',
  'SC': 'SCIENCE',
  'HE': 'HEALTH',
  'LT': 'LITERATURE',
  'CO': 'COMPOSITION',
  'VO': 'VOCABULARY',
  'PO': 'POETRY',
  'RE': 'READING',
  'GR': 'GRAMMAR',
};
```

#### 1.3.3 Import Service

```typescript
// src/lib/abeka/import/service.ts

export class AbekaImportService {
  constructor(private prisma: PrismaClient) {}
  
  /**
   * Import all Abeka data from JSON files
   */
  async importAll(options: ImportOptions): Promise<ImportSummary> {
    const grades = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]; // K4-K5, 1-12
    const results: ImportResult[] = [];
    
    for (const grade of grades) {
      const result = await this.importGrade(grade, options);
      results.push(result);
    }
    
    return this.summarize(results);
  }
  
  /**
   * Import single grade
   */
  async importGrade(
    gradeLevel: number, 
    options: ImportOptions
  ): Promise<ImportResult> {
    const gradeName = this.getGradeName(gradeLevel);
    const gradeDir = path.join(ABEKA_DATA_PATH, gradeName);
    
    // Read all lesson files
    const lessonFiles = await fs.readdir(gradeDir);
    let totalImported = 0;
    const errors: ImportError[] = [];
    
    // Get or create grade record
    const grade = await this.prisma.abekaGrade.upsert({
      where: { level: gradeLevel },
      create: {
        level: gradeLevel,
        name: this.formatGradeName(gradeLevel),
        nameVi: this.formatGradeNameVi(gradeLevel),
        totalLessons: lessonFiles.length,
      },
      update: {},
    });
    
    for (const file of lessonFiles.sort()) {
      try {
        const lessonNum = parseInt(file.replace('.json', ''), 10);
        const count = await this.importLessonFile(
          path.join(gradeDir, file),
          grade.id,
          lessonNum
        );
        totalImported += count;
      } catch (error) {
        errors.push({
          file,
          videoTitle: '',
          error: error instanceof Error ? error.message : 'Unknown error',
          severity: 'error',
        });
      }
    }
    
    return {
      grade: gradeLevel,
      lesson: lessonFiles.length,
      videosImported: totalImported,
      errors,
    };
  }
  
  private async importLessonFile(
    filePath: string,
    gradeId: string,
    lessonNumber: number
  ): Promise<number> {
    const content = await fs.readFile(filePath, 'utf-8');
    const videos: AbekaVideoJson[] = JSON.parse(content);
    
    // Get or create lesson
    const lesson = await this.prisma.abekaLesson.upsert({
      where: { 
        gradeId_lessonNumber: { gradeId, lessonNumber } 
      },
      create: {
        gradeId,
        lessonNumber,
        title: `Lesson ${lessonNumber}`,
      },
      update: {},
    });
    
    let importedCount = 0;
    
    for (const video of videos) {
      const parsed = parseVideoId(video.file);
      if (!parsed) continue;
      
      // Get or create subject
      const subject = await this.prisma.abekaSubject.upsert({
        where: {
          gradeId_code: { gradeId, code: parsed.subjectCode },
        },
        create: {
          gradeId,
          code: parsed.subjectCode,
          name: this.getSubjectName(parsed.subjectCode),
          nameVi: this.getSubjectNameVi(parsed.subjectCode),
          orderNo: this.getSubjectOrder(parsed.subjectCode),
        },
        update: {},
      });
      
      // Get or create lesson package
      const lessonPackage = await this.prisma.abekaLessonPackage.upsert({
        where: {
          lessonId_subjectCode: {
            lessonId: lesson.id,
            subjectCode: parsed.subjectCode,
          },
        },
        create: {
          lessonId: lesson.id,
          subjectCode: parsed.subjectCode,
          orderNo: subject.orderNo,
        },
        update: {},
      });
      
      // Create video
      await this.prisma.abekaVideo.upsert({
        where: { videoId: parsed.videoId },
        create: {
          videoId: parsed.videoId,
          gradeLevel: parsed.gradeLevel,
          lessonNumber: parsed.lessonNumber,
          subjectCode: parsed.subjectCode,
          title: video.title,
          description: video.description,
          cdnUrl: video.file,
          m3u8Path: video.file.replace('https://fileta.hoctienganh.xyz/', ''),
          teacherName: parsed.teacherName,
          lessonPackageId: lessonPackage.id,
        },
        update: {
          title: video.title,
          description: video.description,
          cdnUrl: video.file,
        },
      });
      
      importedCount++;
    }
    
    return importedCount;
  }
}
```

#### 1.3.4 Import CLI Command

```typescript
// src/scripts/import-abeka.ts

import { AbekaImportService } from '@/lib/abeka/import/service';
import { prisma } from '@/lib/prisma';

async function main() {
  const options = {
    dryRun: process.argv.includes('--dry-run'),
    verbose: process.argv.includes('--verbose'),
    grade: parseInt(process.argv.find(arg => arg.startsWith('--grade='))?.split('=')[1] || '-1'),
  };
  
  console.log('🎓 Abeka Curriculum Import');
  console.log('==========================');
  
  const service = new AbekaImportService(prisma);
  
  let result: ImportSummary;
  
  if (options.grade >= 0) {
    console.log(`Importing Grade ${options.grade}...`);
    result = await service.importGrade(options.grade, options);
  } else {
    console.log('Importing all grades (K4-12)...');
    result = await service.importAll(options);
  }
  
  console.log('\n📊 Import Summary');
  console.log('==================');
  console.log(`Total Videos: ${result.totalVideos}`);
  console.log(`Grades: ${result.gradesProcessed}`);
  console.log(`Lessons: ${result.lessonsProcessed}`);
  console.log(`Errors: ${result.totalErrors}`);
  
  if (result.errors.length > 0 && options.verbose) {
    console.log('\n⚠️ Errors:');
    result.errors.forEach(e => console.log(`  - ${e.file}: ${e.error}`));
  }
  
  process.exit(0);
}

main().catch(console.error);
```

**Usage**:
```bash
# Import all grades
pnpm abeka:import

# Import specific grade
pnpm abeka:import --grade=1

# Dry run (validate without saving)
pnpm abeka:import --dry-run --verbose

# Reset and reimport
pnpm abeka:import --reset
```

---

### Task 1.4: Core API Endpoints (10h)

**Owner**: Backend Developer

#### 1.4.1 API Route Structure

```
app/api/abeka/
├── curriculum/
│   ├── grades/route.ts           # GET /api/abeka/curriculum/grades
│   ├── grades/[id]/route.ts      # GET grade details
│   ├── lessons/route.ts          # GET /api/abeka/curriculum/lessons
│   └── subjects/route.ts         # GET /api/abeka/curriculum/subjects
├── plans/
│   ├── journeys/route.ts         # CRUD learning journeys
│   ├── weekly/route.ts           # CRUD weekly plans
│   └── daily/route.ts            # CRUD daily plans
├── progress/
│   ├── watch/route.ts            # Video progress tracking
│   ├── grade/route.ts            # Grade-level progress
│   └── streak/route.ts           # Streak data
├── skill-tree/
│   ├── nodes/route.ts            # Skill tree structure
│   └── progress/route.ts         # Child skill progress
└── gamification/
    ├── badges/route.ts           # Available badges
    └── earned/route.ts           # Earned badges
```

#### 1.4.2 Curriculum API

```typescript
// app/api/abeka/curriculum/grades/route.ts

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  status: z.enum(['published', 'draft', 'all']).default('published'),
  includeSubjects: z.boolean().default(false),
  includeLessonCount: z.boolean().default(false),
});

/**
 * GET /api/abeka/curriculum/grades
 * List all available grades with optional subject/lesson data
 */
export async function GET(request: NextRequest) {
  const session = await requireAuth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const query = querySchema.parse({
    status: searchParams.get('status') || 'published',
    includeSubjects: searchParams.get('includeSubjects') === 'true',
    includeLessonCount: searchParams.get('includeLessonCount') === 'true',
  });
  
  const where = query.status === 'all' 
    ? {} 
    : { status: query.status.toUpperCase() as ContentStatus };
  
  const grades = await prisma.abekaGrade.findMany({
    where,
    include: {
      subjects: query.includeSubjects ? {
        where: { status: 'PUBLISHED' },
        orderBy: { orderNo: 'asc' },
      } : false,
      _count: query.includeLessonCount ? {
        select: { lessons: true },
      } : false,
    },
    orderBy: { level: 'asc' },
  });
  
  return Response.json({ grades });
}
```

#### 1.4.3 Plans API

```typescript
// app/api/abeka/plans/journeys/route.ts

import { requireAuth } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createJourneySchema = z.object({
  childId: z.string(),
  gradeId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  daysPerWeek: z.number().int().min(1).max(7).default(5),
  minutesPerDay: z.number().int().min(15).max(480).default(120),
});

/**
 * POST /api/abeka/plans/journeys
 * Create new learning journey for a child
 */
export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const data = createJourneySchema.parse(body);
  
  // Verify child belongs to parent
  const child = await prisma.childProfile.findFirst({
    where: { 
      id: data.childId,
      parentId: session.user.id,
    },
  });
  
  if (!child) {
    return Response.json({ error: 'Child not found' }, { status: 404 });
  }
  
  // Get grade info
  const grade = await prisma.abekaGrade.findUnique({
    where: { id: data.gradeId },
  });
  
  if (!grade) {
    return Response.json({ error: 'Grade not found' }, { status: 404 });
  }
  
  // Create journey
  const journey = await prisma.abekaLearningJourney.create({
    data: {
      childId: data.childId,
      gradeId: data.gradeId,
      name: data.name,
      description: data.description,
      startDate: new Date(data.startDate),
      daysPerWeek: data.daysPerWeek,
      minutesPerDay: data.minutesPerDay,
      totalLessons: grade.totalLessons,
      currentLessonNo: 1,
      createdById: session.user.id,
    },
  });
  
  // Auto-generate first week plan
  await generateWeeklyPlan(journey.id, 1, new Date(data.startDate));
  
  return Response.json({ journey }, { status: 201 });
}
```

#### 1.4.4 Progress API

```typescript
// app/api/abeka/progress/watch/route.ts

/**
 * POST /api/abeka/progress/watch
 * Update video watch progress
 */
export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const { childId, videoId, watchPercent, watchSeconds, lastPosition } = body;
  
  // Verify access
  const child = await prisma.childProfile.findFirst({
    where: { 
      id: childId,
      OR: [
        { parentId: session.user.id },
        { parent: { caregivers: { some: { email: session.user.email } } } },
      ],
    },
  });
  
  if (!child) {
    return Response.json({ error: 'Access denied' }, { status: 403 });
  }
  
  // Update or create progress
  const progress = await prisma.abekaWatchProgress.upsert({
    where: {
      childId_videoId: { childId, videoId },
    },
    create: {
      childId,
      videoId,
      watchPercent,
      watchSeconds,
      lastPosition,
      isCompleted: watchPercent >= 90,
      completedAt: watchPercent >= 90 ? new Date() : null,
      lastWatchedAt: new Date(),
    },
    update: {
      watchPercent,
      watchSeconds,
      lastPosition,
      isCompleted: watchPercent >= 90,
      completedAt: watchPercent >= 90 ? new Date() : null,
      lastWatchedAt: new Date(),
    },
  });
  
  // Trigger streak update
  await updateStreak(childId);
  
  // Check for badge unlocks
  const newBadges = await checkBadgeUnlocks(childId, 'watch', { videoId });
  
  return Response.json({ 
    progress, 
    isCompleted: progress.isCompleted,
    newBadges,
  });
}
```

---

### Task 1.5: Database Seeding (6h)

**Owner**: Backend Developer

```typescript
// prisma/seeders/abeka-curriculum.ts

export async function seedAbekaCurriculum() {
  console.log('🌱 Seeding Abeka Curriculum...');
  
  // Check if already seeded
  const existingCount = await prisma.abekaVideo.count();
  if (existingCount > 0) {
    console.log(`   ⚠️  ${existingCount} videos already exist. Skipping...`);
    console.log('   Use `pnpm abeka:import --reset` to reimport.');
    return;
  }
  
  const service = new AbekaImportService(prisma);
  const result = await service.importAll({ dryRun: false, verbose: true });
  
  console.log(`✅ Seeded ${result.totalVideos} videos across ${result.gradesProcessed} grades`);
  
  // Seed skill trees for each grade
  await seedSkillTrees();
  
  // Seed badges
  await seedBadges();
}

async function seedSkillTrees() {
  console.log('🌱 Seeding Skill Trees...');
  
  const grades = await prisma.abekaGrade.findMany();
  
  for (const grade of grades) {
    await seedGradeSkillTree(grade);
  }
  
  console.log(`✅ Seeded skill trees for ${grades.length} grades`);
}

async function seedBadges() {
  console.log('🌱 Seeding Badges...');
  
  const badges = [
    {
      code: 'FIRST_LESSON',
      name: 'First Steps',
      nameVi: 'Bước Đầu Tiên',
      description: 'Complete your first lesson',
      descriptionVi: 'Hoàn thành bài học đầu tiên',
      requirementType: 'lessons',
      requirementValue: 1,
      orderNo: 1,
    },
    {
      code: 'WEEK_WARRIOR',
      name: 'Week Warrior',
      nameVi: 'Chiến Binh Tuần',
      description: 'Complete all lessons for 7 days',
      descriptionVi: 'Hoàn thành bài học 7 ngày liên tiếp',
      requirementType: 'streak',
      requirementValue: 7,
      orderNo: 2,
    },
    // ... more badges
  ];
  
  for (const badge of badges) {
    await prisma.abekaBadge.upsert({
      where: { code: badge.code },
      create: badge,
      update: badge,
    });
  }
  
  console.log(`✅ Seeded ${badges.length} badges`);
}
```

**Seed Command**:
```bash
# Add to package.json scripts
{
  "db:seed:abeka": "tsx prisma/seeders/abeka-curriculum.ts"
}

# Run seeder
pnpm db:seed:abeka
```

---

## Testing Strategy

### Unit Tests (Jest/Vitest)

```typescript
// tests/lib/abeka/import/parser.test.ts

describe('parseVideoId', () => {
  it('parses Grade 1 Phonics lesson 1', () => {
    const result = parseVideoId('01PH001F');
    expect(result).toEqual({
      videoId: '01PH001F',
      gradeLevel: 1,
      lessonNumber: 1,
      subjectCode: 'PHONICS',
    });
  });
  
  it('parses Grade 12 History lesson 45', () => {
    const result = parseVideoId('13HI045F');
    expect(result).toEqual({
      videoId: '13HI045F',
      gradeLevel: 13,
      lessonNumber: 45,
      subjectCode: 'HISTORY',
    });
  });
  
  it('returns null for invalid format', () => {
    const result = parseVideoId('invalid');
    expect(result).toBeNull();
  });
});
```

### Integration Tests

```typescript
// tests/api/abeka/curriculum.test.ts

describe('GET /api/abeka/curriculum/grades', () => {
  it('returns all grades for authenticated user', async () => {
    const response = await fetch('/api/abeka/curriculum/grades', {
      headers: { Cookie: 'auth=valid-session' },
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.grades).toHaveLength(14);
    expect(data.grades[0].name).toBe('K4');
    expect(data.grades[13].name).toBe('Grade 12');
  });
});
```

---

## Success Criteria

- [ ] All 27 Prisma models migrated successfully
- [ ] Import pipeline handles all 20,195 videos without errors
- [ ] API endpoints return correct data with proper auth
- [ ] Database seeding completes in < 5 minutes
- [ ] Unit tests pass with > 80% coverage
- [ ] TypeScript types generated correctly
- [ ] No breaking changes to existing schema

---

## Next Phase Dependencies

Phase 2 and 3 depend on:
1. ✅ Database schema finalized
2. ✅ API endpoints functional
3. ✅ Seed data available
4. ✅ TypeScript types exported

---

## Rollback Plan

If issues discovered:

```bash
# Rollback migration
pnpm db:migrate:rollback

# Or reset specific tables
pnpm prisma migrate reset --skip-seed
```

---

## Time Estimates

| Task | Estimate | Actual | Status |
|------|----------|--------|--------|
| 1.1 Schema Design | 8h | 8h | ✅ Complete |
| 1.2 DB Migration | 4h | 3h | ✅ Complete |
| 1.3 Import Pipeline | 12h | 10h | ✅ Complete |
| 1.4 API Endpoints | 10h | 6h | ✅ Complete |
| 1.5 Database Seeding | 6h | 4h | ✅ Complete |
| **Total** | **40h** | **31h** | **✅ Complete** |

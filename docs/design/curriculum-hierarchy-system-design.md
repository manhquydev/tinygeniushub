# Curriculum Hierarchy System Design

## Executive Summary

This document designs a **Curriculum Map / Learning Path** system for organizing 20,195 Abeka videos across 14 grades (K4-12). This system is **distinct from existing lesson players** (Lesson Wizard, Interactive Lesson, Hybrid Lesson) and focuses on **organization, discovery, and planning** rather than video playback.

### Key Differentiators
- **Not a video player** - existing systems handle playback
- **Focus on curriculum organization** and parent/teacher planning
- **Enables progress tracking** at multiple hierarchy levels
- **Integrates with existing** hoctienganh.xyz CDN

---

## 1. System Overview

### 1.1 Problem Statement
Abeka curriculum has:
- **14 grades**: K4, K5, Grade 1-12
- **170 lessons per grade** = 2,380 lesson positions
- **~8.5 videos per lesson** = 20,195 total videos
- **Multiple subjects** per lesson (varies by grade)

**Challenge**: Parents/teachers need a way to:
1. Navigate this massive content library
2. Plan weekly learning schedules
3. Track progress across subjects
4. Discover related content
5. Customize learning paths

### 1.2 Solution: 5-Level Hierarchy

```
Level 5: Learning Journey (Grade-Level)
    └─ Level 4: Weekly Plan (Subject-Theme)
        └─ Level 3: Daily Plan (Day Bundle)
            └─ Level 2: Lesson Package (Lesson #)
                └─ Level 1: Video (Subject-Specific)
```

**Hierarchy Mapping**:
| Level | Name | Abeka Equivalent | Count |
|-------|------|-----------------|-------|
| 5 | Learning Journey | Grade (K4-G12) | 14 |
| 4 | Weekly Plan | ~24-25 weeks/grade | ~350 |
| 3 | Daily Plan | Day bundle | ~2,380 |
| 2 | Lesson Package | Lesson # (001-170) | 2,380 |
| 1 | Video | Subject video | 20,195 |

---

## 2. Architecture Design

### 2.1 Domain Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRICULUM HIERARCHY                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐                                           │
│  │ LearningJourney │  (Grade-level container)                   │
│  │ - gradeCode     │  e.g., "K4", "K5", "G1"..."G12"            │
│  │ - gradeNumber   │  -1, 0, 1, 2...12                          │
│  │ - abekaCode     │  e.g., "01", "02"..."12"                   │
│  │ - title         │  "Grade 1: Phonics & Math Foundations"     │
│  │ - description   │  Long-form pedagogical narrative            │
│  │ - weekCount     │  34 (standard academic year)                │
│  │ - lessonCount   │  170                                        │
│  └────────┬────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                           │
│  │   WeeklyPlan    │  (Theme-based week)                        │
│  │ - weekNo        │  1-34                                       │
│  │ - themeTitle    │  "Short Vowels & Addition"                  │
│  │ - themeDesc     │  Pedagogical focus                          │
│  │ - learningGoals │  JSON array of objectives                   │
│  │ - weekType      │  "CORE", "REVIEW", "ASSESSMENT"             │
│  └────────┬────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                           │
│  │   DailyPlan     │  (Day bundle)                               │
│  │ - dayNo         │  1-5 (Mon-Fri)                              │
│  │ - lessonNumber  │  Maps to Abeka lesson (1-170)               │
│  │ - dayTheme      │  e.g., "Letter A Day"                       │
│  │ - suggestedOrder│  Subject sequence JSON                      │
│  │ - estimatedMin  │  Total daily learning time                  │
│  └────────┬────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                           │
│  │  LessonPackage  │  (Lesson # container)                       │
│  │ - lessonNumber  │  001-170                                    │
│  │ - abekaLessonId │  "01-001", "05-042"                         │
│  │ - title         │  "Lesson 42: Three-Letter Words"              │
│  │ - objectives    │  JSON learning objectives                   │
│  │ - subjectCount  │  # of subjects in this lesson               │
│  │ - prerequisite  │  Previous lesson ref                        │
│  └────────┬────────┘                                           │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                           │
│  │ CurriculumVideo │  (Subject-specific video)                   │
│  │ - abekaCode     │  e.g., "01PH042F"                           │
│  │ - subjectCode   │  "PH" (Phonics), "AT" (Arithmetic)...       │
│  │ - subjectName   │  "Phonics 1"                                │
│  │ - videoUrl      │  CDN URL                                    │
│  │ - durationMin   │  Estimated duration                         │
│  │ - teacher       │  "Miss Howe", "Miss Green"                  │
│  │ - materialType  │  "CORE", "SUPPLEMENTAL", "ENRICHMENT"       │
│  └─────────────────┘                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Database Schema (Prisma)

```prisma
// ========== CURRICULUM HIERARCHY SYSTEM ==========

enum CurriculumGrade {
  K4
  K5
  G1
  G2
  G3
  G4
  G5
  G6
  G7
  G8
  G9
  G10
  G11
  G12
}

enum WeekType {
  CORE
  REVIEW
  ASSESSMENT
  PROJECT
  BREAK
}

enum MaterialType {
  CORE
  SUPPLEMENTAL
  ENRICHMENT
  ASSESSMENT
}

// Level 5: Learning Journey (Grade)
model CurriculumLearningJourney {
  id              String              @id @default(cuid())
  grade           CurriculumGrade     @unique
  gradeNumber     Int                 // -1=K4, 0=K5, 1-12=Grades
  abekaCode       String              // "00"=K4, "01"=G1, etc.
  title           String
  description     String
  overviewMarkdown String?            // Rich curriculum overview
  weekCount       Int                 @default(34)
  lessonCount     Int                 @default(170)
  estimatedMinutesPerDay Int          @default(120)
  isPublished     Boolean             @default(false)
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt
  
  // Relationships
  weeklyPlans     CurriculumWeeklyPlan[]
  lessonPackages  CurriculumLessonPackage[]
  subjectMap      CurriculumSubjectMap[]
  childProgress   ChildJourneyProgress[]
  
  @@index([grade, isPublished])
}

// Subject definitions per grade
model CurriculumSubjectMap {
  id              String                  @id @default(cuid())
  journeyId       String
  subjectCode     String                  // "PH", "AT", "BI", "SC"
  subjectName     String                  // "Phonics", "Arithmetic"
  subjectNameVi   String?                 // Vietnamese translation
  description     String?
  orderIndex      Int                     // Display order
  isCore          Boolean                 @default(true)
  videoCount      Int                     @default(0)
  materialType    MaterialType            @default(CORE)
  iconUrl         String?
  colorHex        String?                 // UI color coding
  createdAt       DateTime                @default(now())
  
  journey         CurriculumLearningJourney @relation(fields: [journeyId], references: [id], onDelete: Cascade)
  videos          CurriculumVideo[]
  
  @@unique([journeyId, subjectCode])
  @@index([journeyId, orderIndex])
}

// Level 4: Weekly Plan
model CurriculumWeeklyPlan {
  id              String                  @id @default(cuid())
  journeyId       String
  weekNo          Int                     // 1-34
  themeTitle      String                  // e.g., "Short Vowels"
  themeDescription String
  learningGoals   Json                    // Array of objectives
  weekType        WeekType                @default(CORE)
  suggestedPace   Json?                   // { daysPerWeek: 5, minutesPerDay: 120 }
  isPublished     Boolean                 @default(false)
  createdAt       DateTime                @default(now())
  updatedAt       DateTime                @updatedAt
  
  // Relationships
  journey         CurriculumLearningJourney @relation(fields: [journeyId], references: [id], onDelete: Cascade)
  dailyPlans      CurriculumDailyPlan[]
  
  @@unique([journeyId, weekNo])
  @@index([journeyId, weekNo])
}

// Level 3: Daily Plan
model CurriculumDailyPlan {
  id                String                  @id @default(cuid())
  weeklyPlanId      String
  dayNo             Int                     // 1-5 (Mon-Fri)
  lessonNumber      Int                     // Maps to Abeka lesson 1-170
  dayTheme          String?                 // Optional theme
  suggestedOrder    Json                    // Subject sequence: ["PH", "AT", "BI"]
  estimatedMinutes  Int                     @default(90)
  teachingTips      String?                 // Parent guidance
  crossReferences   Json?                   // Related concepts
  isReviewDay       Boolean                 @default(false)
  isAssessmentDay   Boolean                 @default(false)
  createdAt         DateTime                @default(now())
  updatedAt         DateTime                @updatedAt
  
  // Relationships
  weeklyPlan        CurriculumWeeklyPlan  @relation(fields: [weeklyPlanId], references: [id], onDelete: Cascade)
  lessonPackage     CurriculumLessonPackage @relation(fields: [journeyId, lessonNumber], references: [journeyId, lessonNumber])
  
  journeyId         String
  
  @@unique([weeklyPlanId, dayNo])
  @@index([weeklyPlanId, dayNo])
}

// Level 2: Lesson Package
model CurriculumLessonPackage {
  id              String                  @id @default(cuid())
  journeyId       String
  lessonNumber    Int                     // 001-170
  abekaLessonId   String                  // "01-042", "05-001"
  title           String                  // "Lesson 42: Three-Letter Words"
  objectives      Json                    // Learning objectives array
  prerequisites   Json?                   // Previous lessons needed
  subjectCount    Int                     @default(0)
  isKeyMilestone  Boolean                 @default(false)
  createdAt       DateTime                @default(now())
  updatedAt       DateTime                @updatedAt
  
  // Relationships
  journey         CurriculumLearningJourney @relation(fields: [journeyId], references: [id], onDelete: Cascade)
  videos          CurriculumVideo[]
  dailyPlan       CurriculumDailyPlan?
  
  @@unique([journeyId, lessonNumber])
  @@index([journeyId, lessonNumber])
}

// Level 1: Video
model CurriculumVideo {
  id              String                  @id @default(cuid())
  lessonPackageId String
  subjectMapId    String
  abekaCode       String                  // "01PH042F", "05SC001G"
  subjectCode     String                  // "PH", "SC", etc.
  subjectName     String                  // "Phonics 1"
  title           String                  // Video title
  videoUrl        String                  // CDN URL
  m3u8Url         String                  // HLS stream URL
  thumbnailUrl    String?
  durationSeconds Int?                    // Video length
  teacherName     String?                 // "Miss Howe"
  materialType    MaterialType            @default(CORE)
  orderInLesson   Int                     // Sequence within lesson
  isRequired      Boolean                 @default(true)
  transcript      String?                 // Optional transcript
  createdAt       DateTime                @default(now())
  updatedAt       DateTime                @updatedAt
  
  // Relationships
  lessonPackage   CurriculumLessonPackage @relation(fields: [lessonPackageId], references: [id], onDelete: Cascade)
  subjectMap      CurriculumSubjectMap    @relation(fields: [subjectMapId], references: [id], onDelete: Cascade)
  
  // Existing system integration
  existingLessonId String?                // Links to existing Lesson model
  
  @@unique([lessonPackageId, subjectCode])
  @@index([subjectMapId, orderInLesson])
  @@index([abekaCode])
}

// Child Progress Tracking
model ChildJourneyProgress {
  id              String                  @id @default(cuid())
  childId         String
  journeyId       String
  currentWeekNo   Int                     @default(1)
  currentLessonNo Int                     @default(1)
  completedLessons Int                    @default(0)
  startedAt       DateTime                @default(now())
  lastActivityAt  DateTime                @default(now())
  isCompleted     Boolean                 @default(false)
  completedAt     DateTime?
  
  child           ChildProfile            @relation(fields: [childId], references: [id], onDelete: Cascade)
  journey         CurriculumLearningJourney @relation(fields: [journeyId], references: [id], onDelete: Cascade)
  weeklyProgress  ChildWeeklyProgress[]
  
  @@unique([childId, journeyId])
  @@index([childId, journeyId])
}

model ChildWeeklyProgress {
  id              String                  @id @default(cuid())
  journeyProgressId String
  weekNo          Int
  isCompleted     Boolean                 @default(false)
  completedDays   Int                     @default(0)
  startedAt       DateTime                @default(now())
  completedAt     DateTime?
  
  journeyProgress ChildJourneyProgress    @relation(fields: [journeyProgressId], references: [id], onDelete: Cascade)
  
  @@unique([journeyProgressId, weekNo])
}
```

### 2.3 Abeka Subject Code Mapping

| Code | Subject | Grades | Notes |
|------|---------|--------|-------|
| PH | Phonics | K4-2 | Reading foundation |
| AT | Arithmetic | K4-6 | Core math |
| BI | Bible | K4-12 | Daily devotionals |
| AC | Activities | K4-1 | Arts/crafts |
| HA | Classroom Routines | K4-K5 | Procedures |
| SE | Seatwork (Cursive) | 1-3 | Penmanship |
| SM | Seatwork (Manuscript) | 1-3 | Penmanship |
| SP | Spelling | 1-6 | Word study |
| CW | Writing (Cursive) | 1-6 | Composition |
| MW | Writing (Manuscript) | 1-2 | Early writing |
| EA | Reading AM (Elephants) | 1 | Reading groups |
| EP | Reading PM (Elephants) | 1 | Reading groups |
| GA | Reading AM (Giraffes) | 1 | Reading groups |
| GP | Reading PM (Giraffes) | 1 | Reading groups |
| MA | Reading AM (Monkeys) | 1 | Reading groups |
| MP | Reading PM (Monkeys) | 1 | Reading groups |
| LA | Language | 3-12 | Grammar/composition |
| SC | Science/Health | 3-12 | Sciences |
| RE | Reading | 2-12 | Literature |
| HI | History | 3-12 | Social studies |
| WR | Writing | 5-12 | Advanced writing |
| AB | Arithmetic Combo | 1-2 | Combined practice |

---

## 3. Hierarchy Mapping: Abeka Structure → Learning System

### 3.1 Grade Mapping

```
Abeka Grade     Grade Number    Abeka Code    Journey Title
─────────────────────────────────────────────────────────────
K4              -1              00            "Foundations: K4"
K5              0               00            "Kindergarten: K5"
1               1               01            "Grade 1: Core Skills"
2               2               02            "Grade 2: Building Confidence"
3               3               03            "Grade 3: Independent Learning"
4               4               04            "Grade 4: Critical Thinking"
5               5               05            "Grade 5: Comprehensive Study"
6               6               06            "Grade 6: Advanced Foundations"
7               7               07            "Grade 7: Middle School Prep"
8               8               08            "Grade 8: Deeper Analysis"
9               9               09            "Grade 9: High School"
10              10              10            "Grade 10: Advanced Studies"
11              11              11            "Grade 11: College Prep"
12              12              12            "Grade 12: Senior Mastery"
```

### 3.2 Lesson Distribution

**Standard Academic Calendar**:
- 34 weeks per grade
- 170 lessons per grade
- 5 lessons per week (Mon-Fri)
- ~8.5 videos per lesson (varies by grade/subject)

```
Week → Lessons
────────────────
Week 1   → Lessons 1-5
Week 2   → Lessons 6-10
...
Week 17  → Lessons 81-85 (Mid-year)
...
Week 34  → Lessons 166-170
```

### 3.3 Subject Variation by Grade

**Early Grades (K4-2)**: 8-12 subjects
- Phonics, Arithmetic, Bible, Activities, Seatwork, Spelling, Writing, Reading Groups

**Middle Grades (3-4)**: 6-8 subjects  
- Language replaces Phonics, consolidated Reading

**Upper Grades (5-12)**: 6-8 subjects
- Language, Arithmetic/Science/History/Reading/Spelling/Writing/Bible

---

## 4. User Flow Diagrams

### 4.1 Parent Planning Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    PARENT PLANNING FLOW                          │
└──────────────────────────────────────────────────────────────────┘

[1] LANDING: Curriculum Map Browser
    │
    ├─ View all 14 grades (K4-G12)
    ├─ Grade cards with: title, subject count, est. duration
    └─ "Start Planning" CTA
    │
    ▼
[2] SELECT GRADE → Learning Journey Detail
    │
    ├─ Grade overview with description
    ├─ Subject legend (color-coded)
    ├─ 34-week grid (expandable)
    └─ "View Weekly Plans" or "Customize"
    │
    ▼
[3] WEEKLY PLAN VIEW
    │
    ├─ Week selector (1-34)
    ├─ Theme cards for each week
    ├─ Learning goals per week
    ├─ Progress bar (if child enrolled)
    └─ "View Daily Breakdown"
    │
    ▼
[4] DAILY PLAN VIEW
    │
    ├─ 5-day view (Mon-Fri)
    ├─ Each day shows:
    │   ├─ Lesson number
    │   ├─ Estimated time
    │   ├─ Subject sequence
    │   └─ Theme/title
    ├─ Drag to reorder subjects
    ├─ "Mark Complete" / "Skip"
    └─ "View Lesson Package"
    │
    ▼
[5] LESSON PACKAGE DETAIL
    │
    ├─ All videos for this lesson
    ├─ Subject cards with:
    │   ├─ Thumbnail
    │   ├─ Duration
    │   ├─ Teacher
    │   └─ Material type (core/supplemental)
    ├─ "Play Video" → Links to Lesson Wizard
    ├─ "Download Resources"
    └─ "Mark Complete"
    │
    ▼
[6] ASSIGN TO CHILD
    │
    ├─ Select child profile
    ├─ Set start date
    ├─ Set pace (standard/accelerated/custom)
    ├─ Confirm weekly schedule
    └─ "Create Learning Path"
```

### 4.2 Student Navigation Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    STUDENT NAVIGATION FLOW                       │
└──────────────────────────────────────────────────────────────────┘

[1] MY LEARNING DASHBOARD
    │
    ├─ Active Learning Journey(s)
    ├─ Current week/day highlight
    ├─ Progress visual (tree/garden metaphor)
    ├─ Streak counter
    └─ Today's assignments
    │
    ▼
[2] TODAY'S LESSON
    │
    ├─ "Day X of Week Y"
    ├─ Fun theme title
    ├─ Subject icons in sequence
    ├─ Estimated completion time
    └─ "Start Learning" button
    │
    ▼
[3] SUBJECT SEQUENCE
    │
    ├─ Visual path: Subject 1 → Subject 2 → ...
    ├─ Each subject:
    │   ├─ Icon + name
    │   ├─ Progress indicator
    │   └─ "Start" / "Continue" / "Completed"
    ├─ Unlock animation between subjects
    └─ Completion celebration
    │
    ▼
[4] VIDEO PLAYER INTEGRATION
    │
    ├─ Launch existing Lesson Wizard
    ├─ Auto-return to Curriculum Map
    ├─ Mark subject complete
    └─ Next subject unlocks
    │
    ▼
[5] DAILY COMPLETION
    │
    ├─ Confetti/celebration
    ├─ Summary: what learned today
    ├─ Preview: tomorrow's theme
    ├─ Streak update
    └─ "Share with Parent" option
```

### 4.3 Teacher/Admin Content Management Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                 CONTENT MANAGEMENT FLOW                          │
└──────────────────────────────────────────────────────────────────┘

[1] CURRICULUM ADMIN DASHBOARD
    │
    ├─ Import from Abeka JSON
    ├─ Publish/Edit journeys
    ├─ Weekly plan editor
    └─ Analytics overview
    │
    ▼
[2] IMPORT WORKFLOW
    │
    ├─ Upload grade JSON (001.json - 170.json)
    ├─ Parse subjects automatically
    ├─ Map subject codes
    ├─ Generate CDN URLs
    ├─ Create Lesson Packages
    └─ Create Video records
    │
    ▼
[3] WEEKLY PLAN EDITOR
    │
    ├─ Select grade
    ├─ Week grid (1-34)
    ├─ Theme assignment per week
    ├─ Learning goals input
    ├─ Drag lessons to adjust
    └─ Bulk edit mode
    │
    ▼
[4] PUBLISH WORKFLOW
    │
    ├─ Preview mode
    ├─ Validation checks
    ├─ Draft → Review → Published
    └─ Rollback capability
```

---

## 5. Differentiation Analysis

### 5.1 Existing Systems Overview

| System | Purpose | User | Key Feature |
|--------|---------|------|-------------|
| **Lesson Wizard** | Video playback | Student | Guided lesson flow |
| **Interactive Lesson** | Interactive content | Student | Quizzes/activities |
| **Hybrid Lesson** | Mixed media | Student | Video + worksheets |

### 5.2 New System: Curriculum Map

| Aspect | Existing | New (Curriculum Map) |
|--------|----------|---------------------|
| **Primary Purpose** | Content consumption | Content organization & planning |
| **Main User** | Student | Parent/Teacher |
| **Secondary User** | Parent (view only) | Student (navigation) |
| **Time Scale** | Single lesson | Day/Week/Year |
| **Core Function** | Video player | Curriculum browser |
| **Hierarchy** | Flat (lessons list) | 5-level nested |
| **Planning** | None | Weekly/Daily planning |
| **Progress Tracking** | Per lesson | Multi-level progress |
| **Customization** | Limited | Pace, sequence, skip |
| **Discovery** | Linear | Cross-reference, themes |

### 5.3 Integration Points

```
Curriculum Map ─────────► Lesson Wizard
     │                         │
     │                         │
     ├─ Pass video URL ───────┤
     ├─ Pass lesson context ───┤
     ├─ Receive completion ────┤
     │                         │
     ▼                         ▼
Progress Store ◄────────── Completion Event
```

**Integration Flow**:
1. User clicks "Play Video" in Curriculum Map
2. System launches Lesson Wizard with:
   - Video URL from CDN
   - Lesson context (grade, subject, position)
   - Return URL to Curriculum Map
3. Lesson Wizard handles playback
4. On completion, Lesson Wizard notifies Curriculum Map
5. Curriculum Map updates progress tracking

---

## 6. Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Database schema migration
- [ ] Core models: LearningJourney, WeeklyPlan, DailyPlan, LessonPackage, Video
- [ ] Abeka JSON import pipeline
- [ ] Basic API endpoints (CRUD)

### Phase 2: Content Population (Weeks 3-4)
- [ ] Import all 14 grades (K4-G12)
- [ ] Map all subject codes
- [ ] Generate CDN URLs
- [ ] Create default weekly plans (34 weeks each)
- [ ] Content validation & QA

### Phase 3: Parent Interface (Weeks 5-6)
- [ ] Curriculum browser UI
- [ ] Grade selection view
- [ ] Weekly plan viewer
- [ ] Daily plan detail
- [ ] Assignment to child workflow

### Phase 4: Student Interface (Weeks 7-8)
- [ ] My Learning dashboard
- [ ] Today's lesson view
- [ ] Subject sequence navigation
- [ ] Progress visualization
- [ ] Lesson Wizard integration

### Phase 5: Progress Tracking (Weeks 9-10)
- [ ] ChildJourneyProgress model
- [ ] Weekly progress tracking
- [ ] Completion analytics
- [ ] Parent reporting integration
- [ ] Streak/gamification hooks

### Phase 6: Advanced Features (Weeks 11-12)
- [ ] Custom pacing options
- [ ] Subject reordering
- [ ] Cross-reference discovery
- [ ] Search functionality
- [ ] Recommendation engine

---

## 7. Technical Specifications

### 7.1 API Endpoints

```typescript
// Curriculum Discovery
GET /api/curriculum/journeys                    // List all grades
GET /api/curriculum/journeys/:grade             // Grade detail
GET /api/curriculum/journeys/:grade/weeks      // Weekly plans
GET /api/curriculum/journeys/:grade/weeks/:week // Week detail
GET /api/curriculum/journeys/:grade/lessons/:num // Lesson package
GET /api/curriculum/videos/:id                  // Video detail

// Parent Planning
POST /api/curriculum/plans                      // Create custom plan
GET /api/curriculum/plans/:id                   // Get plan
PUT /api/curriculum/plans/:id                   // Update plan
DELETE /api/curriculum/plans/:id                // Delete plan
POST /api/curriculum/plans/:id/assign           // Assign to child

// Child Progress
GET /api/curriculum/children/:childId/progress  // All journey progress
GET /api/curriculum/children/:childId/progress/:grade
POST /api/curriculum/children/:childId/progress/:grade/complete-day
POST /api/curriculum/children/:childId/progress/:grade/complete-week

// Admin/Content Management
POST /api/admin/curriculum/import               // Import Abeka JSON
GET /api/admin/curriculum/validation            // Validation status
PUT /api/admin/curriculum/weeks/:id             // Update week
PUT /api/admin/curriculum/days/:id              // Update day
```

### 7.2 Data Import Pipeline

```
Abeka JSON Files (docs/api/abeka/)
    │
    ▼
┌──────────────────┐
│ Import Service   │
│ - Parse JSON     │
│ - Extract videos │
│ - Map subjects   │
└────────┬─────────┘
    │
    ▼
┌──────────────────┐
│ CDN URL Builder  │
│ - Pattern match   │
│ - Validate URLs   │
│ - Generate thumbs │
└────────┬─────────┘
    │
    ▼
┌──────────────────┐
│ Database Seeding │
│ - Create packages│
│ - Link videos    │
│ - Build hierarchy │
└────────┬─────────┘
    │
    ▼
Validation & QA
```

### 7.3 Performance Considerations

| Aspect | Strategy |
|--------|----------|
| **20K videos** | Lazy loading, pagination, virtual scroll |
| **14 grades** | Server-side rendering for list, client for detail |
| **CDN URLs** | Pre-generate, cache for 24h |
| **Progress tracking** | Incremental updates, debounced writes |
| **Weekly plans** | Static generation, ISR for updates |
| **Images** | Next.js Image optimization, lazy load |

---

## 8. User Interface Mockups

### 8.1 Curriculum Browser (Parent View)

```
┌─────────────────────────────────────────────────────────────────┐
│  📚 Curriculum Map                                [Search...]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Early Childhood                                                │
│  ┌──────────────┐ ┌──────────────┐                             │
│  │ 🎨 K4        │ │ 🖍️ K5        │                             │
│  │ Foundations  │ │ Kindergarten │                             │
│  │ 170 lessons  │ │ 170 lessons  │                             │
│  │ ~8 subjects  │ │ ~9 subjects  │                             │
│  │ [View Plan]  │ │ [View Plan]  │                             │
│  └──────────────┘ └──────────────┘                             │
│                                                                 │
│  Elementary                                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ 📖 G1    │ │ 📖 G2    │ │ 📖 G3    │ │ 📖 G4    │           │
│  │ Core     │ │ Building │ │ Indep.   │ │ Critical │           │
│  │ Skills   │ │ Confid.  │ │ Learning │ │ Thinking │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                 │
│  ... (G5-G12 similar)                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Weekly Plan View

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Grade 1: Core Skills                          [Assign] [▼] │
├─────────────────────────────────────────────────────────────────┤
│  Week: [1 ▼] [2 ▼] [3 ▼] ... [34]                             │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ WEEK 1: Letters A-E & Numbers 1-5                         │ │
│  │                                                           │ │
│  │ Learning Goals:                                           │ │
│  │ • Recognize letter sounds A, B, C, D, E                 │ │
│  │ • Count and write numbers 1-5                           │ │
│  │ • Daily Bible verse memorization                         │ │
│  │                                                           │ │
│  │ Daily Breakdown:                                        │ │
│  │ ┌────────┬────────┬────────┬────────┬────────┐         │ │
│  │ │ Day 1  │ Day 2  │ Day 3  │ Day 4  │ Day 5  │         │ │
│  │ │ L1     │ L2     │ L3     │ L4     │ L5     │         │ │
│  │ │ A Day  │ B Day  │ C Day  │ D Day  │ E Day  │         │ │
│  │ │ 8 vid  │ 8 vid  │ 9 vid  │ 8 vid  │ 8 vid  │         │ │
│  │ │ [View] │ [View] │ [View] │ [View] │ [View] │         │ │
│  │ └────────┴────────┴────────┴────────┴────────┘         │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Subjects this week: 🎯 Phonics 🔢 Arithmetic ✝️ Bible 📚 Reading│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Daily Lesson Detail

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Week 1                                     [Mark Complete]   │
├─────────────────────────────────────────────────────────────────┤
│  DAY 1: Letter A Day                                            │
│  Lesson 1 • ~90 minutes • 8 videos                              │
│                                                                 │
│  Your Learning Path:                                            │
│                                                                 │
│  ┌─────────► ┌─────────► ┌─────────► ┌─────────► ┌─────────┐   │
│  │ 🎯      │ │ 🔢      │ │ ✝️      │ │ 📝      │ │ 🎨      │   │
│  │ PHONICS │ │ MATH    │ │ BIBLE   │ │ WRITING│ │ ACTIVITY│   │
│  │         │ │         │ │         │ │        │ │        │   │
│  │ 15 min  │ │ 20 min  │ │ 10 min  │ │ 15 min │ │ 30 min │   │
│  │         │ │         │ │         │        │ │        │   │
│  │ [Start] │ │ [Lock]  │ │ [Lock]  │ │ [Lock] │ │ [Lock] │   │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │
│                                                                 │
│  Phonics 1: Letter A                                            │
│  Miss Howe • 15 minutes • Core                                  │
│  [▶️ Play Video] [📋 Worksheet] [✓ Mark Done]                   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Learning Objectives:                                           │
│  ✓ Identify uppercase and lowercase A                         │
│  ✓ Produce the /a/ sound                                        │
│  ✓ Recognize words starting with A (apple, alligator)         │
│                                                                 │
│  Parent Tips:                                                   │
│  💡 Practice writing the letter A on paper first              │
│  💡 Look for A words around your home                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Abeka 170-Lesson Structure Handling

### 9.1 Standard Distribution

```
Academic Year: 34 weeks × 5 days = 170 days

Distribution:
- Core learning: 30 weeks (150 lessons)
- Review weeks: 3 weeks (15 lessons)
- Assessment/project: 1 week (5 lessons)

Special Weeks:
- Week 17: Mid-year review
- Week 34: Final review + celebration
```

### 9.2 Flexible Pacing Options

| Pace | Lessons/Week | Duration | Use Case |
|------|-------------|----------|----------|
| Standard | 5 | 34 weeks | Normal academic year |
| Accelerated | 10 | 17 weeks | Summer intensive |
| Relaxed | 3-4 | 42-56 weeks | Extended learning |
| Custom | Variable | User-defined | Special needs |

### 9.3 Lesson Numbering

```
Abeka Format: {grade}-{lesson}
Examples: "01-001", "05-042", "12-170"

Grade Codes:
- K4: 00 (with suffix K4)
- K5: 00 (with suffix K5)
- 1-12: 01-12

Lesson Numbers:
- 3 digits: 001-170
- Leading zeros for consistent sorting
```

---

## 10. CDN Integration

### 10.1 Video URL Pattern

```
Base URL: https://fileta.hoctienganh.xyz/abk/

Pattern: {year}/{grade}/{code}/{code}.m3u8

Examples:
- Grade 1, Lesson 1, Phonics: 
  /2023/01/01PH001F/01PH001F.m3u8
  
- Grade 5, Lesson 42, Science:
  /2025/05/05SC042G/05SC042G.m3u8

Code Format: {grade}{subject}{lesson}{teacher}
- Grade: 01-12 (or 00 for K4/K5)
- Subject: PH, AT, BI, SC, etc.
- Lesson: 001-170
- Teacher: F (Howe), G (Green), A (Amsbaugh), etc.
```

### 10.2 CDN Integration Points

```
CurriculumVideo Model:
  abekaCode: "01PH001F"
  videoUrl: "https://fileta.hoctienganh.xyz/abk/2023/01/01PH001F/01PH001F.m3u8"
  thumbnailUrl: "https://fileta.hoctienganh.xyz/abk/2023/01/01PH001F/thumb.jpg"
```

### 10.3 Fallback Strategy

```
1. Primary: hoctienganh.xyz CDN
2. Secondary: Bunny.net (if configured)
3. Tertiary: Direct file URL
4. Error: "Video temporarily unavailable"
```

---

## 11. Analytics & Reporting

### 11.1 Tracking Metrics

| Metric | Level | Calculation |
|--------|-------|-------------|
| Completion Rate | Journey | Completed lessons / Total lessons |
| Pace Variance | Weekly | Planned vs. actual lessons completed |
| Subject Balance | Daily | Time spent per subject |
| Streak | Journey | Consecutive days with activity |
| Engagement | Video | Watch time / Video duration |
| Mastery | Lesson | Quiz scores + completion quality |

### 11.2 Parent Reports

```
Weekly Summary Email:
- Progress this week: X/5 days completed
- Time spent: Y hours across Z subjects
- Streak: W consecutive days
- Next week preview: Theme + learning goals
- Suggested activities: Cross-curricular links
```

---

## 12. Unresolved Questions

1. **Q**: Should we support multiple concurrent journeys per child (e.g., grade-level math + advanced reading)?
   - **Impact**: Data model, UI complexity, progress tracking

2. **Q**: How to handle mid-year grade transitions (e.g., child finishes G1 in March)?
   - **Impact**: Enrollment dates, progress migration

3. **Q**: Should parents be able to create custom sequences (reorder lessons)?
   - **Impact**: Curriculum integrity vs. customization flexibility

4. **Q**: Do we need offline support for video downloads?
   - **Impact**: Storage, DRM, sync complexity

5. **Q**: How to integrate with existing adaptive learning engine?
   - **Impact**: Skill mapping, prerequisite validation

6. **Q**: What's the migration path for existing lesson completions?
   - **Impact**: Data migration script, backward compatibility

---

## 13. Success Metrics

| KPI | Target | Measurement |
|-----|--------|-------------|
| Parent engagement | 70% weekly planning | Weekly plan views |
| Child completion | 60% daily goals | Day completion rate |
| Content discovery | 3 grades explored | Unique journey views |
| Time to plan | <5 min | Weekly plan creation time |
| Retention | 80% week-4 active | Child return rate |
| NPS | >50 | Parent satisfaction survey |

---

## 14. Appendices

### Appendix A: Abeka Data Sample

**Grade 1, Lesson 1 (docs/api/abeka/1/001.json)**:
```json
[
  {
    "title": "Phonics 1",
    "file": "https://fileta.hoctienganh.xyz/abk/2023/01/01PH001F/01PH001F.m3u8",
    "description": "Phonics 1 - Lesson: 1 - Teacher: Miss Howe",
    "image": "/images/banner.jpg"
  },
  {
    "title": "Arithmetic 1: Arithmetic",
    "file": "https://fileta.hoctienganh.xyz/abk/2023/01/01AT001F/01AT001F.m3u8",
    "description": "Arithmetic 1: Arithmetic - Lesson: 1 - Teacher: Miss Howe",
    "image": "/images/banner.jpg"
  },
  ...
]
```

**Grade 5, Lesson 1 (docs/api/abeka/5/001.json)**:
```json
[
  {
    "title": "Language 5",
    "file": "https://fileta.hoctienganh.xyz/abk/2025/05/05LA001G/05LA001G.m3u8",
    "description": "Language 5 - Lesson: 1 - Teacher: Miss Green",
    "image": "/images/banner.jpg"
  },
  {
    "title": "Arithmetic 5",
    "file": "https://fileta.hoctienganh.xyz/abk/2025/05/05AT001G/05AT001G.m3u8",
    "description": "Arithmetic 5 - Lesson: 1 - Teacher: Miss Amsbaugh",
    "image": "/images/banner.jpg"
  },
  ...
]
```

### Appendix B: Subject Matrix by Grade

| Subject | K4 | K5 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---------|----|----|---|---|---|---|---|---|---|---|---|----|----|----|
| Phonics | ✓ | ✓ | ✓ | ✓ | - | - | - | - | - | - | - | - | - | - |
| Language | - | - | - | - | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Arithmetic | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Math | - | - | - | - | - | - | - | - | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Bible | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Science | - | - | - | - | - | - | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| History | - | - | - | - | - | - | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Reading | - | - | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Spelling | - | - | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Writing | - | - | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Seatwork | - | - | ✓ | ✓ | ✓ | - | - | - | - | - | - | - | - | - |
| Activities | ✓ | ✓ | ✓ | - | - | - | - | - | - | - | - | - | - | - |

### Appendix C: API Response Examples

**GET /api/curriculum/journeys/G1**:
```json
{
  "id": "cl...",
  "grade": "G1",
  "gradeNumber": 1,
  "abekaCode": "01",
  "title": "Grade 1: Core Skills",
  "description": "First grade curriculum focusing on phonics, arithmetic, and Bible...",
  "weekCount": 34,
  "lessonCount": 170,
  "subjects": [
    { "code": "PH", "name": "Phonics", "videoCount": 170, "isCore": true },
    { "code": "AT", "name": "Arithmetic", "videoCount": 170, "isCore": true },
    { "code": "BI", "name": "Bible", "videoCount": 170, "isCore": true },
    ...
  ],
  "weeklyPlans": [
    { "weekNo": 1, "themeTitle": "Letters A-E", "lessonStart": 1, "lessonEnd": 5 },
    ...
  ]
}
```

**GET /api/curriculum/journeys/G1/lessons/42**:
```json
{
  "id": "cl...",
  "lessonNumber": 42,
  "abekaLessonId": "01-042",
  "title": "Lesson 42: Three-Letter Words",
  "objectives": ["Blend three-letter words", "Read sentences"],
  "videos": [
    {
      "id": "cl...",
      "subjectCode": "PH",
      "subjectName": "Phonics 1",
      "title": "Phonics 1 - Lesson 42",
      "videoUrl": "https://fileta.hoctienganh.xyz/abk/2023/01/01PH042F/01PH042F.m3u8",
      "durationSeconds": 900,
      "teacherName": "Miss Howe",
      "materialType": "CORE"
    },
    ...
  ]
}
```

---

**Document Version**: 1.0
**Last Updated**: 2026-04-03
**Author**: Planning Agent
**Status**: Design Complete

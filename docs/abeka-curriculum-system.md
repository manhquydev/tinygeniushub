# Abeka Curriculum Organization System

A comprehensive curriculum management system for organizing 20,195 Abeka educational videos across 14 grades (K4-12).

## Overview

This system provides:
- **27 Prisma models** for curriculum, learning plans, progress tracking, and gamification
- **JSON import pipeline** to parse Abeka video metadata
- **REST API endpoints** for curriculum CRUD operations
- **Progress tracking** with streaks, badges, and skill trees

## Database Schema

### Core Models
- `AbekaGrade` - 14 grades (K4, K5, Grade 1-12)
- `AbekaSubject` - Subjects per grade (Phonics, Math, Science, etc.)
- `AbekaLesson` - 170 lessons per grade
- `AbekaVideo` - Individual video units (~20,195 total)
- `AbekaLessonPackage` - Groups videos by subject within a lesson

### Planning Models
- `AbekaLearningJourney` - Child's learning path through a grade
- `AbekaWeeklyPlan` - Week-by-week schedule
- `AbekaDailyPlan` - Daily assignments
- `AbekaAssignment` - Individual subject assignments

### Progress Models
- `AbekaWatchProgress` - Video completion tracking
- `ChildGradeProgress` - Grade-level progress
- `AbekaStreak` - Learning streak tracking
- `AbekaSkillNode` - Skill tree structure
- `ChildSkillProgress` - Individual skill progress

### Gamification Models
- `AbekaBadge` - Achievement badges
- `ChildEarnedBadge` - Earned badge tracking
- `AbekaParentPreferences` - Parent configuration

## Usage

### Import Curriculum Data

```bash
# Import all grades (K4-12)
pnpm abeka:import

# Import specific grade
pnpm abeka:import --grade=1

# Reset and reimport
pnpm abeka:import --reset

# Verbose output
pnpm abeka:import --verbose
```

### Seed Database

```bash
# Seed with all data including skill trees and badges
pnpm db:seed:abeka

# Seed without extras (only curriculum)
pnpm db:seed:abeka --skip-extras

# Reset and seed
pnpm db:seed:abeka --reset
```

### API Endpoints

#### Curriculum
```
GET /api/abeka/curriculum/grades
GET /api/abeka/curriculum/grades/[id]
GET /api/abeka/curriculum/subjects?gradeId=
GET /api/abeka/curriculum/lessons?gradeId=&lessonNumber=
```

#### Planning
```
GET /api/abeka/plans/journeys?childId=
POST /api/abeka/plans/journeys
```

#### Progress
```
GET /api/abeka/progress/watch?childId=&videoId=
POST /api/abeka/progress/watch
```

## Data Structure

### Video ID Format
```
{grade}{subject}{lesson}{type}
Example: 01PH001F
- 01 = Grade 1
- PH = Phonics
- 001 = Lesson 1
- F = Full/Complete
```

### Subject Codes
| Code | Subject |
|------|---------|
| PH | Phonics |
| AT | Arithmetic |
| AB | Arithmetic Combination |
| BI | Bible |
| HI | History |
| SC | Science |
| ... | ... |

## Migration

To apply the database migration:

```bash
# Create migration (already created)
pnpm db:migrate

# Or apply manually
psql -d cungcontuhoc -f prisma/migrations/20250403233600_abeka_curriculum_system/migration.sql
```

## File Structure

```
src/lib/abeka/
├── import/
│   ├── index.ts          # Public exports
│   ├── types.ts          # TypeScript types
│   ├── parser.ts         # Video ID parser
│   └── service.ts        # Import service

app/api/abeka/
├── curriculum/
│   ├── grades/
│   ├── subjects/
│   └── lessons/
├── plans/
│   └── journeys/
└── progress/
    └── watch/

prisma/
├── migrations/
│   └── 20250403233600_abeka_curriculum_system/
│       └── migration.sql
└── seeders/
    └── abeka-curriculum.ts

scripts/abeka/
└── import-curriculum.ts   # CLI import script
```

## Statistics

| Metric | Value |
|--------|-------|
| Total Videos | 20,195 |
| Grade Providers | 14 (K4-12) |
| Lessons per Grade | 170 |
| Total Lessons | 2,380 |
| Subjects | 20+ |
| Database Models | 27 |
| API Endpoints | 8+ |

## Future Enhancements

- [ ] Weekly plan auto-generation
- [ ] Streak freeze mechanics
- [ ] Badge unlock triggers
- [ ] Parent dashboard API
- [ ] Video recommendation engine
- [ ] Offline progress sync

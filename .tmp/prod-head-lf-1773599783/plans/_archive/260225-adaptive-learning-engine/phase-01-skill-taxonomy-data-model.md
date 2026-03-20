# Phase 1: Skill Taxonomy & Data Model

## Context

- Schema hien tai: `prisma/schema.prisma`
- Module content: `src/modules/content/`
- Module learning: `src/modules/learning/`
- Brainstorm: `plans/reports/brainstorm-mobymax-vn-260225.md`

## Overview

- **Priority:** P1 - Foundation cho toan bo engine
- **Status:** pending
- **Effort:** 2-3 weeks

## Key Insights

- Hien tai da co `Track > Level > Unit > Lesson > Activity` hierarchy
- Can them Skill taxonomy doc lap — mot Lesson co the cover nhieu Skills, mot Skill co the xuat hien trong nhieu Lessons
- Skill co DAG (directed acyclic graph) prerequisites, KHONG phai cay don gian
- Can `difficulty` level cho tung Activity de engine chon cau hoi phu hop

## Schema Changes

### New Enums

```prisma
enum SkillDomain {
  MATH
  ENGLISH_PHONICS
}

enum MasteryLevel {
  NOT_STARTED    // Chua bat dau
  NOVICE         // < 40% mastery
  DEVELOPING     // 40-69%
  PROFICIENT     // 70-89%
  MASTERED       // >= 90%
}

enum DifficultyLevel {
  EASY
  MEDIUM
  HARD
}
```

### New Models

```prisma
model Skill {
  id            String         @id @default(cuid())
  code          String         @unique  // e.g. "MATH_ADD_1DIGIT", "PHONICS_CVC"
  domain        SkillDomain
  nameVi        String                  // "Cong so 1 chu so"
  nameEn        String?                 // "Single digit addition"
  description   String?
  gradeLevel    Int                     // 1, 2, 3
  orderNo       Int            @default(0)
  parentId      String?
  iconEmoji     String?                 // "➕"
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  parent        Skill?         @relation("SkillTree", fields: [parentId], references: [id])
  children      Skill[]        @relation("SkillTree")
  prerequisites SkillPrerequisite[] @relation("DependentSkill")
  dependents    SkillPrerequisite[] @relation("PrereqSkill")
  lessonSkills  LessonSkill[]
  childStates   ChildSkillState[]
  attempts      SkillAttempt[]
  testItems     PlacementTestItem[]
  reviewQueues  ReviewQueue[]

  @@index([domain, gradeLevel, orderNo])
  @@index([parentId])
}

model SkillPrerequisite {
  id              String @id @default(cuid())
  skillId         String
  prerequisiteId  String
  skill           Skill  @relation("DependentSkill", fields: [skillId], references: [id], onDelete: Cascade)
  prerequisite    Skill  @relation("PrereqSkill", fields: [prerequisiteId], references: [id], onDelete: Cascade)

  @@unique([skillId, prerequisiteId])
}

model LessonSkill {
  id        String          @id @default(cuid())
  lessonId  String
  skillId   String
  isPrimary Boolean         @default(false)  // main skill cua lesson
  lesson    Lesson          @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  skill     Skill           @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@unique([lessonId, skillId])
  @@index([skillId])
}

model ChildSkillState {
  id              String       @id @default(cuid())
  childId         String
  skillId         String
  masteryScore    Float        @default(0)  // 0.0 - 1.0
  masteryLevel    MasteryLevel @default(NOT_STARTED)
  totalAttempts   Int          @default(0)
  correctAttempts Int          @default(0)
  lastAttemptAt   DateTime?
  lastReviewAt    DateTime?
  nextReviewAt    DateTime?    // spaced repetition
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  child           ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  skill           Skill        @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@unique([childId, skillId])
  @@index([childId, masteryLevel])
  @@index([childId, nextReviewAt])
}

model SkillAttempt {
  id          String          @id @default(cuid())
  childId     String
  skillId     String
  activityId  String?
  isCorrect   Boolean
  responseMs  Int?            // thoi gian tra loi (ms)
  difficulty  DifficultyLevel @default(MEDIUM)
  rawResponse Json?           // cau tra loi cua tre
  createdAt   DateTime        @default(now())

  child       ChildProfile    @relation(fields: [childId], references: [id], onDelete: Cascade)
  skill       Skill           @relation(fields: [skillId], references: [id], onDelete: Cascade)
  activity    Activity?       @relation(fields: [activityId], references: [id], onDelete: SetNull)

  @@index([childId, skillId, createdAt])
  @@index([childId, createdAt])
}
```

### Modify Existing Models

```prisma
// Them vao Activity model
model Activity {
  // ... existing fields ...
  difficulty    DifficultyLevel @default(MEDIUM)
  skillId       String?
  skill         Skill?          @relation(fields: [skillId], references: [id], onDelete: SetNull)
  skillAttempts SkillAttempt[]

  @@index([skillId])
}

// Them vao ChildProfile
model ChildProfile {
  // ... existing fields ...
  skillStates   ChildSkillState[]
  skillAttempts SkillAttempt[]
  reviewQueues  ReviewQueue[]
}
```

## Skill Taxonomy - Toan Lop 1-3

```
MATH (domain)
├── MATH_COUNTING (Dem so)
│   ├── MATH_COUNT_1_10
│   ├── MATH_COUNT_11_20
│   └── MATH_COUNT_21_100
├── MATH_ADDITION (Phep cong)
│   ├── MATH_ADD_1DIGIT (Cong 1 chu so)
│   ├── MATH_ADD_2DIGIT_NO_CARRY (Cong 2 chu so khong nho)
│   ├── MATH_ADD_2DIGIT_CARRY (Cong 2 chu so co nho)
│   └── MATH_ADD_3DIGIT (Cong 3 chu so)
├── MATH_SUBTRACTION (Phep tru)
│   ├── MATH_SUB_1DIGIT
│   ├── MATH_SUB_2DIGIT_NO_BORROW
│   ├── MATH_SUB_2DIGIT_BORROW
│   └── MATH_SUB_3DIGIT
├── MATH_MULTIPLICATION (Phep nhan)
│   ├── MATH_MUL_TABLE_2_5
│   └── MATH_MUL_TABLE_6_9
├── MATH_DIVISION (Phep chia)
│   └── MATH_DIV_BASIC
├── MATH_GEOMETRY (Hinh hoc)
│   ├── MATH_GEO_2D_SHAPES
│   └── MATH_GEO_3D_SHAPES
└── MATH_MEASUREMENT (Do luong)
    ├── MATH_MEAS_LENGTH
    ├── MATH_MEAS_WEIGHT
    └── MATH_MEAS_TIME
```

## Skill Taxonomy - Tieng Anh Phonics

```
ENGLISH_PHONICS (domain)
├── PHONICS_ALPHABET (Alphabet)
│   ├── PHONICS_LETTER_RECOGNITION
│   └── PHONICS_LETTER_SOUNDS
├── PHONICS_CVC (Consonant-Vowel-Consonant)
│   ├── PHONICS_CVC_SHORT_A (cat, bat, hat)
│   ├── PHONICS_CVC_SHORT_E
│   ├── PHONICS_CVC_SHORT_I
│   ├── PHONICS_CVC_SHORT_O
│   └── PHONICS_CVC_SHORT_U
├── PHONICS_BLENDS (Blends)
│   ├── PHONICS_BLEND_INITIAL (bl, cr, dr)
│   └── PHONICS_BLEND_FINAL (nd, nk, mp)
├── PHONICS_DIGRAPHS (Digraphs)
│   ├── PHONICS_DIGRAPH_SH
│   ├── PHONICS_DIGRAPH_CH
│   └── PHONICS_DIGRAPH_TH
└── PHONICS_SIGHT_WORDS (Sight words)
    ├── PHONICS_SIGHT_DOLCH_PRE
    ├── PHONICS_SIGHT_DOLCH_PRIMER
    └── PHONICS_SIGHT_DOLCH_1ST
```

## Implementation Steps

1. **Tao Prisma migration** - Them enums + models moi
2. **Tao module `src/modules/adaptive/`** voi cac files:
   - `skill-taxonomy-service.ts` - CRUD skills, prerequisites
   - `child-skill-state-service.ts` - Tinh mastery, update state
   - `skill-attempt-service.ts` - Ghi nhan cau tra loi
   - `types.ts` - Shared types
3. **Seed script** - Tao skill taxonomy cho Math + Phonics
   - File: `prisma/seeds/skill-taxonomy-seed.ts`
4. **Admin API** - Quan ly skills
   - `GET /api/admin/skills` - List all skills (tree structure)
   - `POST /api/admin/skills` - Create skill
   - `PATCH /api/admin/skills/:id` - Update skill
   - `POST /api/admin/skills/:id/prerequisites` - Add prerequisite
   - `POST /api/admin/lessons/:id/skills` - Tag lesson voi skills
5. **Update Activity model** - Them `difficulty`, `skillId`
6. **Migration script** - Tag existing lessons voi skills (manual mapping)

## Mastery Calculation Algorithm

```typescript
// src/modules/adaptive/child-skill-state-service.ts

const MASTERY_WEIGHTS = {
  recentAccuracy: 0.5,    // 5 lan gan nhat
  overallAccuracy: 0.2,   // tong the
  consistency: 0.15,       // on dinh qua cac lan
  speed: 0.15,             // toc do tra loi
};

function computeMasteryScore(attempts: SkillAttempt[]): number {
  if (attempts.length === 0) return 0;

  const recent = attempts.slice(-5);
  const recentAcc = recent.filter(a => a.isCorrect).length / recent.length;
  const overallAcc = attempts.filter(a => a.isCorrect).length / attempts.length;

  // Consistency: do lech chuan cua recent accuracy windows
  const consistency = computeConsistency(attempts);

  // Speed: nhanh hon median = tot hon (cap 0-1)
  const speed = computeSpeedScore(recent);

  return (
    recentAcc * MASTERY_WEIGHTS.recentAccuracy +
    overallAcc * MASTERY_WEIGHTS.overallAccuracy +
    consistency * MASTERY_WEIGHTS.consistency +
    speed * MASTERY_WEIGHTS.speed
  );
}

function masteryLevelFromScore(score: number): MasteryLevel {
  if (score >= 0.9) return 'MASTERED';
  if (score >= 0.7) return 'PROFICIENT';
  if (score >= 0.4) return 'DEVELOPING';
  if (score > 0) return 'NOVICE';
  return 'NOT_STARTED';
}
```

## Todo List

- [x] Tao Prisma schema changes (enums + 5 models moi)
- [ ] Run migration
- [x] Tao module `src/modules/adaptive/`
- [x] Implement `skill-taxonomy-service.ts`
- [x] Implement `child-skill-state-service.ts` voi mastery calculation
- [x] Implement `skill-attempt-service.ts`
- [x] Tao seed script cho Math taxonomy (~20 skills)
- [x] Tao seed script cho Phonics taxonomy (~15 skills)
- [x] Tao Admin API endpoints (CRUD skills)
- [x] Tao API tag lessons voi skills
- [x] Update Activity model (difficulty, skillId)
- [ ] Viet unit tests
- [x] Feature flag `ADAPTIVE_ENGINE_ENABLED`

## Success Criteria

- Skill taxonomy trong DB voi prerequisites DAG
- API CRUD skills hoat dong
- Mastery calculation dung logic
- Unit tests coverage >= 80%
- Migration khong break existing data

## Risk Assessment

- **Schema size:** Them 5 models + 2 enums. Moderate migration.
- **DAG cycles:** Can validate khong co circular prerequisites
- **Content gap:** Neu chua co du lessons de tag voi skills, engine se hoi han che -> can content sprint song song

<!-- Updated: Validation Session 1 - Semi-auto tagging migration -->

## Migration Script: Semi-Auto Skill Tagging

Tag lessons/activities hien co bang script ban tu dong:
- `prisma/scripts/tag-lessons-with-skills.ts`
- Logic: Match lesson title/description keywords voi skill codes
- Output: JSON report de admin review va confirm truoc khi apply
- Run: `npx tsx prisma/scripts/tag-lessons-with-skills.ts --dry-run`

```typescript
// Output format
{
  "suggestions": [
    { "lessonId": "...", "lessonTitle": "Cong so 1 chu so", "suggestedSkills": ["MATH_ADD_1DIGIT"], "confidence": 0.9 },
    ...
  ],
  "unmatched": ["lessonId1", "lessonId2"]
}
```

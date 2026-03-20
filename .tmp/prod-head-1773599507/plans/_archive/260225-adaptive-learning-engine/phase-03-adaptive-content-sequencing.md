# Phase 3: Adaptive Content Sequencing Engine

## Context

- Depends on: Phase 1 + Phase 2
- Core cua toan bo adaptive system
- Module: `src/modules/adaptive/`

## Overview

- **Priority:** P1
- **Status:** completed
- **Effort:** 3-4 weeks

## Key Insights

- Engine quyet dinh "bai hoc tiep theo" dua tren skill gap va mastery state
- Rule-based: khong can ML cho MVP
- 3 modes: **Learn** (skill moi), **Practice** (cung co), **Review** (spaced repetition)
- Tich hop vao existing `GET /api/lessons/today` endpoint

## Architecture

```
Input:
  - ChildSkillState[] (mastery per skill)
  - SkillPrerequisite[] (DAG)
  - LessonSkill[] (lesson-skill mapping)
  - ReviewQueue[] (spaced repetition schedule)

Engine:
  1. Check ReviewQueue -> co bai can review? -> Tra ve REVIEW lesson
  2. Xac dinh "ready skills" (prerequisites met, mastery < PROFICIENT)
  3. Chon skill co priority cao nhat (lowest mastery + lowest gradeLevel)
  4. Tim lesson chua hoan thanh cho skill do
  5. Tra ve lesson + mode (LEARN/PRACTICE)

Output:
  { lesson, mode, skill, reason }
```

## Schema Changes

```prisma
model ReviewQueue {
  id            String       @id @default(cuid())
  childId       String
  skillId       String
  scheduledAt   DateTime     // khi nao can review
  intervalDays  Int          @default(1)  // SM-2 interval
  easeFactor    Float        @default(2.5)
  repetitions   Int          @default(0)
  completedAt   DateTime?
  createdAt     DateTime     @default(now())

  child         ChildProfile @relation(fields: [childId], references: [id], onDelete: Cascade)
  skill         Skill        @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@index([childId, scheduledAt])
  @@index([childId, completedAt])
  @@unique([childId, skillId, scheduledAt])
}
```

## Next Lesson Algorithm

```typescript
// src/modules/adaptive/content-sequencing-engine.ts

interface NextLessonResult {
  lesson: Lesson;
  mode: 'LEARN' | 'PRACTICE' | 'REVIEW';
  skill: Skill;
  reason: string; // "Review scheduled" | "New skill unlocked" | "Practice weak skill"
}

async function getNextLesson(childId: string, domain: SkillDomain): Promise<NextLessonResult | null> {
  // Step 1: Check review queue
  const dueReview = await getDueReviews(childId, domain);
  if (dueReview) {
    const lesson = await findLessonForSkill(dueReview.skillId, childId);
    if (lesson) {
      return { lesson, mode: 'REVIEW', skill: dueReview.skill, reason: 'Review scheduled' };
    }
  }

  // Step 2: Find ready skills (prerequisites met, not mastered)
  const readySkills = await getReadySkills(childId, domain);

  // Step 3: Priority: lowest mastery + lowest gradeLevel
  const prioritized = readySkills.sort((a, b) => {
    if (a.gradeLevel !== b.gradeLevel) return a.gradeLevel - b.gradeLevel;
    return a.masteryScore - b.masteryScore;
  });

  for (const skillState of prioritized) {
    const lesson = await findUncompletedLessonForSkill(skillState.skillId, childId);
    if (lesson) {
      const mode = skillState.masteryScore < 0.4 ? 'LEARN' : 'PRACTICE';
      return { lesson, mode, skill: skillState.skill, reason: mode === 'LEARN' ? 'New skill' : 'Practice weak skill' };
    }
  }

  return null; // Tat ca da mastered hoac khong co lesson
}

async function getReadySkills(childId: string, domain: SkillDomain) {
  // Lay tat ca skills trong domain
  const allSkills = await prisma.skill.findMany({
    where: { domain },
    include: {
      prerequisites: { include: { prerequisite: true } },
      childStates: { where: { childId } },
    },
  });

  return allSkills.filter(skill => {
    const state = skill.childStates[0];
    // Da mastered -> skip
    if (state?.masteryLevel === 'MASTERED') return false;

    // Check tat ca prerequisites da PROFICIENT hoac MASTERED
    const prereqsMet = skill.prerequisites.every(prereq => {
      const prereqState = allSkills
        .find(s => s.id === prereq.prerequisiteId)
        ?.childStates[0];
      return prereqState?.masteryLevel === 'PROFICIENT'
        || prereqState?.masteryLevel === 'MASTERED';
    });

    // Khong co prereqs -> always ready
    if (skill.prerequisites.length === 0) return true;

    return prereqsMet;
  });
}
```

## Spaced Repetition (SM-2 Simplified)

```typescript
// src/modules/adaptive/spaced-repetition-service.ts

function computeNextReview(params: {
  isCorrect: boolean;
  currentInterval: number;
  easeFactor: number;
  repetitions: number;
}): { intervalDays: number; easeFactor: number; repetitions: number } {
  const { isCorrect, currentInterval, easeFactor, repetitions } = params;

  if (!isCorrect) {
    // Reset
    return { intervalDays: 1, easeFactor: Math.max(1.3, easeFactor - 0.2), repetitions: 0 };
  }

  const newRepetitions = repetitions + 1;
  let newInterval: number;

  if (newRepetitions === 1) newInterval = 1;
  else if (newRepetitions === 2) newInterval = 3;
  else newInterval = Math.round(currentInterval * easeFactor);

  const newEase = easeFactor + 0.1; // Tang ease khi dung

  return {
    intervalDays: Math.min(newInterval, 60), // cap 60 ngay
    easeFactor: Math.min(newEase, 3.0),
    repetitions: newRepetitions,
  };
}
```

## API Endpoints

```
GET /api/adaptive/next-lesson?childId=...&domain=MATH
  Response: {
    lesson: { id, title, ... },
    mode: "LEARN" | "PRACTICE" | "REVIEW",
    skill: { id, code, nameVi },
    reason: "..."
  }

POST /api/adaptive/complete-activity
  Body: { childId, activityId, skillId, isCorrect, responseMs, rawResponse }
  Response: { masteryUpdate: { before, after }, nextReviewAt? }

GET /api/adaptive/review-queue?childId=...
  Response: { dueCount, items: [{ skill, scheduledAt }] }
```

## Integration voi Existing Flow

```typescript
// Update src/app/api/lessons/today/route.ts

// Neu feature flag ADAPTIVE_ENGINE_ENABLED:
//   -> Goi getNextLesson() thay vi logic cu
// Neu khong:
//   -> Giu nguyen logic hien tai (sequential by unit/level)

export async function GET(req: NextRequest) {
  const childId = req.nextUrl.searchParams.get('childId');
  const adaptiveEnabled = await isFeatureEnabled('ADAPTIVE_ENGINE_ENABLED');

  if (adaptiveEnabled) {
    const mathNext = await getNextLesson(childId, 'MATH');
    const phonicsNext = await getNextLesson(childId, 'ENGLISH_PHONICS');
    return NextResponse.json({
      lessons: [mathNext, phonicsNext].filter(Boolean),
      source: 'adaptive',
    });
  }

  // ... existing logic ...
}
```

## Implementation Steps

1. **ReviewQueue model** - Prisma migration
2. **Core engine files:**
   - `src/modules/adaptive/content-sequencing-engine.ts` - Main algorithm
   - `src/modules/adaptive/spaced-repetition-service.ts` - SM-2
   - `src/modules/adaptive/activity-completion-handler.ts` - Process activity results
3. **API routes** (3 endpoints)
4. **Integration** voi `/api/lessons/today` (feature-flagged)
5. **Update completion flow** - Khi complete activity, ghi SkillAttempt + update ChildSkillState + schedule ReviewQueue
6. **Admin seeding tool** - Populate LessonSkill mappings

## Todo List

- [x] ReviewQueue Prisma model + migration
- [x] `content-sequencing-engine.ts` - next lesson algorithm
- [x] `spaced-repetition-service.ts` - SM-2
- [x] `activity-completion-handler.ts` - process results
- [x] API: `GET /api/adaptive/next-lesson`
- [x] API: `POST /api/adaptive/complete-activity`
- [x] API: `GET /api/adaptive/review-queue`
- [x] Feature flag integration `ADAPTIVE_ENGINE_ENABLED`
- [x] Update `/api/lessons/today` voi adaptive mode
- [x] Update `completeLesson` de ghi SkillAttempt
- [x] Unit tests (engine logic, SM-2, ready-skills filter)
- [x] Integration test (full flow: placement -> learn -> review)

## Success Criteria

- Engine chon dung skill tiep theo (prerequisites met, lowest mastery)
- Spaced repetition schedule dung SM-2
- Feature flag toggle khong break existing flow
- Response time < 200ms cho next-lesson query

## Risk Assessment

- **Cold start:** Tre chua lam placement test -> fallback ve sequential order hien tai
- **Lesson shortage:** Neu 1 skill chi co 1 lesson va da complete -> engine can gracefully skip
- **Performance:** DAG traversal co the cham neu skill taxonomy lon -> cache ready-skills per child (Redis, TTL 5m)

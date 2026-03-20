# Phase 2: Placement Test System

## Context

- Depends on: Phase 1 (Skill Taxonomy)
- Module: `src/modules/adaptive/`
- Target: 10-15 cau/track, adaptive difficulty

## Overview

- **Priority:** P1
- **Status:** completed
- **Effort:** 2-3 weeks

## Key Insights

- Placement test xac dinh starting level cua tre cho tung domain (Math/Phonics)
- Su dung Computer Adaptive Testing (CAT) don gian: bat dau medium, tang/giam difficulty theo cau tra loi
- Ket qua ghi vao `ChildSkillState` cho moi skill duoc test
- Moi tre chi can lam 1 lan/domain; co the redo sau 30 ngay

## Schema Changes

```prisma
model PlacementTest {
  id          String     @id @default(cuid())
  domain      SkillDomain
  title       String
  description String?
  isActive    Boolean    @default(true)
  minItems    Int        @default(10)
  maxItems    Int        @default(15)
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  items       PlacementTestItem[]
  attempts    PlacementTestAttempt[]

  @@unique([domain, isActive])
}

model PlacementTestItem {
  id            String          @id @default(cuid())
  testId        String
  skillId       String
  difficulty    DifficultyLevel
  activityType  String          // ActivityType
  activitySpec  Json            // ActivitySpec
  orderHint     Int             @default(0)  // goi y thu tu
  createdAt     DateTime        @default(now())

  test          PlacementTest   @relation(fields: [testId], references: [id], onDelete: Cascade)
  skill         Skill           @relation(fields: [skillId], references: [id], onDelete: Cascade)
  responses     PlacementTestResponse[]

  @@index([testId, difficulty])
  @@index([skillId])
}

model PlacementTestAttempt {
  id            String        @id @default(cuid())
  childId       String
  testId        String
  startedAt     DateTime      @default(now())
  completedAt   DateTime?
  totalItems    Int           @default(0)
  correctItems  Int           @default(0)
  resultSummary Json?         // { skillLevels: { skillId: masteryLevel }[] }
  createdAt     DateTime      @default(now())

  child         ChildProfile  @relation(fields: [childId], references: [id], onDelete: Cascade)
  test          PlacementTest @relation(fields: [testId], references: [id], onDelete: Cascade)
  responses     PlacementTestResponse[]

  @@index([childId, testId])
}

model PlacementTestResponse {
  id          String                @id @default(cuid())
  attemptId   String
  itemId      String
  isCorrect   Boolean
  responseMs  Int?
  rawResponse Json?
  answeredAt  DateTime              @default(now())

  attempt     PlacementTestAttempt  @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  item        PlacementTestItem     @relation(fields: [itemId], references: [id], onDelete: Cascade)

  @@index([attemptId])
}

// Update ChildProfile
model ChildProfile {
  // ... existing ...
  placementAttempts PlacementTestAttempt[]
}
```

## CAT Algorithm (Simple)

```typescript
// src/modules/adaptive/placement-test-engine.ts

interface CATState {
  currentDifficulty: DifficultyLevel;
  answeredItemIds: string[];
  skillResults: Map<string, { correct: number; total: number }>;
  consecutiveCorrect: number;
  consecutiveWrong: number;
}

function selectNextItem(
  state: CATState,
  availableItems: PlacementTestItem[]
): PlacementTestItem | null {
  // Filter: chua tra loi + match difficulty hien tai
  const candidates = availableItems.filter(
    item => !state.answeredItemIds.includes(item.id)
      && item.difficulty === state.currentDifficulty
  );

  if (candidates.length === 0) {
    // Fallback: lay bat ky cau chua tra loi
    const fallback = availableItems.filter(
      item => !state.answeredItemIds.includes(item.id)
    );
    return fallback[0] ?? null;
  }

  // Uu tien skill chua test
  const untestedSkills = candidates.filter(item => {
    const results = state.skillResults.get(item.skillId);
    return !results || results.total === 0;
  });

  return untestedSkills[0] ?? candidates[0];
}

function updateDifficulty(state: CATState, isCorrect: boolean): void {
  if (isCorrect) {
    state.consecutiveCorrect++;
    state.consecutiveWrong = 0;
    if (state.consecutiveCorrect >= 2 && state.currentDifficulty !== 'HARD') {
      state.currentDifficulty = state.currentDifficulty === 'EASY' ? 'MEDIUM' : 'HARD';
      state.consecutiveCorrect = 0;
    }
  } else {
    state.consecutiveWrong++;
    state.consecutiveCorrect = 0;
    if (state.consecutiveWrong >= 2 && state.currentDifficulty !== 'EASY') {
      state.currentDifficulty = state.currentDifficulty === 'HARD' ? 'MEDIUM' : 'EASY';
      state.consecutiveWrong = 0;
    }
  }
}
```

## API Endpoints

```
POST /api/adaptive/placement/start
  Body: { childId, domain: "MATH" | "ENGLISH_PHONICS" }
  Response: { attemptId, firstItem: { id, activityType, activitySpec } }

POST /api/adaptive/placement/:attemptId/answer
  Body: { itemId, response: any }
  Response: { isCorrect, nextItem: {...} | null, isComplete: boolean }

GET /api/adaptive/placement/:attemptId/result
  Response: { skillLevels: [{ skill, masteryLevel, score }], recommendations }

GET /api/children/:childId/placement-status
  Response: { math: { completed, attemptId?, date? }, phonics: { ... } }
```

## Implementation Steps

1. **Prisma schema** - Them 4 models (PlacementTest, Item, Attempt, Response)
2. **Module files:**
   - `src/modules/adaptive/placement-test-engine.ts` - CAT algorithm
   - `src/modules/adaptive/placement-test-service.ts` - Business logic (start, answer, complete)
   - `src/modules/adaptive/placement-test-scorer.ts` - Tinh skill levels tu responses
3. **API routes:**
   - `src/app/api/adaptive/placement/start/route.ts`
   - `src/app/api/adaptive/placement/[attemptId]/answer/route.ts`
   - `src/app/api/adaptive/placement/[attemptId]/result/route.ts`
4. **Seed placement test items** - It nhat 30 items/domain (10 easy, 10 medium, 10 hard)
5. **UI component** (co ban):
   - `src/components/placement-test/placement-test-flow.tsx` - Multi-step test UI
   - Reuse existing activity components (MULTIPLE_CHOICE, etc.)
6. **Integration voi ChildProfile** - Sau khi complete, update `placementResult` JSON field + `ChildSkillState`

## Scorer Logic

```typescript
// src/modules/adaptive/placement-test-scorer.ts

function scoreAttempt(
  responses: PlacementTestResponse[],
  items: PlacementTestItem[]
): Map<string, { score: number; level: MasteryLevel }> {
  const skillMap = new Map<string, { correct: number; total: number }>();

  for (const resp of responses) {
    const item = items.find(i => i.id === resp.itemId);
    if (!item) continue;

    const prev = skillMap.get(item.skillId) ?? { correct: 0, total: 0 };
    prev.total++;
    if (resp.isCorrect) prev.correct++;

    // Weight by difficulty: HARD correct = 1.5x, EASY correct = 0.7x
    // (simplified weighting)
    skillMap.set(item.skillId, prev);
  }

  const result = new Map();
  for (const [skillId, { correct, total }] of skillMap) {
    const rawScore = total > 0 ? correct / total : 0;
    result.set(skillId, {
      score: rawScore,
      level: masteryLevelFromScore(rawScore),
    });
  }

  return result;
}
```

## Todo List

- [ ] Prisma schema: 4 models moi
- [ ] Migration
- [ ] CAT algorithm (`placement-test-engine.ts`)
- [ ] Placement service (`placement-test-service.ts`)
- [ ] Scorer (`placement-test-scorer.ts`)
- [ ] API routes (3 endpoints)
- [ ] Seed placement items (Math: 30+, Phonics: 30+)
- [ ] Basic UI flow component
- [ ] Update ChildProfile.placementResult + ChildSkillState on complete
- [ ] Rate limit: 1 attempt/domain/30 days
- [ ] Unit tests
- [ ] E2E test: full placement flow

## Success Criteria

- Tre lam test 10-15 cau, ket qua phan loai chinh xac
- CAT tang/giam do kho dung logic
- Ket qua ghi vao ChildSkillState
- API idempotent (khong cho lam lai trong 30 ngay)
- Responsive UI cho mobile

## Risk Assessment

- **Content quality:** Cau hoi placement phai chuan SGK VN; can review boi giao vien
- **Cheating:** Tre co the random click -> can minimum time per question (2s)
- **Edge case:** Tre chua biet doc -> Phonics test can audio-first questions

<!-- Updated: Validation Session 1 - Audio + Trigger decisions -->

## Audio Strategy (Phonics)

Dung Google TTS API (GOOGLE_API_KEY san co) de pre-gen audio:
- Gen audio khi seed/create PlacementTestItem cho Phonics
- Luu file vao `/public/audio/placement/` hoac storage (phu thuoc infra)
- Khong goi TTS realtime de tranh latency va cost

```typescript
// src/modules/adaptive/audio-gen-service.ts
async function generatePlacementAudio(text: string, itemId: string): Promise<string> {
  // Goi Google Text-to-Speech API
  // Luu file, tra ve URL
}
```

## Onboarding Trigger

Placement test duoc trigger TU DONG khi phu huynh tao child profile moi:
- Sau khi complete ChildProfile creation form -> redirect den placement test
- Hien thi cho tung domain (Math truoc, Phonics sau)
- Cho phep skip (neu phu huynh muon) -> fallback ve sequential flow

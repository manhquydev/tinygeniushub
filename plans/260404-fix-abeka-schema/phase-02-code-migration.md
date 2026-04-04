# Phase 2: Code Migration

**Phase ID:** phase-02-code-migration  
**Priority:** P1 - CRITICAL  
**Estimated Time:** 1.5 hours  
**Dependencies:** Phase 1 Complete

---

## Overview

This phase updates all code references from the old `abekaProgress` model to the new `abekaWatchProgress` model and fixes any field name mismatches.

---

## Steps

### Step 2.1: Search for All References (10 min)

**Command:**
```bash
grep -r "abekaProgress" --include="*.ts" --include="*.tsx" app/ src/ lib/
```

**Expected results:**
```
app/api/abeka/progress/watch/route.ts:prisma.abekaProgress.findMany
app/api/curriculum/complete/route.ts:prisma.abekaWatchProgress.upsert
app/api/curriculum/badges/check/route.ts:prisma.abekaWatchProgress.aggregate
```

---

### Step 2.2: Update app/api/abeka/progress/watch/route.ts (20 min)

**File:** `app/api/abeka/progress/watch/route.ts`

**Current Code (line ~30):**
```typescript
const progress = await prisma.abekaProgress.findMany({
  where,
  include: {
    video: {
      select: {
        id: true,
        videoId: true,
        title: true,
        thumbnailUrl: true,
        durationMinutes: true,
        lessonNumber: true,
        gradeLevel: true,
      },
    },
  },
  orderBy: { lastWatchedAt: 'desc' },
});
```

**Updated Code:**
```typescript
const progress = await prisma.abekaWatchProgress.findMany({
  where,
  include: {
    video: {
      select: {
        id: true,
        videoId: true,
        title: true,
        thumbnailUrl: true,
        durationMinutes: true,
        lessonNumber: true,
        gradeLevel: true,
      },
    },
  },
  orderBy: { lastWatchedAt: 'desc' },
});
```

**Also in POST handler (line ~70):**

**Current:**
```typescript
const existingProgress = await prisma.abekaProgress.findUnique({
  where: {
    childId_videoId: { childId: data.childId, videoId: data.videoId },
  },
});
```

**Updated:**
```typescript
const existingProgress = await prisma.abekaWatchProgress.findUnique({
  where: {
    childId_videoId: { childId: data.childId, videoId: data.videoId },
  },
});
```

**Current:**
```typescript
const progress = await prisma.abekaProgress.update({
  where: {
    childId_videoId: { childId: data.childId, videoId: data.videoId },
  },
  data: {
    watchedMinutes: data.watchedMinutes,
    lastPositionSeconds: data.lastPositionSeconds ?? existingProgress.lastPositionSeconds,
    isCompleted: isCompleted || existingProgress.isCompleted,
    completedAt: isCompleted && !existingProgress.isCompleted ? now : existingProgress.completedAt,
    lastWatchedAt: now,
    watchCount: { increment: 1 },
  },
});
```

**Updated:**
```typescript
const progress = await prisma.abekaWatchProgress.update({
  where: {
    childId_videoId: { childId: data.childId, videoId: data.videoId },
  },
  data: {
    watchSeconds: data.watchedMinutes * 60, // Convert minutes to seconds
    lastPosition: data.lastPositionSeconds ?? existingProgress.lastPosition,
    isCompleted: isCompleted || existingProgress.isCompleted,
    completedAt: isCompleted && !existingProgress.isCompleted ? now : existingProgress.completedAt,
    lastWatchedAt: now,
  },
});
```

**Current:**
```typescript
const progress = await prisma.abekaProgress.create({
  data: {
    childId: data.childId,
    videoId: data.videoId,
    gradeId: String(video.gradeLevel),
    lessonId: String(video.lessonNumber),
    subjectCode: video.subjectCode,
    watchedMinutes: data.watchedMinutes,
    lastPositionSeconds: data.lastPositionSeconds ?? 0,
    isCompleted,
    completedAt: isCompleted ? now : null,
    lastWatchedAt: now,
    watchCount: 1,
  },
});
```

**Updated:**
```typescript
const progress = await prisma.abekaWatchProgress.create({
  data: {
    childId: data.childId,
    videoId: data.videoId,
    watchSeconds: data.watchedMinutes * 60, // Convert minutes to seconds
    durationSeconds: video.durationMinutes ? video.durationMinutes * 60 : null,
    lastPosition: data.lastPositionSeconds ?? 0,
    isCompleted,
    completedAt: isCompleted ? now : null,
    lastWatchedAt: now,
  },
});
```

---

### Step 2.3: Update app/api/curriculum/complete/route.ts (30 min)

**File:** `app/api/curriculum/complete/route.ts`

**Verify existing code (line ~82):**
```typescript
await prisma.abekaWatchProgress.upsert({
  where: {
    childId_videoId: { childId: data.childId, videoId: data.videoId },
  },
  create: {
    childId: data.childId,
    videoId: data.videoId,
    watchPercent: 100,
    watchSeconds: data.minutesLearned * 60,
    isCompleted: true,
    completedAt: new Date(),
    lastWatchedAt: new Date(),
  },
  update: {
    watchPercent: 100,
    isCompleted: true,
    completedAt: new Date(),
    lastWatchedAt: new Date(),
  },
});
```

**This should already work** - just verify the field names match the schema.

**Verify streak queries (line ~130+):**
```typescript
const streak = await prisma.abekaStreak.upsert({
  where: { childId },
  create: {
    childId,
    currentStreak: 1,
    longestStreak: 1,
    lastActivityDate: today,
    freezeCount: 0,
  },
  update: {},
});
```

**Verify badge queries (line ~180+):**
```typescript
const totalTimeResult = await prisma.abekaWatchProgress.aggregate({
  where: { childId },
  _sum: { watchSeconds: true },
});
```

**Verify streak history creation (line ~220+):**
```typescript
await prisma.abekaStreakHistory.create({
  data: {
    streakId: streak.id,
    date: today,
    streakCount: newStreak,
    activityMinutes: 0,
    lessonsCompleted: 1,
    streakMaintained: true,
    freezeUsed: usedFreeze,
  },
});
```

**Note:** Check if `activityMinutes` should be `data.minutesLearned` instead of `0`.

---

### Step 2.4: Update app/api/curriculum/badges/check/route.ts (20 min)

**File:** `app/api/curriculum/badges/check/route.ts`

**Verify existing code:**

The file already uses `prisma.abekaWatchProgress` and `prisma.abekaStreak`, `prisma.abekaBadge`, `prisma.childEarnedBadge`, etc. Just verify field names match.

**Check field names:**
- `prisma.abekaWeeklyPlan.findMany` - should work
- `prisma.abekaDailyPlan.findMany` - should work  
- `prisma.abekaAssignment.count` - should work
- `prisma.abekaStreak.findUnique` - should work
- `prisma.abekaWatchProgress.aggregate` - should work
- `prisma.abekaBadge.findMany` - should work
- `prisma.childEarnedBadge.create` - should work

---

### Step 2.5: Update app/api/curriculum/badges/[badgeId]/view/route.ts (10 min)

**File:** `app/api/curriculum/badges/[badgeId]/view/route.ts`

**Verify existing code:**
```typescript
const earnedBadge = await prisma.childEarnedBadge.findUnique({
  where: { id: badgeId },
  include: {
    badge: {
      select: {
        id: true,
        nameVi: true,
        iconUrl: true,
      },
    },
  },
});
```

**Verify update:**
```typescript
const updated = await prisma.childEarnedBadge.update({
  where: { id: badgeId },
  data: {
    viewedAt: new Date(),
  },
  include: {
    badge: {
      select: {
        id: true,
        nameVi: true,
        iconUrl: true,
      },
    },
  },
});
```

---

### Step 2.6: Update prisma/seeders/abeka-curriculum.ts (15 min)

**File:** `prisma/seeders/abeka-curriculum.ts`

**Verify reset section:**
```typescript
await prisma.abekaWatchProgress.deleteMany({});
await prisma.childEarnedBadge.deleteMany({});
await prisma.childSkillProgress.deleteMany({});
await prisma.abekaSkillPrerequisite.deleteMany({});
await prisma.abekaSkillNode.deleteMany({});
await prisma.abekaStreakHistory.deleteMany({});
await prisma.abekaStreak.deleteMany({});
await prisma.childGradeProgress.deleteMany({});
await prisma.abekaAssignment.deleteMany({});
await prisma.abekaDailyPlan.deleteMany({});
await prisma.abekaWeeklyPlan.deleteMany({});
await prisma.abekaLearningJourney.deleteMany({});
await prisma.abekaParentPreferences.deleteMany({});
await prisma.abekaBadge.deleteMany({});
```

**Verify seedSkillTrees:**
```typescript
await prisma.abekaSkillNode.upsert({
  where: {
    id: `${grade.id}-${subject.code}-root`,
  },
  create: {
    id: `${grade.id}-${subject.code}-root`,
    gradeId: grade.id,
    subjectCode: subject.code,
    name: `${subject.name} Fundamentals`,
    nameVi: `${subject.nameVi} Cơ Bản`,
    requiredLessons: [1, 2, 3, 4, 5],
  },
  update: {},
});
```

**Note:** May need to add `status: 'PUBLISHED'` or other required fields.

---

### Step 2.7: Search for Additional References (10 min)

**Command:**
```bash
grep -r "AbekaProgress" --include="*.ts" --include="*.tsx" app/ src/ lib/ prisma/
```

**Check for:**
- Type imports
- Interface definitions
- Test files
- Any missed references

---

### Step 2.8: Fix Any Additional References (15 min)

For each file found:
1. Open file
2. Replace `AbekaProgress` with `AbekaWatchProgress` or `abekaProgress` with `abekaWatchProgress`
3. Update field references if needed
4. Save

---

## Deliverables

1. ✅ All references to `abekaProgress` updated to `abekaWatchProgress`
2. ✅ Field names aligned with new schema (e.g., `watchedMinutes` → `watchSeconds`)
3. ✅ All affected files compile without errors
4. ✅ No references to old model names remain

---

## Verification Checklist

- [ ] `app/api/abeka/progress/watch/route.ts` updated
- [ ] `app/api/curriculum/complete/route.ts` field names verified
- [ ] `app/api/curriculum/badges/check/route.ts` field names verified
- [ ] `app/api/curriculum/badges/[badgeId]/view/route.ts` verified
- [ ] `prisma/seeders/abeka-curriculum.ts` model references verified
- [ ] No `abekaProgress` references remain (except in backup)
- [ ] No `AbekaProgress` type references remain

---

## Common Field Mapping

| Old Field | New Field | Conversion |
|-----------|-----------|------------|
| `watchedMinutes` | `watchSeconds` | Multiply by 60 |
| `lastPositionSeconds` | `lastPosition` | Direct rename |
| `watchCount` | - | Removed |
| `gradeId` | - | Removed |
| `lessonId` | - | Removed |
| `subjectCode` | - | Removed |
| - | `watchPercent` | New field |
| - | `durationSeconds` | New field |

---

## Notes

1. **Minutes to seconds:** When converting `watchedMinutes` to `watchSeconds`, multiply by 60
2. **Removed fields:** Don't try to populate removed fields (`gradeId`, `lessonId`, `subjectCode`)
3. **New fields:** Use appropriate defaults for new fields
4. **Duration:** Calculate `durationSeconds` from `video.durationMinutes * 60` when available

---

**Phase 2 Complete → Proceed to Phase 3: Prisma Generate & Type Check**

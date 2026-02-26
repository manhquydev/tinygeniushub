# Phase 4: Skill Progress Map (UI Phu Huynh)

## Context

- Depends on: Phase 1 + Phase 3
- UI hien thi cho phu huynh/giao vien thay tien trinh cua tre
- Existing UI: Next.js pages, React 19

## Overview

- **Priority:** P2
- **Status:** completed
- **Effort:** 2-3 weeks

## Key Insights

- Phu huynh VN can "thay duoc" con dang o dau tren hanh trinh hoc
- Visual skill tree/map >> bang so lieu
- Mobile-first (70%+ traffic tu dien thoai)
- **[Validation Session 1]** Can them UI toggle "Hoc thich nghi" per-child trong settings phu huynh

<!-- Updated: Validation Session 1 - Per-child adaptive toggle -->

## Adaptive Opt-in Toggle

Them toggle "Bật học thích nghi" trong child settings page:
- `src/app/(parent)/children/[childId]/settings/page.tsx`
- Luu vao `ChildProfile.adaptiveEnabled: Boolean @default(false)`
- Khi bat: engine su dung adaptive flow; khi tat: giu nguyen sequential flow hien tai
- UI: Switch component voi mo ta ngan gon cho phu huynh hieu

## UI Components

### 1. Skill Map Overview (`/dashboard/[childId]/skills`)

```
+------------------------------------------+
|  Toan Tu Duy - Lop 1                     |
|                                          |
|  [===] Dem so           ★★★★☆ 85%       |
|  [===] Phep cong        ★★★☆☆ 62%       |
|  [== ] Phep tru         ★★☆☆☆ 41%       |
|  [   ] Hinh hoc         🔒 Locked        |
|  [   ] Do luong         🔒 Locked        |
|                                          |
|  Tieng Anh Phonics                       |
|                                          |
|  [===] Alphabet         ★★★★★ 95%       |
|  [===] CVC Words        ★★★☆☆ 68%       |
|  [=  ] Blends           ★☆☆☆☆ 22%       |
+------------------------------------------+
```

### 2. Skill Detail View (`/dashboard/[childId]/skills/[skillId]`)

```
+------------------------------------------+
|  Phep cong 1 chu so                      |
|  Mastery: 62% (Developing)              |
|                                          |
|  [Progress ring chart]                   |
|                                          |
|  Recent activity:                        |
|  - 2/25: 4/5 correct (80%)             |
|  - 2/24: 3/5 correct (60%)             |
|  - 2/23: 2/5 correct (40%)  ↑ trending |
|                                          |
|  Next review: Tomorrow                   |
|  Related lessons: 3 completed, 2 left   |
|                                          |
|  [Luyen tap ngay]                        |
+------------------------------------------+
```

### 3. Weekly Insight Card (Dashboard homepage)

```
+------------------------------------------+
|  Tuan nay cua [Ten be]                   |
|                                          |
|  ✅ 2 ky nang moi dat Proficient         |
|  📈 Phep cong tang 15% (47% → 62%)      |
|  🔄 3 bai review da hoan thanh           |
|  ⏰ Ngay mai can review: Dem so          |
+------------------------------------------+
```

## API Endpoints

```
GET /api/children/:childId/skill-map?domain=MATH
  Response: {
    domain: "MATH",
    totalSkills: 20,
    masteredCount: 5,
    overallProgress: 0.42,
    skills: [{
      id, code, nameVi, gradeLevel, orderNo,
      masteryScore, masteryLevel,
      isLocked, // prerequisites not met
      childState: { totalAttempts, lastAttemptAt }
    }]
  }

GET /api/children/:childId/skill-detail/:skillId
  Response: {
    skill: { id, code, nameVi, ... },
    mastery: { score, level, totalAttempts, correctAttempts },
    recentAttempts: [{ date, correct, total }],  // grouped by day
    relatedLessons: [{ id, title, completed }],
    nextReview: DateTime?,
    prerequisites: [{ skill, masteryLevel }],
    trend: "IMPROVING" | "STABLE" | "DECLINING"
  }

GET /api/children/:childId/skill-weekly-summary
  Response: {
    newProficient: [{ skillId, nameVi }],
    biggestImprovement: { skillId, nameVi, delta },
    reviewsCompleted: number,
    upcomingReviews: [{ skillId, nameVi, scheduledAt }]
  }
```

## File Structure

```
src/app/(app)/dashboard/[childId]/skills/
  page.tsx                    // Skill map overview
  [skillId]/page.tsx          // Skill detail

src/components/skills/
  skill-map-grid.tsx          // Grid view of skills with progress bars
  skill-progress-ring.tsx     // Circular progress indicator
  skill-detail-card.tsx       // Detail view component
  skill-weekly-insight.tsx    // Weekly summary card
  mastery-badge.tsx           // Badge component per mastery level
```

## Implementation Steps

1. **API routes** (3 endpoints)
2. **Service layer:**
   - `src/modules/adaptive/skill-map-service.ts` - Aggregate data cho UI
3. **UI components** (5 components)
4. **Pages** (2 pages)
5. **Integration** voi existing dashboard layout
6. **Mobile responsive** - Cards stack vertically on mobile

## Todo List

- [x] `skill-map-service.ts` - Aggregate skill states + locked status
- [x] API: `GET /api/children/:childId/skill-map`
- [x] API: `GET /api/children/:childId/skill-detail/:skillId`
- [x] API: `GET /api/children/:childId/skill-weekly-summary`
- [x] UI: `skill-map-grid.tsx`
- [x] UI: `skill-progress-ring.tsx`
- [x] UI: `skill-detail-card.tsx`
- [x] UI: `skill-weekly-insight.tsx`
- [x] UI: `mastery-badge.tsx`
- [x] UI: `adaptive-learning-toggle.tsx`
- [x] Page: `/parent/dashboard/[childId]/skills`
- [x] Page: `/parent/dashboard/[childId]/skills/[skillId]`
- [x] Responsive design (mobile-first)
- [x] Loading states + error boundaries

## Success Criteria

- Phu huynh thay duoc skill map trong < 2s
- Locked skills hien thi ro rang voi prerequisites
- Trend indicator (improving/declining) chinh xac
- Mobile responsive (khong bi cut text, scroll ngang)

## Risk Assessment

- **Empty state:** Tre chua lam gi -> can empty state UI tot ("Bat dau lam bai kiem tra de xem ban do ky nang!")
- **Too many skills:** Neu 30+ skills -> can grouping/collapsing by category

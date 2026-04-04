# File Ownership Matrix

## Abeka Curriculum Organization System

This document maps files to phases and responsible roles for the Abeka Curriculum implementation.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **P1** | Phase 1: Foundation (Database & API) |
| **P2** | Phase 2: Parent Interface (Desktop) |
| **P3** | Phase 3: Student Interface (Tablet) |
| **P4** | Phase 4: Integration & Polish |
| **BE** | Backend Developer |
| **FE** | Frontend Developer |
| **FS** | Full-Stack Developer |
| **DB** | Database Architect |
| **QA** | QA Engineer |

---

## Database Layer

| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `prisma/schema.prisma` | P1 | DB | Add 27 Abeka models to existing schema |
| `prisma/migrations/2026xxxx_abeka_curriculum_system/migration.sql` | P1 | DB | Migration file (auto-generated) |
| `prisma/seeders/abeka-curriculum.ts` | P1 | BE | Seeder for all 14 grades |
| `prisma/seeders/skill-trees.ts` | P1 | BE | Seed skill tree structures |
| `prisma/seeders/badges.ts` | P1 | BE | Seed gamification badges |

---

## Backend Services

| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `src/lib/abeka/import/types.ts` | P1 | BE | Import pipeline type definitions |
| `src/lib/abeka/import/parser.ts` | P1 | BE | Video ID parsing logic |
| `src/lib/abeka/import/service.ts` | P1 | BE | Main import service |
| `src/lib/abeka/import/validator.ts` | P1 | BE | Data validation |
| `src/lib/abeka/progress/calculator.ts` | P4 | BE | Progress calculation engine |
| `src/lib/abeka/gamification/badges.ts` | P4 | BE | Badge award logic |
| `src/lib/abeka/gamification/streak.ts` | P4 | BE | Streak management |
| `src/lib/abeka/gamification/rewards.ts` | P4 | BE | Reward distribution |

---

## API Routes

### Curriculum API
| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `app/api/abeka/curriculum/grades/route.ts` | P1 | BE | List all grades |
| `app/api/abeka/curriculum/grades/[id]/route.ts` | P1 | BE | Grade details |
| `app/api/abeka/curriculum/lessons/route.ts` | P1 | BE | List lessons |
| `app/api/abeka/curriculum/lessons/[id]/route.ts` | P1 | BE | Lesson details |
| `app/api/abeka/curriculum/subjects/route.ts` | P1 | BE | Subject listing |

### Planning API
| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `app/api/abeka/plans/journeys/route.ts` | P1 | BE | CRUD learning journeys |
| `app/api/abeka/plans/journeys/[id]/route.ts` | P1 | BE | Journey management |
| `app/api/abeka/plans/weekly/route.ts` | P1 | BE | Weekly plans CRUD |
| `app/api/abeka/plans/weekly/[id]/route.ts` | P1 | BE | Weekly plan updates |
| `app/api/abeka/plans/daily/route.ts` | P1 | BE | Daily plans |
| `app/api/abeka/plans/assignments/route.ts` | P1 | BE | Assignment CRUD |
| `app/api/abeka/plans/assignments/[id]/complete/route.ts` | P1 | BE | Complete assignment |

### Progress API
| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `app/api/abeka/progress/watch/route.ts` | P1 | BE | Video watch progress |
| `app/api/abeka/progress/grade/route.ts` | P1 | BE | Grade-level progress |
| `app/api/abeka/progress/streak/route.ts` | P1 | BE | Streak data |
| `app/api/abeka/progress/subjects/route.ts` | P1 | BE | Subject progress |

### Skill Tree API
| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `app/api/abeka/skill-tree/nodes/route.ts` | P1 | BE | Skill tree structure |
| `app/api/abeka/skill-tree/progress/route.ts` | P1 | BE | Child skill progress |

### Gamification API
| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `app/api/abeka/gamification/badges/route.ts` | P4 | BE | Available badges |
| `app/api/abeka/gamification/badges/check/route.ts` | P4 | BE | Check for new badges |
| `app/api/abeka/gamification/earned/route.ts` | P4 | BE | Earned badges |

---

## Frontend Components - Shared

### Design System
| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `src/components/abeka/design/tokens.ts` | P2 | FE | Color tokens, spacing |
| `src/components/abeka/design/SubjectIcon.tsx` | P2 | FE | Subject icons mapping |
| `src/components/abeka/design/GradeBadge.tsx` | P2 | FE | Grade level badge |

### Shared Components
| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `src/components/abeka/shared/VideoThumbnail.tsx` | P2 | FE | Video thumbnail with play overlay |
| `src/components/abeka/shared/ProgressBar.tsx` | P2 | FE | Animated progress bar |
| `src/components/abeka/shared/LoadingSkeleton.tsx` | P2 | FE | Skeleton loaders |
| `src/components/abeka/shared/ErrorBoundary.tsx` | P2 | FE | Error handling |

---

## Frontend Components - Parent Interface (P2)

### Curriculum Browser
| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `src/app/(dashboard)/abeka/curriculum/page.tsx` | P2 | FE | Main curriculum page |
| `src/components/abeka/curriculum/LessonBrowser.tsx` | P2 | FE | Lesson grid + filters |
| `src/components/abeka/curriculum/LessonCard.tsx` | P2 | FE | Individual lesson card |
| `src/components/abeka/curriculum/LessonFilters.tsx` | P2 | FE | Filter controls |
| `src/components/abeka/curriculum/LessonDetailModal.tsx` | P2 | FE | Lesson detail popup |
| `src/components/abeka/curriculum/GradeList.tsx` | P2 | FE | Grade sidebar selector |
| `src/components/abeka/curriculum/SubjectGrid.tsx` | P2 | FE | Subject breakdown view |

### Weekly Planner
| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `src/app/(dashboard)/abeka/planner/page.tsx` | P2 | FE | Planner main page |
| `src/components/abeka/planner/WeeklyPlanner.tsx` | P2 | FE | Main planner component |
| `src/components/abeka/planner/LessonPool.tsx` | P2 | FE | Available lessons pool |
| `src/components/abeka/planner/DayColumn.tsx` | P2 | FE | Individual day column |
| `src/components/abeka/planner/WeekHeader.tsx` | P2 | FE | Week navigation |
| `src/components/abeka/planner/WeekSummary.tsx` | P2 | FE | Week stats summary |
| `src/components/abeka/planner/QuickAssignModal.tsx` | P2 | FE | Quick assignment modal |
| `src/components/abeka/planner/AutoGenerateDialog.tsx` | P2 | FE | Auto-plan dialog |

### Progress Dashboard
| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `src/app/(dashboard)/abeka/progress/page.tsx` | P2 | FE | Progress main page |
| `src/components/abeka/progress/ProgressDashboard.tsx` | P2 | FE | Main dashboard |
| `src/components/abeka/progress/StatsCards.tsx` | P2 | FE | Stat cards grid |
| `src/components/abeka/progress/ProgressChart.tsx` | P2 | FE | Weekly progress chart |
| `src/components/abeka/progress/SubjectProgress.tsx` | P2 | FE | Subject breakdown |
| `src/components/abeka/progress/ActivityHistory.tsx` | P2 | FE | Recent activity list |
| `src/components/abeka/progress/ChildSelector.tsx` | P2 | FE | Child switcher |

---

## Frontend Components - Student Interface (P3)

### Skill Tree
| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `src/app/(student)/abeka/skill-tree/page.tsx` | P3 | FE | Skill tree main page |
| `src/components/abeka/student/SkillTreeMap.tsx` | P3 | FE | Interactive skill tree |
| `src/components/abeka/student/SkillNode.tsx` | P3 | FE | Individual skill node |
| `src/components/abeka/student/SkillConnection.tsx` | P3 | FE | Connection lines |
| `src/components/abeka/student/NodeDetailModal.tsx` | P3 | FE | Node popup modal |
| `src/components/abeka/student/ZoomControls.tsx` | P3 | FE | Zoom/pan controls |

### Daily Plan
| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `src/app/(student)/abeka/today/page.tsx` | P3 | FE | Today's plan page |
| `src/components/abeka/student/DailyPlan.tsx` | P3 | FE | Daily assignments list |
| `src/components/abeka/student/AssignmentCard.tsx` | P3 | FE | Individual assignment |
| `src/components/abeka/student/StreakBadge.tsx` | P3 | FE | Streak indicator |
| `src/components/abeka/student/RewardPreview.tsx` | P3 | FE | Daily reward teaser |

### Gamification
| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `src/components/abeka/student/StreakDisplay.tsx` | P3 | FE | Streak widget |
| `src/components/abeka/student/BadgesDisplay.tsx` | P3 | FE | Badge collection |
| `src/components/abeka/student/NewBadgeCelebration.tsx` | P3 | FE | Badge unlock animation |
| `src/components/abeka/student/ConfettiEffect.tsx` | P3 | FE | Confetti animation |

---

## Frontend Components - Mascot (P3)

| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `src/components/abeka/mascots/Kisu.tsx` | P3 | FE | Main Kisu component |
| `src/components/abeka/mascots/SmartKisu.tsx` | P3 | FE | Context-aware Kisu |
| `src/components/abeka/mascots/KisuSpeechBubble.tsx` | P3 | FE | Speech bubble |
| `src/components/abeka/mascots/KisuAnimations.ts` | P3 | FE | Animation presets |
| `src/lib/abeka/mascots/tips.ts` | P3 | FE | Tip generation logic |

---

## Integration Components (P4)

### Video Player
| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `src/components/abeka/video/AbekaVideoPlayer.tsx` | P4 | FS | Abeka-specific player |
| `src/components/abeka/video/VideoProgressBar.tsx` | P4 | FE | Custom progress bar |
| `src/components/abeka/video/CompletionOverlay.tsx` | P4 | FE | Completion celebration |
| `src/hooks/useVideoProgress.ts` | P4 | FE | Progress tracking hook |
| `src/hooks/useAssignmentCompletion.ts` | P4 | FS | Assignment completion hook |

---

## Hooks & Utilities

| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `src/hooks/useAbekaCurriculum.ts` | P2 | FE | Curriculum data hook |
| `src/hooks/useWeeklyPlan.ts` | P2 | FE | Weekly plan hook |
| `src/hooks/useDailyPlan.ts` | P3 | FE | Daily plan hook |
| `src/hooks/useChildProgress.ts` | P2 | FE | Progress hook |
| `src/hooks/useSkillTree.ts` | P3 | FE | Skill tree hook |
| `src/hooks/useStreak.ts` | P3 | FE | Streak hook |
| `src/hooks/useBadges.ts` | P3 | FE | Badges hook |
| `src/lib/abeka/utils/formatters.ts` | P2 | FE | Formatting utilities |
| `src/lib/abeka/utils/subjects.ts` | P2 | FE | Subject name mapping |

---

## Scripts & CLI

| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `src/scripts/import-abeka.ts` | P1 | BE | Import CLI script |
| `src/scripts/validate-abeka.ts` | P1 | BE | Validation script |
| `src/scripts/generate-skill-trees.ts` | P1 | BE | Skill tree generator |

---

## Workers

| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `src/workers/abeka-progress-worker.ts` | P4 | BE | Progress update worker |
| `src/workers/abeka-badge-worker.ts` | P4 | BE | Badge check worker |

---

## Tests

### Unit Tests
| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `tests/lib/abeka/import/parser.test.ts` | P1 | BE | Parser unit tests |
| `tests/lib/abeka/import/service.test.ts` | P1 | BE | Service unit tests |
| `tests/lib/abeka/progress/calculator.test.ts` | P4 | BE | Calculator tests |
| `tests/lib/abeka/gamification/badges.test.ts` | P4 | BE | Badge logic tests |
| `tests/lib/abeka/gamification/streak.test.ts` | P4 | BE | Streak tests |

### Component Tests
| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `tests/components/abeka/LessonCard.test.tsx` | P2 | FE | LessonCard tests |
| `tests/components/abeka/SkillNode.test.tsx` | P3 | FE | SkillNode tests |
| `tests/components/abeka/StreakDisplay.test.tsx` | P3 | FE | Streak tests |
| `tests/components/abeka/Kisu.test.tsx` | P3 | FE | Kisu tests |

### E2E Tests
| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `tests/e2e/abeka/parent-planner.spec.ts` | P2 | QA | Parent planner E2E |
| `tests/e2e/abeka/curriculum-browser.spec.ts` | P2 | QA | Browser E2E |
| `tests/e2e/abeka/student-tablet.spec.ts` | P3 | QA | Student tablet E2E |
| `tests/e2e/abeka/skill-tree.spec.ts` | P3 | QA | Skill tree E2E |
| `tests/e2e/abeka/integration.spec.ts` | P4 | QA | Full integration E2E |
| `tests/e2e/abeka/performance.spec.ts` | P4 | QA | Performance tests |

### Load Tests
| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `tests/load/abeka-load-test.ts` | P4 | QA | K6 load testing |

---

## Assets

| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `public/mascots/kisu/happy.png` | P3 | FE | Kisu happy state |
| `public/mascots/kisu/excited.gif` | P3 | FE | Kisu excited animation |
| `public/mascots/kisu/thinking.png` | P3 | FE | Kisu thinking state |
| `public/mascots/kisu/sleepy.png` | P3 | FE | Kisu sleepy state |
| `public/mascots/kisu/celebrating.gif` | P3 | FE | Kisu celebration |
| `public/images/abeka/subjects/*.svg` | P2 | FE | Subject icons |
| `public/images/abeka/badges/*.png` | P4 | FE | Badge icons |

---

## Types

| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `src/types/abeka.ts` | P1 | BE | Core Abeka types |
| `src/types/abeka-api.ts` | P1 | BE | API-specific types |
| `src/types/abeka-gamification.ts` | P4 | BE | Gamification types |

---

## Configuration

| File | Phase | Owner | Description |
|------|-------|-------|-------------|
| `src/config/abeka.ts` | P1 | BE | Abeka configuration |
| `.env.example` | P1 | BE | Environment variables |

---

## Summary by Phase

### Phase 1: Foundation
- **Total Files**: ~25
- **Backend**: 18 files
- **Frontend**: 7 files
- **Database**: 5 files

### Phase 2: Parent Interface
- **Total Files**: ~30
- **Frontend**: 25 files
- **Backend**: 5 files

### Phase 3: Student Interface
- **Total Files**: ~28
- **Frontend**: 24 files
- **Backend**: 4 files

### Phase 4: Integration
- **Total Files**: ~20
- **Full-Stack**: 10 files
- **Testing**: 10 files

---

## Total File Count

| Category | Count |
|----------|-------|
| Database/Prisma | 5 |
| Backend Services | 8 |
| API Routes | 15 |
| Frontend Components | 60 |
| Hooks & Utilities | 10 |
| Scripts | 3 |
| Workers | 2 |
| Tests | 15 |
| Assets | 15 |
| Types | 3 |
| Configuration | 2 |
| **Total** | **~138** |

# Phase 5: Analytics & Reports

## Context

- Depends on: Phase 1-4
- Mo rong WeeklyReport hien co voi skill-based analytics
- Tich hop vao teacher dashboard (B2B)

## Overview

- **Priority:** P2
- **Status:** completed (2026-02-25)
- **Effort:** 2-3 weeks

## Key Insights

- WeeklyReport da co (`minutesLearned`, `lessonsCompleted`, `skillsSummary` JSON)
- Can enriching `skillsSummary` voi real mastery data tu ChildSkillState
- Teacher dashboard can class-wide skill gap heatmap
- Parent report can "actionable insight" thay vi chi so lieu

## Enriched Weekly Report

```typescript
// Update src/modules/reports/weekly-report-service.ts

interface EnrichedSkillsSummary {
  // Existing
  lessonsCompleted: number;
  minutesLearned: number;
  streakDays: number;

  // New adaptive data
  skillsProgress: {
    domain: SkillDomain;
    totalSkills: number;
    masteredCount: number;
    proficientCount: number;
    developingCount: number;
    overallMastery: number; // 0-1

    topImprovements: {
      skillNameVi: string;
      masteryBefore: number;
      masteryAfter: number;
    }[];

    needsAttention: {
      skillNameVi: string;
      mastery: number;
      reason: string; // "No progress this week" | "Declining"
    }[];
  }[];

  reviewStats: {
    scheduled: number;
    completed: number;
    accuracy: number;
  };

  // AI-generated (future)
  narrativeInsight?: string;
}
```

## Teacher Dashboard - Class Skill Heatmap

```
GET /api/organizations/:orgId/class-skill-heatmap?domain=MATH
  Response: {
    skills: [{ id, code, nameVi }],
    students: [{
      childId, nickname,
      skillMasteries: [{ skillId, masteryLevel, score }]
    }],
    classAverages: [{ skillId, avgScore }],
    gapAlerts: [{
      skillId, nameVi,
      belowProficientCount: number,
      belowProficientPercent: number
    }]
  }
```

Visual representation:
```
           Count1-10  Add1dig  Sub1dig  Shapes  ...
Student A    ■■■■■     ■■■■     ■■■      ■■
Student B    ■■■■■     ■■■      ■■       ■
Student C    ■■■■      ■■       ■        ■
Student D    ■■■■■     ■■■■■    ■■■■     ■■■

Legend: ■ = 20% mastery
Green (>70%) | Yellow (40-70%) | Red (<40%)
```

## API Endpoints

```
GET /api/reports/weekly-adaptive?childId=...&weekStart=...
  Response: { ...existing WeeklyReport, enrichedSkills: EnrichedSkillsSummary }

GET /api/organizations/:orgId/class-skill-heatmap?domain=MATH
  Response: { heatmap data }

GET /api/organizations/:orgId/skill-gap-report?domain=MATH
  Response: {
    gapAlerts: [{ skill, belowProficientPercent, affectedStudents }],
    recommendations: [{ skill, suggestedAction }]
  }

GET /api/children/:childId/learning-trajectory
  Response: {
    weeks: [{
      weekStart, overallMastery, newSkillsMastered, reviewAccuracy
    }],
    projectedMasteryDate?: string  // khi nao master het grade level
  }
```

## File Structure

```
src/modules/adaptive/
  analytics-service.ts           // Aggregate analytics
  weekly-report-enricher.ts      // Enrich weekly report with skill data

src/modules/organizations/
  class-skill-heatmap-service.ts // B2B heatmap

src/app/api/reports/weekly-adaptive/route.ts
src/app/api/organizations/[orgId]/class-skill-heatmap/route.ts
src/app/api/organizations/[orgId]/skill-gap-report/route.ts
src/app/api/children/[childId]/learning-trajectory/route.ts

src/components/analytics/
  skill-heatmap.tsx              // Teacher view
  learning-trajectory-chart.tsx  // Parent view - line chart over weeks
  skill-gap-alert.tsx            // Teacher alert cards
```

## Implementation Steps

1. **`weekly-report-enricher.ts`** - Tinh enriched skills summary
2. **`analytics-service.ts`** - Aggregate queries
3. **`class-skill-heatmap-service.ts`** - B2B heatmap
4. **API routes** (4 endpoints)
5. **UI components** (3 components)
6. **Update weekly report cron** de include enriched data
7. **Update weekly report email template** voi skill highlights

## Todo List

- [x] `weekly-report-enricher.ts`
- [x] `analytics-service.ts`
- [x] `class-skill-heatmap-service.ts`
- [x] API: weekly-adaptive report
- [x] API: class skill heatmap
- [x] API: skill gap report
- [x] API: learning trajectory
- [x] UI: `skill-heatmap.tsx` (teacher)
- [x] UI: `learning-trajectory-chart.tsx` (parent)
- [x] UI: `skill-gap-alert.tsx` (teacher)
- [x] Update cron job enrich weekly report
- [x] Update email template
- [x] Unit tests

## Success Criteria

- Weekly report co enriched skill data
- Teacher thay class heatmap trong < 3s
- Skill gap alerts chinh xac (flag skills co >30% students below proficient)
- Learning trajectory chart hien thi trend 8 weeks

## Risk Assessment

- **Performance:** Heatmap query cho class 30 students x 20 skills = 600 rows -> OK voi single query
- **Data sparsity:** Tuan dau su dung se co it data -> can "Not enough data" fallback
- **Privacy:** Teacher chi thay students trong org cua minh (enforce org membership check)

## Cau hoi chua giai quyet

1. Co can AI-generated narrative insight cho weekly report khong? (Cost vs value)
2. Export PDF/CSV cho teacher reports?
3. Parent co muon so sanh con minh voi "average" khong? (Privacy concern)

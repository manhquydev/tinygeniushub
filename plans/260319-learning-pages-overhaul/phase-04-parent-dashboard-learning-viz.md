# Phase 04: Parent Dashboard Learning Visualization

## Context Links
- Parent dashboard: `src/app/(main)/parent/dashboard/page.tsx` (449 lines — NEEDS modularization)
- WeeklyReport model: Prisma schema
- Existing data: `lessonsCompleted`, `minutesLearned`, `streakDays` already fetched per child

## Overview
- **Priority**: P2
- **Status**: pending
- **Description**: Enhance child profile cards with better weekly progress bars, more prominent "Hoc tiep" shortcut, and recent lesson activity. Data already loaded — this is primarily a UI improvement.

## Key Insights
- Dashboard page is 449 lines — **MUST be split** (200-line rule)
- Weekly report data already fetched and rendered (lines 302-350) — just needs better visual treatment
- `lessonsThisWeek`, `minutesLearned`, `streakDays` all available from `WeeklyReport`
- "Vao khu hoc" link already exists (line 341) — needs to be more prominent
- Recent lesson completions (last 3) need a new query — currently only `latestCompletion` (single) is fetched

## Requirements

### Functional
- Weekly progress bar per child: "X/5 bai tuan nay" with visual fill
- "Hoc tiep" as primary CTA (larger, colored button) instead of secondary
- Recent 3 lesson completions per child (lesson title + completion date)

### Non-functional
- Dashboard must be split into sub-components to stay under 200 lines
- No new API endpoints needed — server component can query directly

## Related Code Files

### Files to Modify
1. `src/app/(main)/parent/dashboard/page.tsx` — refactor into smaller components + enhance child cards

### Files to Create
1. `src/components/parent/dashboard-hero-section.tsx` — hero banner (lines 176-210)
2. `src/components/parent/dashboard-metric-cards.tsx` — metric cards grid (lines 227-250)
3. `src/components/parent/dashboard-child-card.tsx` — enhanced child profile card
4. `src/components/parent/dashboard-shortcuts-section.tsx` — quick links section
5. `src/components/parent/dashboard-referral-section.tsx` — referral section
6. `src/components/parent/dashboard-reports-section.tsx` — reports section

## Architecture

### Modularization Plan

Current page.tsx (~449 lines) splits into:
- `page.tsx` (~80 lines) — data fetching + composition
- `dashboard-hero-section.tsx` (~40 lines) — hero banner
- `dashboard-metric-cards.tsx` (~50 lines) — 4 metric cards
- `dashboard-child-card.tsx` (~80 lines) — per-child card with enhanced viz
- `dashboard-shortcuts-section.tsx` (~30 lines) — quick links
- `dashboard-referral-section.tsx` (~40 lines) — referral CTA
- `dashboard-reports-section.tsx` (~40 lines) — recent reports

### New Data Query

Add to the existing `Promise.all` in page.tsx:
```ts
// Recent 3 completions per child (for all children)
prisma.lessonCompletion.findMany({
  where: { child: { parentId: parent.id } },
  orderBy: { completedAt: "desc" },
  take: 10, // Get 10, then group by child in JS
  select: {
    childId: true,
    completedAt: true,
    lesson: { select: { title: true } },
  },
})
```

Group in JS: `Map<childId, {title, completedAt}[]>` taking first 3 per child.

## Implementation Steps

### Step 1: Create component files (extract existing code)

Extract sections from page.tsx into separate components. Each component receives props — no data fetching inside.

### Step 2: Enhance dashboard-child-card.tsx

```tsx
type ChildCardProps = {
  child: { id: string; nickname: string; adaptiveEnabled: boolean };
  lessonsThisWeek: number;
  minutesLearned: number;
  streakDays: number;
  weeklyGoal: number;
  recentCompletions: { title: string; completedAt: Date }[];
};

export function DashboardChildCard(props: ChildCardProps) {
  const progress = clampPercent((props.lessonsThisWeek / props.weeklyGoal) * 100);

  return (
    <article className="...">
      {/* Avatar + name */}
      {/* Weekly progress: bigger bar with label "X/5 bai tuan nay" */}
      {/* Stats row: minutes + streak */}
      {/* Recent lessons: up to 3 items with title + relative date */}
      {/* CTA: "Hoc tiep" as primary solid button */}
    </article>
  );
}
```

Key UI changes to child card:
- Progress bar wider, with animated gradient
- "Hoc tiep" button: `solid-button` (primary) instead of ghost
- "Xem ban do ky nang" stays secondary
- Recent completions: small list below progress bar

### Step 3: Add recent completions query to page.tsx

### Step 4: Wire everything in page.tsx

```tsx
export default async function ParentDashboardPage() {
  const parent = await requireParent();
  const [children, reports, ..., recentCompletions] = await Promise.all([...]);

  // Group recent completions by child
  const completionsByChild = groupBy(recentCompletions, 'childId', 3);

  return (
    <div className="page-stack">
      <DashboardHeroSection ... />
      <DashboardMetricCards metrics={metricCards} />
      <DailyActivityFeed ... />
      <section>
        {children.map(child => (
          <DashboardChildCard
            key={child.id}
            child={child}
            recentCompletions={completionsByChild.get(child.id) ?? []}
            ...
          />
        ))}
      </section>
      <DashboardShortcutsSection firstChildId={firstChildId} />
      <DashboardReferralSection referral={referral} />
      <DashboardReportsSection reports={reports} />
    </div>
  );
}
```

## Todo List
- [ ] Create `src/components/parent/` directory
- [ ] Extract hero section into `dashboard-hero-section.tsx`
- [ ] Extract metric cards into `dashboard-metric-cards.tsx`
- [ ] Extract child card into `dashboard-child-card.tsx`
- [ ] Extract shortcuts into `dashboard-shortcuts-section.tsx`
- [ ] Extract referral into `dashboard-referral-section.tsx`
- [ ] Extract reports into `dashboard-reports-section.tsx`
- [ ] Add recent completions query to page.tsx Promise.all
- [ ] Group completions by child ID
- [ ] Enhance child card: bigger progress bar, prominent "Hoc tiep"
- [ ] Add recent completion list to child card
- [ ] Verify page.tsx stays under ~80 lines
- [ ] Verify each component under 200 lines

## Success Criteria
- Dashboard page.tsx under 100 lines
- All extracted components under 200 lines
- Weekly progress bar per child visually enhanced
- "Hoc tiep" is primary CTA per child
- Recent 3 lesson completions shown per child
- No visual regression in other dashboard sections
- No new API endpoints — all server-side queries

## Risk Assessment
- **Risk**: Refactoring 449-line page may break something
  - **Mitigation**: Extract one section at a time; test after each extraction
- **Risk**: Recent completions query adds load time
  - **Mitigation**: Added to existing Promise.all — parallel execution; limited to 10 records

## Security Considerations
- All queries filtered by `parentId` — no cross-parent data
- No new client-side data exposure

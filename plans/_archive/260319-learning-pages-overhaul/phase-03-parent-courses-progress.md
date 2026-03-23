# Phase 03: Parent Courses Page Progress

## Context Links
- Parent courses page: `src/app/(main)/parent/courses/page.tsx`
- Course service: `src/modules/courses/course-service.ts` (getParentEnrollments, line 172)
- LessonCompletion model: Prisma schema line 395
- Lesson player: `src/components/courses/course-lessons-player.tsx`

## Overview
- **Priority**: P2
- **Status**: pending
- **Description**: Add per-course progress bar (completed/total lessons), "Hoc tiep" button, and last activity date to parent courses page.

## Key Insights
- `getParentEnrollments` currently returns enrollment + course metadata but NO lesson completion data
- `LessonCompletion` links `childId` + `lessonId` — need to aggregate per course
- Parent may have multiple children — progress should aggregate all children's completions per course
- Current page is 155 lines (server component) — adding progress data keeps it under 200
- `CourseLesson` junction table links courses to lessons, needed for total count

## Requirements

### Functional
- Progress bar per course card: "X/Y bai hoan thanh" with visual bar
- "Hoc tiep" button linking to `/kid/courses/[slug]` (with first child's ID)
- Last activity date: "Hoc gan nhat: DD/MM/YYYY"

### Non-functional
- Single efficient query — avoid N+1
- Graceful when no completions exist

## Related Code Files

### Files to Modify
1. `src/modules/courses/course-service.ts` — enhance `getParentEnrollments` to include progress data
2. `src/app/(main)/parent/courses/page.tsx` — render progress bar, "Hoc tiep" button, last activity

### Files to Create
None

## Architecture

Query strategy: Extend `getParentEnrollments` to include:
1. `course._count.lessons` — total lessons per course
2. Subquery: count distinct `LessonCompletion` records where `childId` belongs to parent AND `lessonId` is in course's lessons

Efficient approach: After fetching enrollments, do a single grouped count query:

```ts
// Get all course IDs from enrollments
const courseIds = enrollments.map(e => e.course.id);

// Count completed lessons per course (across all children of this parent)
const completionCounts = await prisma.$queryRaw<{courseId: string, count: bigint}[]>`
  SELECT cl."courseId", COUNT(DISTINCT lc."lessonId") as count
  FROM "LessonCompletion" lc
  JOIN "Lesson" l ON l.id = lc."lessonId"
  JOIN "CourseLesson" cl ON cl."lessonId" = l.id
  JOIN "ChildProfile" cp ON cp.id = lc."childId"
  WHERE cl."courseId" = ANY(${courseIds})
  AND cp."parentId" = ${parentId}
  GROUP BY cl."courseId"
`;
```

Alternative (Prisma-native, may be simpler):
```ts
const completionCounts = await prisma.courseLesson.groupBy({
  by: ['courseId'],
  where: {
    courseId: { in: courseIds },
    lesson: {
      completions: {
        some: {
          child: { parentId }
        }
      }
    }
  },
  _count: { lessonId: true },
});
```

Also fetch latest completion date per course:
```ts
const latestCompletions = await prisma.lessonCompletion.findMany({
  where: {
    child: { parentId },
    lesson: {
      courseItems: {
        some: { courseId: { in: courseIds } }
      }
    }
  },
  orderBy: { completedAt: 'desc' },
  distinct: ['lessonId'],
  // Group by course manually after fetch
});
```

Simpler approach: single raw query that returns courseId, completedCount, lastCompletedAt.

## Implementation Steps

### Step 1: Add helper function to course-service.ts

```ts
export async function getCourseProgressForParent(
  parentId: string,
  courseIds: string[]
): Promise<Map<string, { completed: number; lastCompletedAt: Date | null }>> {
  // Raw query joining CourseLesson -> Lesson -> LessonCompletion -> ChildProfile
  // Returns { courseId, completed_count, last_completed_at } per course
}
```

### Step 2: Update getParentEnrollments or call separately

Option A: Modify `getParentEnrollments` to accept `includeProgress` flag.
Option B: Call `getCourseProgressForParent` separately in the page. (**Preferred** — YAGNI, keep service function focused)

In page.tsx:
```ts
const enrollments = await getParentEnrollments(parent.id);
const courseIds = enrollments.map(e => e.courseId);
const progress = await getCourseProgressForParent(parent.id, courseIds);
```

### Step 3: Add `_count.lessons` to enrollment query

In `getParentEnrollments`, add to course select:
```ts
course: {
  select: {
    ...existing,
    _count: { select: { lessons: true } },
  }
}
```

### Step 4: Update page UI

Per course card, below description, add:
```tsx
const prog = progress.get(enrollment.courseId);
const completed = prog?.completed ?? 0;
const total = enrollment.course._count.lessons;
const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

// Progress bar
<div className="mt-3">
  <div className="flex justify-between text-xs text-slate-500 mb-1">
    <span>{completed}/{total} bai hoan thanh</span>
    <span>{pct}%</span>
  </div>
  <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
    <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500"
         style={{ width: `${pct}%` }} />
  </div>
</div>

// Last activity
{prog?.lastCompletedAt && (
  <p className="text-xs text-slate-500 mt-1">
    Hoc gan nhat: {formatDate(prog.lastCompletedAt)}
  </p>
)}
```

### Step 5: Replace "Xem khoa" with "Hoc tiep" for in-progress courses

```tsx
// If enrolled and not completed:
<Link href={`/kid/courses/${enrollment.course.slug}?childId=${firstChildId}`}
      className="solid-button" style={{ width: "fit-content" }}>
  Hoc tiep <ChevronRight className="ml-1 h-4 w-4" />
</Link>
```

Need `firstChildId` — fetch first child in page:
```ts
const firstChild = await prisma.childProfile.findFirst({
  where: { parentId: parent.id },
  orderBy: { createdAt: "asc" },
  select: { id: true },
});
```

## Todo List
- [ ] Add `_count.lessons` to getParentEnrollments course select
- [ ] Create `getCourseProgressForParent` function in course-service.ts
- [ ] Fetch first child ID in parent courses page
- [ ] Render progress bar per course card
- [ ] Render last activity date
- [ ] Update CTA button: "Hoc tiep" for in-progress, "Xem khoa" for completed
- [ ] Handle edge case: 0 completions, 0 lessons
- [ ] Verify page stays under 200 lines (extract progress bar if needed)

## Success Criteria
- Each course card shows accurate completion count and progress bar
- "Hoc tiep" links to kid's course page with childId
- Last activity date displays correctly
- No N+1 queries — single batch progress query
- Page loads fast (no perf regression)

## Risk Assessment
- **Risk**: Raw SQL query may not match Prisma's generated table names
  - **Mitigation**: Use Prisma groupBy if possible; test against real DB
- **Risk**: Page exceeds 200 lines after additions
  - **Mitigation**: Extract progress bar into `course-progress-bar.tsx` component if needed

## Security Considerations
- Progress query filtered by `parentId` — no cross-parent data leak
- `firstChildId` only from parent's own children

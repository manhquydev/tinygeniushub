# Phase 01: Free Lesson Preview — "Hoc thu that"

## Context Links
- Video token API: `src/app/api/lessons/[lessonId]/video-token/route.ts`
- Course detail page: `src/app/(main)/courses/[slug]/page.tsx`
- Curriculum component: `src/app/(main)/courses/[slug]/course-detail-curriculum.tsx`
- Prisma schema: `isPreview Boolean @default(false)` on Lesson model (line 347)

## Overview
- **Priority**: P1 (highest — core conversion feature)
- **Status**: pending
- **Description**: Allow unauthenticated visitors to watch lesson 1 of each course directly on the course detail page via a video modal. Admin marks `isPreview=true` on target lessons.

## Key Insights
- `isPreview` field exists in DB but is never consumed by any API or UI
- Video token API (line 42) already fetches `isPreview` but ignores it
- Bunny signed embed URLs have time expiry — safe for unauthenticated access
- `assertTrustedOrigin` and `assertRequestAllowedBySecurityControls` run before auth check — keep them

## Requirements

### Functional
- Unauthenticated users can watch `isPreview=true` lessons on course detail page
- "Hoc thu" badge visible on preview lessons in curriculum list
- Lock icon on non-preview lessons
- Click preview lesson -> opens video modal with lesson objective + CTA "Mua khoa hoc"
- Modal closable via X button, ESC, or backdrop click

### Non-functional
- No auth bypass for non-preview lessons
- Signed URL expiry still enforced
- Existing authenticated flow unchanged

## Related Code Files

### Files to Modify
1. `src/app/api/lessons/[lessonId]/video-token/route.ts` — bypass auth for `isPreview` lessons
2. `src/app/(main)/courses/[slug]/page.tsx` — add `isPreview` to `loadPublishedCourse` query, pass to curriculum
3. `src/app/(main)/courses/[slug]/course-detail-curriculum.tsx` — add badges, lock icons, modal trigger

### Files to Create
1. `src/components/courses/course-lesson-preview-modal.tsx` — client component, video modal

## Architecture

```
User clicks "Hoc thu" on curriculum item
  -> CourseDetailCurriculum opens CourseLessonPreviewModal
    -> Modal fetches GET /api/lessons/[lessonId]/video-token
      -> API checks lesson.isPreview === true
        -> If true: skip auth, return signed Bunny embed URL
        -> If false: require auth as before
    -> Modal renders iframe + lesson objective + CTA button
```

## Implementation Steps

### Step 1: Update video token API
File: `src/app/api/lessons/[lessonId]/video-token/route.ts`

Current flow (lines 28-31):
```ts
const parent = await getParentFromRequest(request);
if (!parent) return fail("Unauthorized", 401);
```

New flow:
```ts
const { lessonId } = await params;

// Fetch lesson first (move up before auth check)
const lesson = await prisma.lesson.findUnique({
  where: { id: lessonId },
  select: {
    id: true, bunnyVideoId: true, videoStatus: true,
    videoSource: true, isPreview: true, trialEnabled: true,
  },
});

if (!lesson) return fail("Video not available", 404);

// For non-preview lessons, require authentication
if (!lesson.isPreview) {
  const parent = await getParentFromRequest(request);
  if (!parent) return fail("Unauthorized", 401);
}

// Rest of video URL generation stays the same
```

Important: Keep `assertTrustedOrigin` and `assertRequestAllowedBySecurityControls` calls BEFORE the lesson fetch — they protect against CSRF/abuse regardless of preview status.

For `isVideoSourceProtected` path: when `isPreview` and no auth, use a synthetic identifier (e.g., `"preview"`) as parentId in the playback token, since parent context isn't needed for preview.

### Step 2: Update `loadPublishedCourse` query
File: `src/app/(main)/courses/[slug]/page.tsx`

Add `isPreview` to the lesson select (line 62):
```ts
lessons: {
  orderBy: { orderNo: "asc" },
  take: 12,
  select: {
    id: true,
    orderNo: true,
    lesson: {
      select: {
        id: true,           // ADD — needed for video-token API call
        title: true,
        estimatedMinutes: true,
        objective: true,
        isPreview: true,    // ADD
      }
    },
  },
},
```

Update `CourseDetailCurriculum` usage (line 252):
```tsx
<CourseDetailCurriculum
  lessons={course.lessons}
  totalLessonCount={course._count.lessons}
  courseSlug={course.slug}      // ADD — needed for CTA link
  isOwned={isOwned}             // ADD — hide preview if already owned
/>
```

### Step 3: Update curriculum component
File: `src/app/(main)/courses/[slug]/course-detail-curriculum.tsx`

Update types:
```ts
type Lesson = {
  id: string;
  orderNo: number;
  lesson: {
    id: string;              // ADD
    title: string;
    estimatedMinutes: number;
    objective: string;
    isPreview: boolean;      // ADD
  };
};

type Props = {
  lessons: Lesson[];
  totalLessonCount: number;
  courseSlug: string;         // ADD
  isOwned: boolean;           // ADD
};
```

Changes to each lesson article:
- If `lesson.isPreview && !isOwned`: show green "Hoc thu" badge + play icon, `onClick` opens modal
- If `!lesson.isPreview`: show lock icon (muted) instead of play
- If `isOwned`: show all lessons normally (no badges/locks)

Add state for modal:
```tsx
"use client"; // Will need to become client component OR extract interactive part

// Option A: Keep server component, extract interactive wrapper
// Option B: Make entire component client (simpler, component is small)
// Recommendation: Option B — component is 51 lines, well under 200 limit
```

### Step 4: Create preview modal component
File: `src/components/courses/course-lesson-preview-modal.tsx`

```tsx
"use client";
// Props: lessonId, lessonTitle, lessonObjective, courseSlug, onClose
// State: video loading/ready/error
// On mount: fetch /api/lessons/{lessonId}/video-token
// Render: Dialog overlay + iframe/SecureVideoPlayer + lesson info + CTA
```

Key UI elements:
- shadcn Dialog component (if available) or custom modal with backdrop
- Video iframe (16:9 aspect ratio)
- Lesson title + objective text below video
- CTA button: "Mua khoa hoc" linking to `/courses/{slug}#checkout` or checkout flow
- Close button (X) top-right

Estimated lines: ~80-100

## Todo List
- [ ] Move lesson fetch before auth check in video-token API
- [ ] Add isPreview bypass logic in video-token API
- [ ] Add `lesson.id` and `isPreview` to loadPublishedCourse query
- [ ] Pass `courseSlug` and `isOwned` to CourseDetailCurriculum
- [ ] Convert CourseDetailCurriculum to client component
- [ ] Add "Hoc thu" badge and lock icon rendering
- [ ] Create CourseLessonPreviewModal component
- [ ] Wire modal open/close in curriculum
- [ ] Test: unauthenticated user can play preview lesson
- [ ] Test: unauthenticated user CANNOT play non-preview lesson
- [ ] Test: authenticated+enrolled user sees normal curriculum (no badges)

## Success Criteria
- Unauthenticated visitor sees "Hoc thu" badge on lesson 1
- Clicking opens modal with working video playback
- Non-preview lessons show lock, clicking does nothing
- Authenticated enrolled users see no change
- No regression in existing video token flow

## Risk Assessment
- **Risk**: Moving lesson fetch before auth opens a timing oracle (reveals lesson existence)
  - **Mitigation**: Acceptable — lesson IDs are already visible in curriculum HTML
- **Risk**: Preview video abuse (mass scraping embed URLs)
  - **Mitigation**: Bunny signed URLs expire; CSRF/security guards still active; rate limiting at edge

## Security Considerations
- `assertTrustedOrigin` + `assertRequestAllowedBySecurityControls` remain before any DB query
- Only `isPreview=true` lessons bypass auth — strict check
- Signed embed URLs have TTL expiry
- No user data exposed in preview response

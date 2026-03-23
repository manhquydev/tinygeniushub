# Phase 2: API Endpoints

## Overview
- **Priority:** P1
- **Status:** pending
- **Effort:** 4h
- **Depends on:** Phase 1

Create GET /api/lessons/:id/full and admin segment CRUD endpoints.

## Context Links
- [Existing lesson APIs](../../src/app/api/lessons/[lessonId]/) — complete, activities, video-token, watch/*
- [Admin lesson API](../../src/app/api/admin/lessons/route.ts)

## Key Insights
- Existing watch session/heartbeat APIs stay unchanged — VIDEO_ONLY mode reuses them
- `/api/lessons/:id/full` is the single data source for UnifiedLessonFlow
- Response shape must include segments ordered by `orderNo`, plus activities for VIDEO_ONLY backward compat

## Architecture

### GET /api/lessons/:id/full
```typescript
// Response:
{
  ok: true,
  data: {
    lesson: {
      id, title, objective, estimatedMinutes,
      videoSource, bunnyVideoId, videoStatus,
      conceptVideoUrl, transitionAudioUrl,
      segments: LessonSegment[] (ordered by orderNo, with activity included),
      activities: Activity[] (for VIDEO_ONLY backward compat)
    }
  }
}
```

### Admin Segment CRUD: /api/admin/lessons/:id/segments
- GET — list segments for lesson
- POST — create segment (body: { type, orderNo, videoUrl?, stepType?, stepConfig?, activityId? })
- PUT — update segment (body: { id, ...fields })
- DELETE — delete segment (body: { id })
- PATCH — reorder segments (body: { segments: [{id, orderNo}] })

## Related Code Files

### Create
- `src/app/api/lessons/[lessonId]/full/route.ts`
- `src/app/api/admin/lessons/[lessonId]/segments/route.ts`

### Keep (no changes)
- `src/app/api/lessons/[lessonId]/watch/session/route.ts`
- `src/app/api/lessons/[lessonId]/watch/heartbeat/route.ts`
- `src/app/api/lessons/[lessonId]/watch/route.ts`
- `src/app/api/lessons/[lessonId]/complete/route.ts`
- `src/app/api/lessons/[lessonId]/activities/route.ts`
- `src/app/api/lessons/[lessonId]/video-token/route.ts`

## Implementation Steps

1. Create `src/app/api/lessons/[lessonId]/full/route.ts`
   - GET handler: fetch lesson with segments (ordered), activities, return full payload
   - Auth: require parent session (same as other lesson APIs)
2. Create `src/app/api/admin/lessons/[lessonId]/segments/route.ts`
   - GET: list segments for lesson, ordered by orderNo
   - POST: create segment, validate type/orderNo
   - PUT: update segment by id
   - DELETE: delete segment by id
   - PATCH: bulk reorder (accept array of {id, orderNo})
   - Auth: requireAdminFromRequest
3. Verify existing watch/heartbeat/complete APIs work unchanged

## TODO

- [ ] Create GET /api/lessons/:id/full route
- [ ] Create admin segment CRUD route
- [ ] Test full endpoint returns correct shape
- [ ] Test segment CRUD operations
- [ ] Verify existing APIs unaffected

## Success Criteria
- GET /api/lessons/:id/full returns lesson + segments + activities
- Admin can create/edit/delete/reorder segments
- Existing watch/heartbeat/complete APIs unchanged

## Risk Assessment
- **Risk:** Auth model mismatch between parent/child APIs — Mitigation: follow existing pattern in `activities/route.ts`

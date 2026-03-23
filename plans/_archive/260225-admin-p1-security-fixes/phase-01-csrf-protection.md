---
phase: 1
title: "CSRF Protection - assertTrustedOrigin"
status: completed
effort: 1.5h
---

# Phase 1: CSRF Protection

## Context

- Reference impl: `src/app/api/admin/security/rate-limits/route.ts` line 45
- Import: `import { assertTrustedOrigin } from "@/lib/security/csrf";`
- Call `assertTrustedOrigin(request)` as FIRST line inside try block of every POST/PATCH/DELETE handler

## Currently Protected (2 files)

1. `src/app/api/admin/security/rate-limits/route.ts` - PATCH
2. `src/app/api/admin/lessons/[lessonId]/trial-flag/route.ts` - PATCH

## Files to Update (32 routes, ~34 handler functions)

Add `assertTrustedOrigin(request)` to each mutation handler:

### Announcements
- [x] `src/app/api/admin/announcements/route.ts` - POST
- [x] `src/app/api/admin/announcements/[id]/route.ts` - PATCH, DELETE

### Blog
- [x] `src/app/api/admin/blog/authors/route.ts` - POST
- [x] `src/app/api/admin/blog/categories/route.ts` - POST
- [x] `src/app/api/admin/blog/comments/route.ts` - PATCH, DELETE
- [x] `src/app/api/admin/blog/posts/route.ts` - POST
- [x] `src/app/api/admin/blog/posts/[id]/route.ts` - PATCH, DELETE
- [x] `src/app/api/admin/blog/posts/[id]/publish/route.ts` - POST
- [x] `src/app/api/admin/blog/posts/[id]/refresh-related/route.ts` - POST

### Content Management
- [x] `src/app/api/admin/content/activities/route.ts` - POST
- [x] `src/app/api/admin/content/activities/[id]/route.ts` - PATCH, DELETE
- [x] `src/app/api/admin/content/lessons/route.ts` - POST
- [x] `src/app/api/admin/content/lessons/[id]/route.ts` - PATCH, DELETE
- [x] `src/app/api/admin/content/lessons/[id]/trial-toggle/route.ts` - POST
- [x] `src/app/api/admin/content/levels/route.ts` - POST
- [x] `src/app/api/admin/content/tracks/route.ts` - POST
- [x] `src/app/api/admin/content/units/route.ts` - POST

### Courses
- [x] `src/app/api/admin/courses/route.ts` - POST
- [x] `src/app/api/admin/courses/[id]/route.ts` - PATCH, DELETE
- [x] `src/app/api/admin/courses/[id]/publish/route.ts` - POST
- [x] `src/app/api/admin/courses/[id]/lessons/route.ts` - POST
- [x] `src/app/api/admin/courses/[id]/enrollments/route.ts` - POST

### Coupons
- [x] `src/app/api/admin/coupons/route.ts` - POST
- [x] `src/app/api/admin/coupons/[id]/route.ts` - PATCH, DELETE

### Feature Flags
- [x] `src/app/api/admin/feature-flags/[key]/route.ts` - PATCH

### Gift Codes
- [x] `src/app/api/admin/gift-codes/route.ts` - POST

### Impersonation
- [x] `src/app/api/admin/impersonate/route.ts` - POST
- [x] `src/app/api/admin/impersonate/stop/route.ts` - POST

### Logging
- [x] `src/app/api/admin/log/route.ts` - POST

### Organizations
- [x] `src/app/api/admin/organizations/route.ts` - POST
- [x] `src/app/api/admin/organizations/[id]/route.ts` - PATCH, DELETE
- [x] `src/app/api/admin/organizations/[id]/members/route.ts` - POST, DELETE

### Users
- [x] `src/app/api/admin/users/[parentId]/notes/route.ts` - POST
- [x] `src/app/api/admin/users/[parentId]/route.ts` - PATCH
- [x] `src/app/api/admin/users/bulk/route.ts` - POST

### Videos
- [x] `src/app/api/admin/videos/upload/route.ts` - POST

### Bulk Enroll
- [x] `src/app/api/admin/bulk-enroll/route.ts` - POST

## Implementation Pattern

For each file:

1. Add import (if not present): `import { assertTrustedOrigin } from "@/lib/security/csrf";`
2. Add `assertTrustedOrigin(request);` as first line inside every POST/PATCH/DELETE try block
3. Compile check after each batch

## Success Criteria

- All 34 admin mutation handlers call `assertTrustedOrigin(request)`
- `npx tsc --noEmit` passes
- Existing tests still pass

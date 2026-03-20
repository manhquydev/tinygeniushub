---
phase: 3
title: "Zod Schema Validation for Admin Mutations"
status: completed
effort: 1.5h
---

# Phase 3: Zod Validation

## Context

Reference pattern: `src/app/api/admin/impersonate/route.ts` - uses `z.object()` + `.parse()` correctly.

All routes below use `as` type assertions and default to empty strings, accepting any garbage input.

## Routes to Fix

### 1. POST /api/admin/courses (`src/app/api/admin/courses/route.ts`)

Replace `as` cast with:

```ts
const createCourseSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).default(""),
  priceVnd: z.number().int().min(0).default(0),
  durationDays: z.number().int().min(1).default(30),
  coverImageUrl: z.string().url().nullish(),
});
```

### 2. PATCH /api/admin/courses/[id] (`src/app/api/admin/courses/[id]/route.ts`)

```ts
const updateCourseSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  priceVnd: z.number().int().min(0).optional(),
  durationDays: z.number().int().min(1).optional(),
  coverImageUrl: z.string().url().nullish(),
  isPublished: z.boolean().optional(),
});
```

### 3. POST /api/admin/organizations (`src/app/api/admin/organizations/route.ts`)

```ts
const createOrgSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  primaryColor: z.string().max(20).optional(),
  logoUrl: z.string().url().nullish(),
  domain: z.string().max(255).nullish(),
  billingStart: z.string().datetime().nullish(),
  billingEnd: z.string().datetime().nullish(),
});
```

### 4. POST /api/admin/announcements (`src/app/api/admin/announcements/route.ts`)

```ts
const createAnnouncementSchema = z.object({
  message: z.string().min(1).max(1000),
  type: z.enum(["INFO", "WARNING", "SUCCESS"]).default("INFO"),
  scheduledAt: z.string().datetime().nullish(),
  endsAt: z.string().datetime().nullish(),
});
```

### 5. POST /api/admin/coupons (`src/app/api/admin/coupons/route.ts`)

```ts
const createCouponSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9_-]+$/i),
  discountPercent: z.number().min(0).max(100),
  maxUses: z.number().int().min(1).nullish(),
  expiresAt: z.string().datetime().nullish(),
});
```

### 6. POST /api/admin/content/lessons (`src/app/api/admin/content/lessons/route.ts`)

```ts
const createLessonSchema = z.object({
  unitId: z.string().min(1),
  orderNo: z.number().int().min(1).default(1),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1).max(200),
  objective: z.string().min(1).max(500),
  estimatedMinutes: z.number().int().min(1).default(15),
  trialEnabled: z.boolean().default(false),
  videoSource: z.string().max(500).nullish(),
  offlineCardMarkdown: z.string().max(10000).nullish(),
  parentScriptMarkdown: z.string().max(10000).nullish(),
});
```

## Implementation Pattern

For each route:

1. Add `import { z } from "zod";` (if not present)
2. Define schema const above the handler
3. Replace `(await request.json()) as {...}` with `schema.parse(await request.json())`
4. Remove default fallbacks (Zod handles defaults)
5. Zod throws `ZodError` on invalid input; verify `handleRouteError` handles it

## Pre-check: handleRouteError ZodError handling

Verify `src/lib/route-error.ts` handles `ZodError` and returns 400. If not, add:

```ts
if (error instanceof z.ZodError) {
  return fail("Validation error", 400, { issues: error.issues });
}
```

## Todo

- [x] Verify `handleRouteError` handles ZodError
- [x] POST /api/admin/courses
- [x] PATCH /api/admin/courses/[id]
- [x] POST /api/admin/organizations
- [x] POST /api/admin/announcements
- [x] POST /api/admin/coupons
- [x] POST /api/admin/content/lessons
- [x] Compile check
- [ ] Run existing tests

## Success Criteria

- All 6 routes validate input with Zod schemas
- Invalid input returns 400 with descriptive error
- `npx tsc --noEmit` passes
- Existing tests pass

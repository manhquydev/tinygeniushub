---
phase: 3
title: "Input Validation & Logging"
status: pending
priority: P2
effort: 1.5h
---

# Phase 3: Input Validation & Logging

## Findings: C1, M1, M2, M4, M6, M7

## Context Links
- `src/app/api/adaptive/complete-activity/route.ts` — adaptive activity completion
- `src/modules/adaptive/audio-gen-service.ts` — TTS audio generation
- `src/app/api/lessons/[lessonId]/complete/route.ts` — lesson completion
- `src/lib/env.ts` — env schema
- `src/lib/route-error.ts` — error handler
- `src/lib/observability/logger.ts` — structured logger
- `src/app/api/courses/checkout/mock-success/route.ts` — mock checkout

---

## C1 — IDOR: Adaptive Activity Completion Bypasses Ownership Check

**Status**: **ALREADY FIXED**. Current code at `complete-activity/route.ts:40-46` performs:
```ts
const child = await prisma.childProfile.findFirst({
  where: { id: parsed.data.childId, parentId: parent.id },
  select: { id: true },
});
if (!child) {
  return fail("Child not found", 404);
}
```

**Action**: Verify only, no code change needed.

**Note**: `skill-attempt-service.ts` is an internal service called after authorization. It correctly trusts the already-validated `childId`. No fix needed there.

---

## M1 — Path Traversal in Audio Generation

**Problem**: `audio-gen-service.ts:31` uses `itemId` directly in `path.join(AUDIO_DIR, \`${itemId}.mp3\`)`. A malicious `itemId` like `../../etc/passwd` could write outside AUDIO_DIR.

**Files to modify**:
- `src/modules/adaptive/audio-gen-service.ts`

**Changes**:

Add validation after line 23 (inside `generatePlacementAudio`):
```ts
export async function generatePlacementAudio(text: string, itemId: string): Promise<string> {
  // Validate itemId: alphanumeric, hyphens, underscores only
  if (!/^[a-zA-Z0-9_-]+$/.test(itemId)) {
    throw new Error(`Invalid itemId: must be alphanumeric with hyphens/underscores`);
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  // ... rest unchanged
```

Also add a resolved-path check after constructing filePath (defense in depth):
```ts
const filePath = path.join(AUDIO_DIR, `${itemId}.mp3`);

// Verify resolved path stays within AUDIO_DIR
const resolvedPath = path.resolve(filePath);
if (!resolvedPath.startsWith(path.resolve(AUDIO_DIR))) {
  throw new Error("Invalid audio file path");
}
```

---

## M2 — Lesson Completion Rate Limit Too Coarse

**Problem**: Rate limit keys use IP and parentId but not childId. A parent with multiple children could hit the parent-level limit unfairly, or a single child could consume the entire parent quota.

**Files to modify**:
- `src/app/api/lessons/[lessonId]/complete/route.ts`

**Changes**:

Add a per-child rate limit after the existing parent limit. Extract childId from the request body:

```ts
// After line 51 (parentLimit check), before line 53:
const { lessonId } = await params;
const payload = await request.json();

// Add per-child rate limit if childId present in payload
const childId = typeof payload?.childId === "string" ? payload.childId : null;
if (childId) {
  const childLimit = await enforceRateLimit({
    key: `learning:lesson-complete:child:${buildRateLimitIdentity(childId)}`,
    limit: parentPolicy.limit,  // Same limit per child
    windowMs: parentPolicy.windowMs,
    storeFailureMode: "deny",
  });
  if (!childLimit.allowed) {
    return fail("Too many lesson completion requests for this child. Please retry later.", 429, {
      retryAfterMs: childLimit.retryAfterMs,
    });
  }
}

const result = await completeLesson({
  parentId: parent.id,
  lessonId,
  payload,
});
```

**Note**: `request.json()` is called once and result stored in `payload`. Move the `params` destructure and `request.json()` call before the child rate limit block (currently at lines 53-54). This reorder is needed since we need `payload` earlier.

---

## M4 — Stripe Webhook Tolerance Max Too High

**Problem**: `STRIPE_WEBHOOK_TOLERANCE_SECONDS` max is 3600 (1 hour). Should be 300 (5 minutes) to limit replay window.

**Files to modify**:
- `src/lib/env.ts`

**Changes**:

Line 64: Change `.max(3600)` to `.max(300)`:
```ts
STRIPE_WEBHOOK_TOLERANCE_SECONDS: z.coerce.number().int().min(30).max(300).default(300),
```

---

## M6 — Error Stack Traces in Production Logs

**Problem**: `route-error.ts:35` logs `error.stack` and `logger.ts:21` serializes `value.stack` for Error objects unconditionally. Stack traces in production logs can leak internal paths.

**Files to modify**:
- `src/lib/route-error.ts`
- `src/lib/observability/logger.ts`

**Changes**:

### `src/lib/route-error.ts`
Line 31-37: Conditionally include stack:
```ts
if (error instanceof Error) {
  logError("route.unhandled_error", {
    name: error.name,
    message: error.message,
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack }),
    context,
  });

  return fail("Internal server error", 500);
}
```

### `src/lib/observability/logger.ts`
Line 17-22: Conditionally include stack in sanitizeValue:
```ts
if (value instanceof Error) {
  return {
    name: value.name,
    message: value.message,
    ...(env.NODE_ENV !== "production" && { stack: value.stack }),
  };
}
```

---

## M7 — Mock Checkout Endpoint

**Problem**: The mock checkout endpoint already has guards (line 101-111) that disable it in production unless `ALLOW_PROD_MOCK_CHECKOUT_CALLBACK` is true. But when it IS enabled in production, there's no audit logging for the "gate allowed" event.

**Files to modify**:
- `src/app/api/courses/checkout/mock-success/route.ts`

**Changes**:

After the guard check at line 111, add audit logging when prod + mock is allowed:
```ts
if (env.NODE_ENV === "production" && env.ALLOW_PROD_MOCK_CHECKOUT_CALLBACK) {
  logWarn("courses.mock_checkout.prod_access", {
    ip: request.headers.get("x-forwarded-for") ?? "unknown",
    url: request.nextUrl.toString(),
  });
}
```

Insert this after line 111 (after the disabled check block).

---

## Todo List

- [ ] Verify C1 is already fixed (no code change)
- [ ] Add itemId validation regex in audio-gen-service.ts (M1)
- [ ] Add resolved-path containment check in audio-gen-service.ts (M1)
- [ ] Add per-child rate limit to lesson completion (M2)
- [ ] Reduce Stripe webhook tolerance max to 300 (M4)
- [ ] Strip stack traces from production logs in route-error.ts (M6)
- [ ] Strip stack traces from production logs in logger.ts (M6)
- [ ] Add production audit log to mock checkout endpoint (M7)

## Risk Assessment

- **M2 reorder**: Moving `request.json()` earlier changes control flow slightly. Ensure the JSON parse error is still caught by the outer try/catch.
- **M4 tolerance reduction**: If current production value is between 301-3600, deploy will fail validation. Check current env value before deploy.
- **M6 stack stripping**: Debugging production errors becomes harder. Ensure log aggregation tool captures enough context via `name` + `message`.

---
phase: 2
title: "Rate Limiting for High-Risk Admin Endpoints"
status: complete
effort: 1h
---

# Phase 2: Rate Limiting

## Context

Reference impl: `src/app/api/admin/security/rate-limits/route.ts` lines 14-30

The `enforceAdminMutationRateLimit` helper is defined locally in that file. We need to extract it to a shared module and apply it to high-risk endpoints.

## Step 1: Extract shared helper

Create `src/lib/security/admin-rate-limit.ts`:

```ts
import type { NextRequest } from "next/server";
import { fail } from "@/lib/http";
import { enforceRateLimit, getRequestIp } from "@/lib/rate-limit";
import { getRateLimitPolicy } from "@/modules/platform/security-policy-service";

export async function enforceAdminMutationRateLimit(request: NextRequest) {
  const ipPolicy = await getRateLimitPolicy("admin.mutation.ip");
  const ip = getRequestIp(request);
  const ipRateLimit = await enforceRateLimit({
    key: `admin:mutation:${ip}`,
    limit: ipPolicy.limit,
    windowMs: ipPolicy.windowMs,
    storeFailureMode: "deny",
  });
  if (!ipRateLimit.allowed) {
    return fail("Too many admin mutation requests. Please retry later.", 429, {
      retryAfterMs: ipRateLimit.retryAfterMs,
    });
  }
  return null;
}
```

## Step 2: Update reference route

Refactor `src/app/api/admin/security/rate-limits/route.ts` to import from the shared module instead of defining locally.

## Step 3: Apply to high-risk endpoints

Priority targets (per security report):

- [x] `src/app/api/admin/impersonate/route.ts` - POST (account takeover risk)
- [x] `src/app/api/admin/impersonate/stop/route.ts` - POST
- [x] `src/app/api/admin/users/bulk/route.ts` - POST (mass action risk)
- [x] `src/app/api/admin/bulk-enroll/route.ts` - POST (mass action risk)
- [x] `src/app/api/admin/export/users/route.ts` - GET (data exfiltration risk)
- [x] `src/app/api/admin/export/payments/route.ts` - GET (data exfiltration risk)

## Implementation Pattern

For each route, add after `assertTrustedOrigin`:

```ts
import { enforceAdminMutationRateLimit } from "@/lib/security/admin-rate-limit";

// Inside handler, after assertTrustedOrigin:
const rateLimit = await enforceAdminMutationRateLimit(request);
if (rateLimit) return rateLimit;
```

For GET export routes (no CSRF needed for GET, but rate limit is needed):

```ts
const rateLimit = await enforceAdminMutationRateLimit(request);
if (rateLimit) return rateLimit;
```

## Success Criteria

- Shared helper extracted and used in 7 routes
- Original security/rate-limits route refactored to use shared helper
- `npx tsc --noEmit` passes

---
phase: 1
title: "Auth & Admin Hardening"
status: pending
priority: P1
effort: 2.5h
---

# Phase 1: Auth & Admin Hardening

## Findings: C2, C3, H4, H5, H6, H7, M3

## Context Links
- `src/lib/auth/admin-auth.ts` — betterAuth admin config
- `src/lib/auth/session.ts` — session resolution + impersonation
- `src/lib/auth/admin.ts` — admin email check helpers
- `src/lib/auth/impersonation.ts` — impersonation cookie logic
- `src/modules/admin/admin-auth-service.ts` — JWT-based admin session
- `src/app/api/admin/auth/login/route.ts` — admin login
- `src/app/api/admin/impersonate/route.ts` — impersonate endpoint
- `src/lib/env.ts` — env schema
- `src/app/api/admin/security/edge-export/route.ts` — edge export

---

## C2 — Admin Secret Derived via String Concatenation

**Problem**: `env.BETTER_AUTH_SECRET + "_admin"` is predictable if main secret leaks.

**Files to modify**:
- `src/lib/env.ts` — Add `ADMIN_AUTH_SECRET` env var
- `src/lib/auth/admin-auth.ts` — Use `env.ADMIN_AUTH_SECRET`
- `src/app/api/admin/auth/login/route.ts` — Use `env.ADMIN_AUTH_SECRET` for JWT signing
- `src/modules/admin/admin-auth-service.ts` — Use `env.ADMIN_AUTH_SECRET` for JWT verify

**Changes**:

### `src/lib/env.ts`
Add to schema:
```ts
ADMIN_AUTH_SECRET: z.string().min(32),
```
Add to parsedEnv:
```ts
ADMIN_AUTH_SECRET:
  process.env.ADMIN_AUTH_SECRET ??
  (isProduction && !allowCiFallbacks ? undefined : "dev-admin-auth-secret-change-this-in-production-32"),
```

### `src/lib/auth/admin-auth.ts`
Line 13: Change `secret: env.BETTER_AUTH_SECRET + "_admin"` to:
```ts
secret: env.ADMIN_AUTH_SECRET,
```

### `src/app/api/admin/auth/login/route.ts`
Line 105: Change `new TextEncoder().encode(`${env.BETTER_AUTH_SECRET}_admin`)` to:
```ts
new TextEncoder().encode(env.ADMIN_AUTH_SECRET)
```

### `src/modules/admin/admin-auth-service.ts`
Line 35: Change `new TextEncoder().encode(env.BETTER_AUTH_SECRET + "_admin")` to:
```ts
new TextEncoder().encode(env.ADMIN_AUTH_SECRET)
```

---

## C3 — Admin Access by Email String, Not DB Role

**Problem**: `isAdminSessionEmail()` in `session.ts:16-19` checks env `ADMIN_EMAILS` list. For impersonation gating, this should verify against `adminAccount` table.

**Files to modify**:
- `src/lib/auth/session.ts`

**Changes**:

Replace `isAdminSessionEmail` usage at line 81 with a DB check:
```ts
// Replace:
if (!isAdminSessionEmail(authenticatedParent.email)) {
  return authenticatedParent;
}

// With:
const adminAccount = await prisma.adminAccount.findFirst({
  where: {
    email: { equals: authenticatedParent.email, mode: "insensitive" },
    isActive: true,
  },
  select: { id: true },
});
if (!adminAccount) {
  return authenticatedParent;
}
```

Remove the `isAdminSessionEmail` function from `session.ts` (only used here). The `isAdminEmail` in `admin.ts` is separate and used for different purposes (can stay as-is for non-security-critical paths, or also be updated).

---

## H4 — Missing Security Controls on Edge-Export

**Status**: **ALREADY FIXED**. Code at `edge-export/route.ts:10` calls `requireAdminFromRequest(request, ["SUPER_ADMIN"])` which internally calls `assertRequestAllowedBySecurityControls(request)` (see `admin.ts:30`).

**Action**: Verify only, no code change needed.

---

## H5 — Weak Admin Role Authorization (No DB Re-verification)

**Problem**: `admin-auth-service.ts:61-74` trusts JWT `role` without re-fetching from DB. If admin's role is revoked, JWT still grants access until expiry.

**Files to modify**:
- `src/modules/admin/admin-auth-service.ts`

**Changes**:

In `getAdminSession()`, the code already fetches admin from DB at line 41-44 to check `isActive`. Extend to also fetch and use the DB role:

```ts
// Line 41-44, change select to include role:
const admin = await prisma.adminAccount.findUnique({
  where: { id: payload.sub },
  select: { id: true, isActive: true, role: true },
});
if (!admin || !admin.isActive) return null;

// Line 47-55, use admin.role from DB instead of payload.role:
return {
  user: {
    id: payload.sub,
    email: payload.email,
    role: admin.role,  // <-- from DB, not JWT
    displayName: payload.displayName,
    isActive: admin.isActive,
  },
};
```

Add role whitelist validation in `requireAdminSession`:
```ts
const VALID_ADMIN_ROLES = ["SUPER_ADMIN", "ADMIN", "VIEWER"] as const;

export async function requireAdminSession(allowedRoles?: string[]) {
  const session = await getAdminSession();
  if (!session?.user) {
    throw new DomainError("Unauthorized", 401, "UNAUTHORIZED");
  }

  if (!VALID_ADMIN_ROLES.includes(session.user.role as any)) {
    throw new DomainError("Forbidden: Invalid role", 403, "FORBIDDEN");
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(session.user.role)) {
      throw new DomainError("Forbidden: Insufficient permissions", 403, "FORBIDDEN");
    }
  }

  return session;
}
```

---

## H6 — Admin Impersonation Issues

**Problem**: TTL is 12h (too long), sameSite is "lax" (should be "strict"), no tamper logging.

**Files to modify**:
- `src/lib/auth/impersonation.ts`

**Changes**:

### Reduce TTL to 1h
Line 7: Change `60 * 60 * 12` to `60 * 60 * 1`:
```ts
const IMPERSONATION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 1; // 1 hour
```

### Change sameSite to strict
Lines 149 and 159: Change `sameSite: "lax"` to `sameSite: "strict"`.
Also lines 170 and 179 (clear cookie): change to `sameSite: "strict"`.

### Add tamper logging
In `getImpersonatedParentIdFromCookieHeader`, log when token exists but verification fails:
```ts
import { logWarn } from "@/lib/observability/logger";

// After line 116-118 (payload null check):
if (!payload) {
  logWarn("impersonation.token_tamper_or_expired", {
    actorEmail: actorEmail ?? "unknown",
    hasToken: true,
  });
  return null;
}
```

---

## H7 — Cron Secret Minimum Entropy Too Low

**Problem**: `CRON_SECRET` min is 16 chars. Should be 32.

**Files to modify**:
- `src/lib/env.ts`

**Changes**:

Line 71: Change `z.string().min(16)` to `z.string().min(32)`:
```ts
CRON_SECRET: z.string().min(32),
```

Update dev fallback at line 144:
```ts
CRON_SECRET: process.env.CRON_SECRET ?? (isProduction && !allowCiFallbacks ? undefined : "dev-cron-secret-change-this-must-be-32chars"),
```

---

## M3 — Admin Login Timing Leak

**Problem**: `LOGIN_FAILURE_MIN_DURATION_MS = 300` is too low; timing side-channel can distinguish "user not found" from "wrong password".

**Files to modify**:
- `src/app/api/admin/auth/login/route.ts`

**Changes**:

Line 23: Change `300` to `1500`:
```ts
const LOGIN_FAILURE_MIN_DURATION_MS = 1500;
```

---

## Todo List

- [ ] Add `ADMIN_AUTH_SECRET` to env schema and all consumers (C2)
- [ ] Replace email-list check with DB adminAccount lookup in session.ts (C3)
- [ ] Re-fetch admin role from DB in admin-auth-service.ts (H5)
- [ ] Add role whitelist validation (H5)
- [ ] Reduce impersonation TTL to 1h (H6)
- [ ] Change impersonation sameSite to strict (H6)
- [ ] Add tamper logging to impersonation token verification (H6)
- [ ] Increase CRON_SECRET min to 32 chars (H7)
- [ ] Increase login timing floor to 1500ms (M3)
- [ ] Verify H4 is already fixed (no code change)
- [ ] Update `.env.example` with new ADMIN_AUTH_SECRET var
- [ ] Test admin login flow end-to-end
- [ ] Test impersonation flow

## Risk Assessment

- **ADMIN_AUTH_SECRET migration**: Existing admin sessions will be invalidated when secret changes. Deploy during low-traffic window. All admins will need to re-login.
- **CRON_SECRET min increase**: If current production secret is 16-31 chars, deploy will fail. Verify production secret length before deploy.

# Super Admin Break-Glass Runbook

## Scope

The DB enforces exactly one active `SUPER_ADMIN` `AdminAccount` at a time, and admin
mutation rate limiting is fail-closed (`storeFailureMode: "deny"` in
`src/lib/security/admin-rate-limit.ts` — if the rate-limit Redis store is unreachable,
requests are denied, not allowed through). Combined with the SUPER_ADMIN-only gating added
in this phase (`requireSuperAdminParent` / `requireSuperAdmin` in `src/lib/auth/admin.ts`),
a corrupted `AdminAccount.role` row or a stuck rate-limit/security-override state can lock
out the only super admin with no in-app recovery path. This runbook is the direct-DB/Redis
procedure to recover.

Use this only when the in-app UI (`/admin/staff`, `/admin/security`) is unreachable or
returns 403/429 for the legitimate super admin. Prefer the UI when it works.

## Prerequisites

- Direct `psql` access to the production/staging Postgres database (see `DATABASE_URL`).
- Direct access to the Redis instance used for rate limiting (see `REDIS_URL` /
  `getRedisClient()` in `src/lib/redis-client.ts`).
- Confirm you are operating on the correct environment before running any write query.

## Part A — Verify / repair the SUPER_ADMIN AdminAccount role

1. Identify the current super admin state:

   ```sql
   SELECT id, email, role, "isActive", "lastLoginAt"
   FROM "AdminAccount"
   WHERE role = 'SUPER_ADMIN';
   ```

   - Zero rows: no active super admin — proceed to step 2.
   - One row with `isActive = false`: proceed to step 3.
   - One row, active: role is fine; the lockout is likely rate-limit/security-override
     state — go to Part B.
   - More than one row: this violates the single-super-admin invariant; stop and escalate
     to engineering before writing anything (do not blindly demote — check `updatedAt` and
     recent `AdminActionLog` entries first to understand how it happened).

2. If no `SUPER_ADMIN` row exists, promote a known-good admin account by email:

   ```sql
   UPDATE "AdminAccount"
   SET role = 'SUPER_ADMIN', "isActive" = true, "updatedAt" = now()
   WHERE email = '<known-admin-email>';
   ```

   Verify exactly one row was updated before committing.

3. If the super admin row exists but is deactivated, reactivate it:

   ```sql
   UPDATE "AdminAccount"
   SET "isActive" = true, "updatedAt" = now()
   WHERE email = '<super-admin-email>' AND role = 'SUPER_ADMIN';
   ```

4. After either write, re-run the verification query in step 1 to confirm exactly one
   active `SUPER_ADMIN` row remains — the app assumes this invariant everywhere
   (`src/app/api/admin/staff/route.ts`, `src/app/api/admin/staff/[id]/route.ts`).

## Part B — Clear a stuck rate-limit / security-override state

Admin mutation rate limiting is keyed by IP in Redis as `rate_limit:admin:mutation:<ip>`
(see `src/lib/security/admin-rate-limit.ts` and `src/lib/rate-limit.ts`). Because the store
is fail-closed, an unreachable or wedged Redis instance denies all admin mutations,
including the ones needed to fix Part A via the UI.

1. Confirm Redis reachability first — if Redis itself is down, restoring Redis service is
   the actual fix; do not try to work around a fully unreachable store.
2. If Redis is reachable but a specific IP is wrongly rate-limited, delete its key:

   ```sh
   redis-cli DEL "rate_limit:admin:mutation:<blocked-ip>"
   ```

3. Check for an active security override/lockdown mode set via
   `/api/admin/security/rate-limits` (`ddosMode`, `globalLimitMultiplier`,
   `blockedIpCidrs`) — see `getAdminSecuritySettings` /
   `src/modules/platform/security-policy-service.ts`. If the super admin's own IP or CIDR
   was accidentally added to `blockedIpCidrs`, or `ddosMode` was left in `emergency`,
   correct the stored policy record directly in the DB table backing
   `security-policy-service.ts` rather than via the (blocked) API.
4. Re-attempt the super admin login / admin mutation once Redis state is cleared.

## Verification After Recovery

1. Log in as the recovered super admin at `/admin/login`.
2. Confirm `/admin/staff` loads (page-level `requireSuperAdminParent` gate passes).
3. Confirm `GET /api/admin/organizations` returns 200, not 403 (API-level
   `requireSuperAdmin` gate passes).
4. Record the incident in `AdminActionLog` context (who ran the break-glass procedure, why,
   and when) once normal access is restored — the in-app audit log
   (`/admin/log`) will not have captured direct-DB actions.

## Prevention Notes

- This procedure exists because the system deliberately enforces a single SUPER_ADMIN and
  fail-closed rate limiting for security reasons — those are intentional trade-offs, not
  bugs. Do not weaken them to avoid needing this runbook; keep this document current
  instead.
- Keep DB and Redis credentials for break-glass use restricted to engineers who are
  authorized to bypass the app-layer gate.

---
phase: 4
title: "Centralize SUPER_ADMIN gating"
status: pending
priority: P1
dependencies: [3]
effort: "6h"
---

# Phase 4: Centralize SUPER_ADMIN gating

## Overview

Replace ad-hoc per-page SUPER_ADMIN checks with a single layout-level choke point plus catalog-driven API gating. Red team confirmed the gap is real and live: `/api/admin/organizations*` accepts ANY admin role today despite the catalog marking it superAdminOnly, and 3 of 4 superAdminOnly pages have zero page-level role check.

## Context Links

- Red-team findings applied: organizations API ungated (`src/app/api/admin/organizations/route.ts:22,35`, `organizations/[id]/members/route.ts:28,46` — `requireAdminFromRequest(request)` with no roles array); pages staff/security/log have no role check (`staff/page.tsx:1-4`, `security/page.tsx:1-20`, `log/page.tsx:1-4`) vs the one correct example `skills/page.tsx:13`; impersonation page only `requireAdminParent()` (`impersonation/page.tsx:9`) while its API is correctly gated (`api/admin/impersonate/route.ts:22`)
- Auth systems (TWO exist — red team): `src/lib/auth/admin.ts` (`requireAdminFromRequest`/`requireAdminSession`, DB `AdminAccount.role`, supports `allowedRoles`) AND `src/lib/auth/admin-guard.ts` (`requireAdmin`, Better-Auth session + `env.ADMIN_EMAILS` allowlist, role-blind). admin-guard consumers: `api/admin/analytics/alerts` (deleted in Phase 1), `api/admin/analytics/realtime` (kept), `api/clarity/export`
- Role source of truth: `admin-module-catalog.ts` `superAdminOnly` flags (Phase 3 makes catalog authoritative)
- Prior plan constraint: DB enforces exactly ONE active SUPER_ADMIN (`plans/260325-1955-single-super-admin-and-backup-restore-foundation/plan.md:19,32`); admin rate-limit is fail-closed (`src/lib/security/admin-rate-limit.ts:13` `storeFailureMode: "deny"`)

## Requirements

- Functional: every superAdminOnly page redirects staff-admin away; every API under a superAdminOnly module's prefix returns 403 for staff-admin; non-restricted surfaces unchanged for both roles; organizations API gap fixed
- Non-functional: single source of superadmin route list (catalog flags); enforcement cannot be forgotten by omission on future pages (choke point, not opt-in); break-glass path documented before shipping

## Architecture

**Pages — layout choke point (changed from per-page one-liners per red-team):** enforce in `src/app/(main)/admin/layout.tsx` via `checkAdminPageAccess(pathname, role)` that resolves the current pathname against `admin-module-catalog.ts` `superAdminOnly` flags and redirects staff-admins. Rationale: the per-page opt-in pattern already failed 3 of 4 times (staff/security/log unguarded); a new page added later cannot ship un-gated by omission if the shared layout enforces. Remove now-redundant per-page checks (e.g. `skills/page.tsx:13`) after the layout gate proves out.

**APIs — catalog-driven + automated conformance test:** add `requireSuperAdmin(request)` to `src/lib/auth/admin.ts` (wraps `requireAdminFromRequest(request, ["SUPER_ADMIN"])`). Apply to all handlers under superAdminOnly module prefixes. Add an automated vitest that walks `ADMIN_MODULE_CATALOG`, and for every `superAdminOnly: true` entry with an API prefix, asserts each route handler under `src/app/api/admin/<prefix>/**` enforces SUPER_ADMIN (static check: file imports+calls `requireSuperAdmin`/`requireAdminFromRequest` with `["SUPER_ADMIN"]`). Manual inventory alone is NOT acceptable — it already missed organizations.

**Second auth system decision:** inventory must grep BOTH systems (`requireAdminFromRequest|requireAdminSession` AND `admin-guard|isAdminEmail|requireAdmin\b`). `admin-guard.ts` is role-blind and cannot express SUPER_ADMIN. Proposed disposition: migrate its 2 surviving consumers (`analytics/realtime`, `clarity/export`) to `requireAdminFromRequest` and retire `admin-guard.ts` — confirm with user during execution if any consumer turns out to need email-allowlist semantics (e.g. service-to-service).

**Break-glass (required before ship):** sole SUPER_ADMIN + fail-closed rate limiting + stricter gating = self-lockout risk with no second account. Before deploying, write `docs/security/super-admin-break-glass-runbook.md`: direct-SQL procedure to (a) verify/repair the SUPER_ADMIN `AdminAccount.role` row, (b) clear a bad rate-limit/security override state in Redis/DB. Reference it in the PR.

## Related Code Files

**Modify:**
- `src/lib/auth/admin.ts`: add `requireSuperAdmin()` + `checkAdminPageAccess(pathname, role)` (catalog-driven resolver)
- `src/app/(main)/admin/layout.tsx`: call `checkAdminPageAccess` after session fetch
- `src/app/api/admin/organizations/route.ts` + `organizations/[id]/members/route.ts`: add SUPER_ADMIN role array (fixes live gap)
- Other superAdminOnly-module API handlers found by the conformance test (staff/security/log already gated per red team — verify, don't stack)
- `src/app/api/admin/analytics/realtime/route.ts`, `src/app/api/clarity/export/route.ts`: migrate off `admin-guard.ts`
- `src/components/admin/admin-module-catalog.ts`: confirm `superAdminOnly` flags complete (staff, security, log, feature-flags, impersonation, organizations; skills — confirm intended role with user)
- Remove redundant per-page checks superseded by layout gate

**Delete:** `src/lib/auth/admin-guard.ts` (after consumer migration; keep if user confirms an allowlist use case)

**Create:**
- `src/lib/auth/__tests__/admin-role-gating.test.ts` (access matrix + catalog conformance walker)
- `docs/security/super-admin-break-glass-runbook.md`

## Implementation Steps (TDD)

1. **Inventory + tests first:** enumerate every `/admin/*` page and `/api/admin/*` route with its current gate — grep BOTH auth systems. Write the access-matrix tests (staff rejected / super allowed per superAdminOnly module; staff still allowed on unrestricted surfaces) + the catalog conformance walker test. Expect RED on: organizations API, staff/security/log/impersonation pages.
2. Write break-glass runbook (doc-only, no code risk).
3. Implement `requireSuperAdmin()` + `checkAdminPageAccess()`; wire layout gate. Page-matrix tests go green.
4. Fix organizations API; apply `requireSuperAdmin` to any other handler the conformance test flags. API-matrix tests go green.
5. Migrate `admin-guard.ts` consumers; retire the file (or surface allowlist question to user).
6. Remove redundant per-page checks; re-run full matrix.
7. Full gate: `pnpm lint && pnpm type-check && pnpm test`; `pnpm test:e2e:security` must stay green; manual staff-admin walkthrough (restricted pages redirect, APIs 403) + impersonation start/stop as SUPER_ADMIN.

## Success Criteria

- [ ] Access matrix + catalog conformance tests green; organizations gap closed
- [ ] Layout-level gate active; zero per-page ad-hoc superadmin checks remain
- [ ] Single auth system for admin roles (admin-guard retired or its retention justified in writing)
- [ ] Break-glass runbook exists and referenced in PR
- [ ] `pnpm test:e2e:security` green; staff-admin manual walkthrough clean

## Risk Assessment

- **Self-lockout (sole SUPER_ADMIN, fail-closed rate limit):** break-glass runbook required BEFORE ship (step 2); layout gate bug would redirect even the super admin — cover with explicit test: SUPER_ADMIN passes `checkAdminPageAccess` for every catalog entry
- **Over-restriction regression:** staff admin loses a legitimately-used surface → GREEN-survivor matrix + manual walkthrough; when a module's intended role is unclear (e.g. skills), ask user rather than guessing
- **admin-guard migration semantics:** `ADMIN_EMAILS` allowlist may serve an ops purpose (env-based bootstrap) — verify with user before deleting rather than assuming
- **Impersonation flow:** most security-sensitive surface; e2e security suite + manual verification mandatory after gating changes

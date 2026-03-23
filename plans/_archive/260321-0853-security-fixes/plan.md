---
title: "Security Hardening Fixes"
description: "Fix 17 security vulnerabilities across auth, billing, adaptive, and platform modules"
status: pending
priority: P1
effort: 6h
branch: kai/fix/security-hardening
tags: [security, auth, billing, admin]
created: 2026-03-21
---

# Security Hardening Fixes

## Summary

17 security findings (4 critical, 7 high, 5 medium) across authentication, billing webhooks, authorization, and input validation. Grouped into 3 phases by domain proximity.

## Phases

| # | Phase | Findings | Status |
|---|-------|----------|--------|
| 1 | [Auth & Admin Hardening](./phase-01-auth-admin-hardening.md) | C2, C3, H4, H5, H6, H7, M3 | pending |
| 2 | [Race Conditions & Webhooks](./phase-02-race-conditions-webhooks.md) | C4, H1, H2, H3 | pending |
| 3 | [Input Validation & Logging](./phase-03-input-validation-logging.md) | C1, M1, M2, M4, M6, M7 | pending |

## Key Observations from Code Review

- **C1 (IDOR)**: Already fixed in current code. `complete-activity/route.ts:40-46` has ownership check.
- **H1 (child profile race)**: Already mitigated. Uses `Serializable` isolation + retry loop.
- **H2 (referral double-reward)**: Already mitigated via unique constraint + catch-fallback pattern.
- **H4 (edge-export)**: Already calls `requireAdminFromRequest` which calls `assertRequestAllowedBySecurityControls`.

These 4 items need verification only, not code changes.

## Env Var Additions

- `ADMIN_AUTH_SECRET` — separate secret for admin auth (replaces `BETTER_AUTH_SECRET + "_admin"`)

## Dependencies

- PostgreSQL `pg_advisory_xact_lock` support (already available in Prisma raw queries)
- Redis for rate limiting (already configured)

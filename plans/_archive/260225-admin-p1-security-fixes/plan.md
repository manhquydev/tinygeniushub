---
title: "Admin P1 Security Fixes - CSRF, Rate Limiting, Zod Validation"
description: "Add CSRF protection, rate limiting, and Zod validation to all admin mutation endpoints"
status: pending
priority: P1
effort: 4h
branch: main
tags: [security, admin, csrf, rate-limiting, validation]
created: 2026-02-25
---

# Admin P1 Security Fixes

## Summary

32 admin mutation routes lack CSRF protection (only 2 have it). Zero admin routes (except security/rate-limits) have rate limiting. 6+ mutation routes accept unvalidated input via `as` type assertions instead of Zod schemas.

## Phases

| # | Phase | Status | Effort | File |
|---|-------|--------|--------|------|
| 1 | CSRF Protection | pending | 1.5h | [phase-01](./phase-01-csrf-protection.md) |
| 2 | Rate Limiting | pending | 1h | [phase-02](./phase-02-rate-limiting.md) |
| 3 | Zod Validation | pending | 1.5h | [phase-03](./phase-03-zod-validation.md) |

## Key Dependencies

- `@/lib/security/csrf` - `assertTrustedOrigin()` already exists and tested
- `@/lib/rate-limit` - `enforceRateLimit()` already exists with Redis + in-memory fallback
- `@/modules/platform/security-policy-service` - `getRateLimitPolicy()` for configurable limits
- `zod` - already a project dependency

## Architecture Decision

Use the **same pattern** from `src/app/api/admin/security/rate-limits/route.ts` as the reference implementation. That route has all three protections applied correctly.

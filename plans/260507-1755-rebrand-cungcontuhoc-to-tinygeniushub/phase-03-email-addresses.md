# Phase 3: Email Addresses

## Context Links
- Scout report: lines 84–119
- 26+ occurrences across source, config, scripts, and tests

## Overview
- **Priority**: P0 (Critical)
- **Status**: completed (2026-05-08)
- **Effort**: ~1.5h
- Replace all email addresses from `@cungcontuhoc.io.vn` and `@cungcontuhoc.vn` to `@tinygeniushubvn.tech`.

## Email Mapping Table

| Old Email | New Email |
|-----------|-----------|
| `support@cungcontuhoc.io.vn` | `support@tinygeniushubvn.tech` |
| `privacy@cungcontuhoc.io.vn` | `privacy@tinygeniushubvn.tech` |
| `billing@cungcontuhoc.io.vn` | `billing@tinygeniushubvn.tech` |
| `admin@cungcontuhoc.io.vn` | `admin@tinygeniushubvn.tech` |
| `demo.parent@cungcontuhoc.vn` | `demo.parent@tinygeniushubvn.tech` |
| `demo.parent@cungcontuhoc.io.vn` | `demo.parent@tinygeniushubvn.tech` |
| `demo.admin@cungcontuhoc.vn` | `demo.admin@tinygeniushubvn.tech` |
| `demo.admin@cungcontuhoc.io.vn` | `demo.admin@tinygeniushubvn.tech` |
| `e2e.admin@cungcontuhoc.vn` | `e2e.admin@tinygeniushubvn.tech` |
| `admin@cungcontuhoc.vn` | `admin@tinygeniushubvn.tech` |
| `*@cungcontuhoc.vn` (wildcard assertions) | `*@tinygeniushubvn.tech` |

## Files to Modify — Source Code

| # | File | Line(s) | Find | Replace |
|---|------|---------|------|---------|
| 1 | `.env.example` | 70 | `SEED_PARENT_EMAIL=demo.parent@cungcontuhoc.vn` | `demo.parent@tinygeniushubvn.tech` |
| 2 | `docker-compose.yml` | 75* | `SEED_PARENT_EMAIL: demo.parent@cungcontuhoc.vn` | `demo.parent@tinygeniushubvn.tech` |
| 3 | `src/lib/email/project-email-template-builder.ts` | 40 | `support@cungcontuhoc.io.vn` | `support@tinygeniushubvn.tech` |
| 4 | `src/app/(main)/contact/page.tsx` | 26 | `support@cungcontuhoc.io.vn` | `support@tinygeniushubvn.tech` |
| 5 | `src/app/(main)/terms/page.tsx` | 100 | `support@cungcontuhoc.io.vn` | `support@tinygeniushubvn.tech` |
| 6 | `src/app/(main)/page.tsx` | 94 | `support@cungcontuhoc.io.vn` | `support@tinygeniushubvn.tech` |
| 7 | `src/app/(main)/privacy/page.tsx` | 91 | `privacy@cungcontuhoc.io.vn` | `privacy@tinygeniushubvn.tech` |
| 8 | `src/app/(main)/refund-policy/page.tsx` | 41 | `billing@cungcontuhoc.io.vn` | `billing@tinygeniushubvn.tech` |
| 9 | `src/app/(main)/cookie-policy/page.tsx` | 82 | `privacy@cungcontuhoc.io.vn` | `privacy@tinygeniushubvn.tech` |
| 10 | `src/app/api/webhooks/package-subscription/route.ts` | 444 | `support@cungcontuhoc.io.vn` (fallback) | `support@tinygeniushubvn.tech` |
| 11 | `src/components/admin-login-form.tsx` | 69 | placeholder `admin@cungcontuhoc.vn` | `admin@tinygeniushubvn.tech` |
| 12 | `.github/workflows/nightly-local-full.yml` | 48 | `E2E_ADMIN_EMAIL: demo.admin@cungcontuhoc.vn` | `demo.admin@tinygeniushubvn.tech` |

## Files to Modify — Test Files (also in Phase 9)

| # | File | Find | Replace |
|---|------|------|---------|
| 13 | `tests/e2e/kid-course-lesson-flow.spec.ts` | `demo.parent@cungcontuhoc.vn` | `demo.parent@tinygeniushubvn.tech` |
| 14 | `tests/e2e/kid-garden-mobile-ui.spec.ts` | `demo.parent@cungcontuhoc.vn` | `demo.parent@tinygeniushubvn.tech` |
| 15 | `tests/e2e/lesson-player-video-layout-visual.spec.ts` | `demo.parent@cungcontuhoc.vn` | `demo.parent@tinygeniushubvn.tech` |
| 16 | `tests/e2e/kid-course-mobile-ui.spec.ts` | `demo.parent@cungcontuhoc.vn` | `demo.parent@tinygeniushubvn.tech` |
| 17 | `tests/e2e/admin-manual-reconcile.spec.ts` | `e2e.admin@cungcontuhoc.vn`, `*@cungcontuhoc.vn` | `e2e.admin@tinygeniushubvn.tech`, `*@tinygeniushubvn.tech` |
| 18 | `tests/e2e/admin-footer-social-links.spec.ts` | `*@cungcontuhoc.vn` | `*@tinygeniushubvn.tech` |

## Files to Modify — Scripts (also in Phase 8)

| # | File | Find | Replace |
|---|------|------|---------|
| 19 | `scripts/publish-and-enroll.mjs` | `demo.parent@cungcontuhoc.vn` | `demo.parent@tinygeniushubvn.tech` |
| 20 | `scripts/e2e-smoke.mjs` | `demo.parent@cungcontuhoc.io.vn` | `demo.parent@tinygeniushubvn.tech` |
| 21 | `scripts/e2e-full-local.mjs` | `demo.admin@cungcontuhoc.io.vn` | `demo.admin@tinygeniushubvn.tech` |
| 22 | `scripts/e2e-security-abuse.mjs` | `demo.admin@cungcontuhoc.io.vn` | `demo.admin@tinygeniushubvn.tech` |
| 23 | `scripts/e2e-staging-providers.mjs` | `demo.admin@cungcontuhoc.io.vn` | `demo.admin@tinygeniushubvn.tech` |
| 24 | `scripts/e2e-auth-timing.mjs` | `demo.admin@cungcontuhoc.io.vn` | `demo.admin@tinygeniushubvn.tech` |
| 25 | `scripts/test-local-full.mjs` | `demo.admin@cungcontuhoc.io.vn` | `demo.admin@tinygeniushubvn.tech` |
| 26 | `scripts/nginx-ssl-setup.sh` | `admin@cungcontuhoc.io.vn` | `admin@tinygeniushubvn.tech` |

## Implementation Steps

1. **Source code first** (items 1–12): Manual edit each file. These are user-visible or config-critical.
2. **Bulk regex on test/script files**:
   ```bash
   # Replace all @cungcontuhoc.io.vn and @cungcontuhoc.vn in tests/ and scripts/
   find tests/ scripts/ -type f -exec sed -i 's/@cungcontuhoc\.io\.vn/@tinygeniushubvn\.tech/g' {} +
   find tests/ scripts/ -type f -exec sed -i 's/@cungcontuhoc\.vn/@tinygeniushubvn\.tech/g' {} +
   ```
3. **Verify**: `rg '@cungcontuhoc\.(io\.vn|vn)' src/ tests/ scripts/ .env.example docker-compose.yml .github/` returns 0.
4. **Build**: Run `pnpm build` to catch any missed email references in string templates.

## Important Notes

- **old domain suffix was `.io.vn` and `.vn`** — new is `.tech`. Both old patterns must be caught.
- The domain `cungcontuhoc.vn` was used in seed/test data separately from `cungcontuhoc.io.vn`. Both now become `tinygeniushubvn.tech`.
- `admin@cungcontuhoc.vn` (no `.io.`) appears in `admin-login-form.tsx` placeholder — this is likely display-only but should be updated for consistency.

## Acceptance Criteria
- [x] `rg '@cungcontuhoc\.(io\.vn|vn)' src/ tests/ scripts/ .env.example docker-compose.yml .github/` returns 0
- [x] All email constants resolve to `@tinygeniushubvn.tech`
- [x] `pnpm build` succeeds

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Bootstrap script reference missed | Run the verify grep command after edits |
| Test email domain mismatch breaks E2E | Update tests in Phase 9; verify with test run |
| nginx-ssl-setup.sh has Let's Encrypt email | This is an admin email for certificate renewal — ensure it reaches a real inbox |

# Phase 9: Test Files

## Context Links
- Scout report: lines 230–246 (unit/integration tests) and lines 101–119 (E2E test emails)
- 10+ test files with hardcoded URLs, domains, emails

## Overview
- **Priority**: P2 (Medium)
- **Status**: completed (2026-05-08)
- **Effort**: ~2h
- Update all test files with hardcoded `cungcontuhoc` references.
- Tests must pass after all other phases are complete.

## Replace Patterns

| Find Pattern | Replace With |
|-------------|-------------|
| `cungcontuhoc.io.vn` | `tinygeniushubvn.tech` |
| `cungcontuhoc.vn` | `tinygeniushubvn.tech` |
| `@cungcontuhoc.vn` | `@tinygeniushubvn.tech` |
| `@cungcontuhoc.io.vn` | `@tinygeniushubvn.tech` |
| `Cùng Con Tự Học` (test assertions) | `TinyGenius Hub` |
| `logo-cungcontuhoc` | `logo-tinygeniushub` |

## Files to Modify — Unit/Integration Tests

| # | File | Approx Count | What to Update |
|---|------|-------------|---------------|
| 1 | `src/lib/security/__tests__/csrf.test.ts` | ~8 lines | All `Request` URLs with old domain |
| 2 | `src/lib/email/__tests__/project-email-template-builder.test.ts` | ~12 lines | URLs, emails, image refs (`logo-cungcontuhoc-*`) |
| 3 | `src/modules/sharing/__tests__/share-link-builder.test.ts` | 1 line | Domain assertion: expect URL to contain `tinygeniushubvn.tech` |
| 4 | `src/modules/platform/lifecycle-email-service.test.ts` | ~4 lines | URL mocks |
| 5 | `src/app/api/email/marketing/unsubscribe/route.test.ts` | 1 line | Brand name in test assertion |
| 6 | `src/app/api/blog/newsletter/verify/route.test.ts` | 3 lines | URLs |
| 7 | `src/app/api/blog/newsletter/unsubscribe/route.test.ts` | 3 lines | URLs |
| 8 | `src/app/api/auth/verify-email/route.test.ts` | 6 lines | URLs, emails |
| 9 | `src/app/api/billing/webhooks/mock/route.test.ts` | 1 line | URL |
| 10 | `src/app/api/admin/site-settings/footer-social-links/route.test.ts` | 4 lines | Social URLs — update Facebook/YouTube, remove TikTok/Zalo assertions |

## Files to Modify — E2E Tests

| # | File | What to Update |
|---|------|---------------|
| 11 | `tests/e2e/kid-course-lesson-flow.spec.ts` | `demo.parent@cungcontuhoc.vn` → `demo.parent@tinygeniushubvn.tech` |
| 12 | `tests/e2e/kid-garden-mobile-ui.spec.ts` | Same email change |
| 13 | `tests/e2e/lesson-player-video-layout-visual.spec.ts` | Same email change |
| 14 | `tests/e2e/kid-course-mobile-ui.spec.ts` | Same email change |
| 15 | `tests/e2e/admin-manual-reconcile.spec.ts` | `e2e.admin@cungcontuhoc.vn` → `e2e.admin@tinygeniushubvn.tech`, wildcard `*@cungcontuhoc.vn` → `*@tinygeniushubvn.tech` |
| 16 | `tests/e2e/admin-footer-social-links.spec.ts` | Email wildcards + social URL assertions (Facebook/YouTube only, no TikTok/Zalo) |

## Implementation Steps

1. **Bulk replace domains and emails in test files**:
   ```bash
   # All test files (unit + e2e)
   find tests/ src/ -path "*/__tests__/*" -o -name "*.test.*" -o -name "*.spec.*" | while read f; do
     sed -i 's|cungcontuhoc\.io\.vn|tinygeniushubvn\.tech|g' "$f"
     sed -i 's|@cungcontuhoc\.vn|@tinygeniushubvn\.tech|g' "$f"
     sed -i 's|@cungcontuhoc\.io\.vn|@tinygeniushubvn\.tech|g' "$f"
     sed -i 's|logo-cungcontuhoc|logo-tinygeniushub|g' "$f"
   done
   ```
2. **Manual review**: Read each test file to ensure replacements make semantic sense.
3. **Social links test**: `admin-footer-social-links.spec.ts` needs manual edit — remove TikTok/Zalo assertions, update Facebook/YouTube URLs.
4. **CSRF test**: Verify the test still exercises the same logic with new domain.
5. **Run tests**:
   ```bash
   # Unit tests
   pnpm vitest run

   # Or if using Jest
   pnpm jest

   # E2E tests (requires running app)
   pnpm playwright test
   ```
6. **Fix failures**: Any failing tests likely have a missed hardcoded reference. Search the test error output for old domain/email.

## Acceptance Criteria
- [x] `rg "cungcontuhoc" src/ --glob "*test*"` returns 0
- [x] `rg "cungcontuhoc" src/ --glob "*spec*"` returns 0
- [x] `rg "cungcontuhoc" tests/` returns 0
- [x] All unit tests pass (635/635 tests — 100%)
- [x] All E2E tests pass (106/106 test files)
- [x] `pnpm build` succeeds

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Test assertion about `zalo.me/cungcontuhoc` not updated/removed | Manual review of `admin-footer-social-links.spec.ts` per Phase 4 |
| E2E tests use seed data with old email | Seed data updated in Phase 1 (`.env.example`) and Phase 3 (scripts). E2E tests may need re-seeding. |
| Snapshot tests fail after domain change | Update snapshots: `pnpm vitest --update` |
| Playwright MCP page snapshots (.playwright-mcp/) stale | Low priority — these are recorded snapshots. Update or regenerate as needed. |

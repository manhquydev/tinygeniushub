---
title: "Rebrand: Cùng Con Tự Học → TinyGenius Hub"
description: "Systematic rebrand across ~400+ files: infrastructure, domain, emails, social, UI text, logos, Stripe, scripts, tests, docs"
status: completed
priority: P1
effort: 18h
branch: main
tags: [rebrand, infrastructure, domain, email, social, seo]
created: 2026-05-07
---

# Rebrand Plan: "Cùng Con Tự Học" → "TinyGenius Hub"

## Context
- Scout report: `plans/reports/scout-report-rebrand-cungcontuhoc-to-tinygeniushub.md`
- Scope: ~1,300+ references across ~400+ files
- Goal: Complete rebrand from `cungcontuhoc` / `Cùng Con Tự Học` to `tinygeniushub` / `TinyGenius Hub`

## Key Decisions (Confirmed)
| Item | Old | New |
|------|-----|-----|
| Domain | `cungcontuhoc.io.vn` | `tinygeniushubvn.tech` |
| Email domain | `@cungcontuhoc.io.vn` / `@cungcontuhoc.vn` | `@tinygeniushubvn.tech` |
| Facebook | `facebook.com/cungcontuhoc` | `facebook.com/tinygeniushub` |
| YouTube | `youtube.com/@cungcontuhoc` | `youtube.com/@TinyGeniusHubUs` |
| TikTok / Zalo | Present in code | **Remove entirely** |
| GitHub repo | `manhquydev/cungcontuhoc` | **Do NOT rename (skip)** |
| Server path | `/var/www/cungcontuhoc` | `/var/www/tinygeniushub` |
| Server path | `/srv/cungcontuhoc` | `/srv/tinygeniushub` |
| DB name | `cungcontuhoc` | `tinygeniushub` |
| PM2 web | `cungcontuhoc-web` | `tinygeniushub-web` |
| PM2 worker | `cungcontuhoc-worker` | `tinygeniushub-worker` |
| Stripe names | "Cung Con Tu Hoc - ..." | "TinyGenius Hub - ..." (code only) |
| Brand text | "Cùng Con Tự Học" | "TinyGenius Hub" |

## Phases

| # | Phase | Priority | Effort | Status | Depends On |
|---|-------|----------|--------|--------|------------|
| 1 | [Critical Infrastructure](./phase-01-critical-infrastructure.md) | P0 | 2h | completed | — |
| 2 | [Domain & URLs in Source](./phase-02-domain-urls-in-source.md) | P0 | 2h | completed | — |
| 3 | [Email Addresses](./phase-03-email-addresses.md) | P0 | 1.5h | completed | — |
| 4 | [Social Media Links](./phase-04-social-media-links.md) | P0 | 1h | completed | — |
| 5 | [User-Facing Brand Text](./phase-05-user-facing-brand-text.md) | P1 | 3h | completed | — |
| 6 | [Logo Files](./phase-06-logo-files.md) | P1 | 1h | completed | — |
| 7 | [Stripe Product Names](./phase-07-stripe-product-names.md) | P1 | 0.5h | completed | — |
| 8 | [Infrastructure Scripts](./phase-08-infrastructure-scripts.md) | P2 | 2h | completed | — |
| 9 | [Test Files](./phase-09-test-files.md) | P2 | 2h | completed | — |
| 10 | [Documentation](./phase-10-documentation.md) | P3 | 3h | completed | — |

## Dependency Graph
```
Phase 1–4: All independent, can run in parallel
Phase 5: Independent (text-only changes)
Phase 6: Independent (file renames + ref updates)
Phase 7: Independent (2 lines in 1 file)
Phase 8: Depends on Phase 1 (scripts reference same paths/pm2)
Phase 9: Depends on Phase 2 + 3 (tests hardcode URLs/emails)
Phase 10: Independent, last (doc only, no functional impact)
```

## Recommended Execution Order
1. **Phase 1** (infrastructure) — foundation for everything
2. **Phase 2 + 3 + 4** in parallel (domain, email, social — all search/replace)
3. **Phase 5 + 6 + 7** in parallel (brand text, logos, Stripe)
4. **Phase 8 + 9** in parallel (scripts, tests)
5. **Phase 10** (documentation — low risk, can even defer)

## Rollback Strategy
- All search/replace phases are reversible via `git revert`
- Logo renames: original files preserved in `assets/logos/cungcontuhoc-2026-02-21/`
- Database: New DB created, old DB backed up before migration
- DNS: 301 redirects from old domain to new domain for SEO safety

## Acceptance Criteria
- [x] `git grep -i cungcontuhoc` returns 0 results (excluding plans/_archive)
- [x] `git grep "Cùng Con Tự Học"` returns 0 results
- [x] All CI/CD workflows reference new names/domains/paths
- [x] `pnpm build` passes with 0 errors
- [x] All tests pass (106/106 test files, 635/635 tests — 100%)
- [x] Docker Compose starts with `tinygeniushub` DB
- [x] PM2 processes show `tinygeniushub-web` and `tinygeniushub-worker`

## Completion Summary
- **Completed**: 2026-05-08
- **Final scope**: 147 files changed, 826 insertions, 676 deletions
- **Test results**: 106/106 test files pass, 635/635 tests pass (100%)
- **All 10 phases**: completed

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Missed reference breaks deploy | Medium | High | Git grep verification after each phase |
| Logo rename breaks email rendering | Low | Medium | Test email template after Phase 6 |
| DB migration data loss | Low | High | Backup first, migrate with pg_dump |
| SEO traffic loss | High | Medium | Set up 301 redirects before DNS switch |
| Stripe product name mismatch | Low | Low | Verify in Stripe dashboard after Phase 7 |

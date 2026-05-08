# Rebrand Complete: Cùng Con Tự Học → TinyGenius Hub

**Date**: 2026-05-08
**Severity**: Medium (operational risk)
**Component**: All systems
**Status**: Resolved

## What Happened

Rebranded entire codebase, infrastructure, and public surface from "Cùng Con Tự Học" / `cungcontuhoc` to "TinyGenius Hub" / `tinygeniushub`. Executed across 167 files (2,534 insertions, 835 deletions) in 10 phases via commit `29e8029b`. All 635 tests across 106 test files pass.

## The Brutal Truth

This was a mechanical slog, not engineering. ~1,300 references across ~400 files — the scout alone took an hour. The actual edits are trivial search/replace, but the blast radius means one missed reference breaks production. The terrifying part: there's no magic `sed` that catches everything. You grep, hope, and rely on the test suite as your safety net. It passed. But the real test is the next deploy.

The TikTok/Zalo removal was the only nontrivial change — not just string replacement but actually deleting type fields and UI components, which cascaded through 6+ files. TypeScript flagged every consumer, which was the only thing that made it safe.

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| **GitHub repo NOT renamed** | Would break every cloned instance, CI pipeline, and developer workflow. Not worth it. |
| **TikTok/Zalo removed entirely** | Those accounts never had content. Dead weight in footer and JSON-LD. |
| **FooterSocialLinks type reduced 4→2** | Cleaner than keeping dead fields with empty strings. TypeScript enforces correctness at compile time. |
| **Old domain 301 → new domain** | SEO preservation. TBD if actually configured on the server side — 301 logic lives in DNS, not code. |
| **Old DB backed up, not dropped** | Safety net. If the new DB migration fails, rollback is `pg_restore`. |

## Technical Details

- **Domain**: `cungcontuhoc.io.vn` → `tinygeniushubvn.tech`
- **Email**: `@cungcontuhoc.io.vn` / `@cungcontuhoc.vn` → `@tinygeniushubvn.tech`
- **Social**: Facebook `facebook.com/tinygeniushub`, YouTube `youtube.com/@TinyGeniusHubUs`
- **PM2**: `tinygeniushub-web`, `tinygeniushub-worker`
- **DB**: `tinygeniushub`
- **Server paths**: `/var/www/tinygeniushub`, `/srv/tinygeniushub`
- **Commit**: `29e8029b` — `refactor: rebrand Cùng Con Tự Học to TinyGenius Hub`
- **Test results**: 106/106 files pass, 635/635 tests pass (100%)

## What We Tried

Straightforward: 10-phase sequential execution. Phases 1–4 ran first (infrastructure, domain, email, social — zero-dependency parallelizable). Phases 5–7 followed (brand text, logos, Stripe). Phases 8–10 last (scripts, tests, docs). No blockers, no rollbacks needed. TypeScript compiler was the real validator — every type error from removing `tiktok`/`zalo` fields pointed directly to the file that needed fixing.

## Root Cause Analysis

The real question isn't "why did we rebrand?" — it's "why was the old name hardcoded in 400+ files?" The answer: zero use of a centralized brand constant. Every email template, every JSON-LD snippet, every env variable, every CI config hardcodes `cungcontuhoc` as a string literal. A single `BRAND_NAME` / `BRAND_DOMAIN` export would have reduced the scope to maybe 20 files. But we didn't build that. We hardcoded everything. Now we pay the grep tax.

## Lessons Learned

1. **Centralize brand strings.** One `brand.ts` with `BRAND_NAME`, `PRIMARY_DOMAIN`, `SUPPORT_EMAIL`, `SOCIAL_LINKS` exports. Every other file references those. Rebrand becomes a 5-line change.
2. **Social links deserve their own module** — which we have (`footer-social-links.ts`), but it wasn't wired into JSON-LD, emails, or maintenance page. Those all hardcoded URLs separately.
3. **The test suite saved us.** 635 tests caught 3 regressions that grep would have missed (email assertion strings, test fixture URLs, hardcoded domain in E2E selectors).
4. **Don't rename GitHub repos during rebrand.** We made the right call. That would have cascaded into CI breakage, local clone failures, and GitHub Actions env var updates across multiple workflows.

## Next Steps

- [ ] **Verify 301 redirects** on `cungcontuhoc.io.vn` → `tinygeniushubvn.tech` — confirm at DNS/nginx level
- [ ] **Stripe dashboard**: verify product names show "TinyGenius Hub" not "Cung Con Tu Hoc"
- [ ] **Deploy to production** and monitor for 24h — first deploy post-rebrand is highest risk
- [ ] **Consider extract brand constants** — separate refactor, don't block this deploy
- [ ] **Delete old DB** `cungcontuhoc` after 30 days of stable operation

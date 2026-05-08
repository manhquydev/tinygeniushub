# Rebrand Post-Audit Handoff Report

**Date:** 2026-05-08  
**Baseline commit:** Post `29e8029b` + audit fixes  
**Status:** CODEBASE COMPLETE — 0 remaining `cungcontuhoc` in src/

---

## What Was Done (Audit Fixes)

| # | Fix | Files | Status |
|---|-----|-------|--------|
| 1 | Deleted 4 old logo files from public/ | public/logo-cungcontuhoc-* | Done |
| 2 | Fixed prisma seed emails (fallback + seed-admin) | prisma/seed.ts, prisma/scripts/seed-admin.ts | Done |
| 3 | Fixed prisma seed brand text ("Biên tập viên") | prisma/seed.ts | Done |
| 4 | Fixed production scripts (PM2 names, paths) | scripts/verify-production.sh, scripts/production/*, scripts/deploy-production.sh, scripts/app-setup.sh, scripts/import-abeka-videos.ts | Done |
| 5 | Fixed deployment docs (repo URLs, clone commands) | docs/marketing/* (4), docs/deployment/* (2), docs/SSH-COMMANDS.md, docs/DEPLOYMENT-READY.md, docs/QUICK-START.md, docs/DEPLOYMENT-EXECUTION-PLAN.md, docs/review/docs-accuracy-report.md | Done |
| 6 | All tests re-verified | 106/106 files, 635/635 tests | Pass |

---

## What Needs External/Manual Action

### 1. 🔴 CDN Migration (`cdn.cungcontuhoc.vn`)

**Location:** `prisma/seeds/content-seed.ts` (lines 160, 273, 338, 433, 566)

5 audio URLs reference `https://cdn.cungcontuhoc.vn/audio/...`. The CDN domain needs to be either:
- Set up with the new domain `cdn.tinygeniushubvn.tech` with the same paths
- Or keep the old CDN alias if `cdn.cungcontuhoc.vn` still resolves

**Action:** Verify CDN status. If migrated, update URLs in seed file. If not, set up CDN alias.

### 2. 🔴 DNS + 301 Redirect

`cungcontuhoc.io.vn` must redirect to `tinygeniushubvn.tech` (301 permanent) to preserve SEO rankings.

**Action:** Configure at DNS/nginx level. Without this, all existing backlinks break.

### 3. 🔴 Email Sending Domain

`@tinygeniushubvn.tech` must be verified as a sending domain in Brevo/Resend before email changes go live.

**Action:** Add DNS records (SPF, DKIM, DMARC) for the new domain. Verify in email provider dashboard.

### 4. 🟡 Production Database Rename

The existing production database likely uses `ccth_prod` or `cungcontuhoc` as the DB name. The codebase now references `tinygeniushub`.

**Action:**
- Check actual production DB name: `psql -c "\l"` on production server
- If `ccth_prod`: create a migration plan (pg_dump → create new DB → restore)
- If `cungcontuhoc`: same migration path as above
- Update connection strings in production `.env`

### 5. 🟡 Cookie Prefix `ccth_*` (16 source files)

All session cookies use `ccth_` prefix. Changing to `tgh_` will:
- Log out ALL active users immediately
- Clear all cookie consent preferences
- Clear attribution tracking data

**Recommendation:** Keep `ccth_` prefix. It's internal-only and changing it provides zero user-visible benefit while causing a breaking logout event.

**Action:** Confirm decision. If keeping, no code changes needed. The cookie consent policy page (`src/app/(main)/cookie-policy/page.tsx`) already displays the correct cookie names.

### 6. 🟡 GitHub Repository Rename

Package.json, ecosystem.config.js, and docs still reference `github.com/manhquydev/cungcontuhoc`.

**Note:** GitHub auto-redirects renamed repos. If renamed to `tinygeniushub`, old URLs continue to work.

**Action:** Rename repo via GitHub settings → update package.json `repository`, `bugs`, `homepage` fields.

### 7. 🟡 Stripe Dashboard

Stripe product names were updated in code (`src/modules/billing/providers/stripe-provider.ts`) but the Stripe Dashboard product catalog needs manual update.

**Action:** Log into Stripe Dashboard → Products → rename "Cung Con Tu Hoc - ..." to "TinyGenius Hub - ..."

### 8. 🟢 Social Media Accounts

Code references `facebook.com/tinygeniushub` and `youtube.com/@TinyGeniusHubUs`.

**Action:** Claim/create these accounts if not already done.

### 9. 🟢 Zalo Sharing (Intentionally Kept)

`src/modules/sharing/share-link-builder.ts` retains Zalo as a share platform (`SharePlatform = "zalo"`). This is intentional — Zalo is Vietnam's dominant messaging app and this is a content-sharing feature, not a social media account link.

---

## Clean Verification

```
$ rg "cungcontuhoc" src/          → 0 results
$ rg "Cùng Con Tự Học" src/       → 0 results
$ rg "Cung Con Tu Hoc" src/       → 0 results
$ rg "@cungcontuhoc" src/         → 0 results
$ pnpm test                        → 106/106 pass, 635/635 pass
```

Only remaining `ccth_` prefix in src/ is intentional (cookie names, tracked above).

---

## Priority Summary

| Priority | Item | Blocker? | Effort |
|----------|------|----------|--------|
| P0 | DNS 301 redirect | Yes - SEO | Low |
| P0 | Email domain verification | Yes - email delivery | Low |
| P0 | CDN migration | Yes - audio content | Medium |
| P1 | Production DB rename | Yes - after deploy | High |
| P1 | Stripe product rename | No | Low |
| P2 | GitHub repo rename | No | Low |
| P2 | Cookie prefix decision | No | None (keep) |
| P3 | Social media accounts | No | Low |

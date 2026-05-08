# Rebrand Completeness Audit: cungcontuhoc → tinygeniushub

**Date:** 2026-05-08  
**Commit baseline:** Post `29e8029b` rebrand commit  
**Source code (`src/`):** CLEAN — zero remaining `cungcontuhoc` in .ts/.tsx  
**Total findings:** 40 actionable + 5 needs-decision + 9 low-priority docs/archive

---

## 🔴 CRITICAL — Active code references (MISSED_REFERENCE)

### F1. Public directory — Old logo files NOT deleted
| File | Action |
|------|--------|
| `public/logo-cungcontuhoc-horizontal.png` | Delete — new file exists as `logo-tinygeniushub-horizontal.png` |
| `public/logo-cungcontuhoc-horizontal.svg` | Delete — new file exists as `logo-tinygeniushub-horizontal.svg` |
| `public/logo-cungcontuhoc-icon.svg` | Delete — new file exists as `logo-tinygeniushub-icon.svg` |
| `public/logo-cungcontuhoc-mascot-email.png` | Delete — new file exists as `logo-tinygeniushub-mascot-email.png` |

> **Note:** Phase 06 logo plan said "rename" but files were COPIED, not MOVED. Old files left behind.

---

### F2. package.json — Repo URL still cungcontuhoc (3 occurrences)
| Line | Current | Should be |
|------|---------|------------|
| 200 | `"url": "git+https://github.com/manhquydev/cungcontuhoc.git"` | `"...manhquydev/tinygeniushub.git"` |
| 207 | `"url": "https://github.com/manhquydev/cungcontuhoc/issues"` | `"...manhquydev/tinygeniushub/issues"` |
| 209 | `"homepage": "https://github.com/manhquydev/cungcontuhoc#readme"` | `"...manhquydev/tinygeniushub#readme"` |

---

### F3. ecosystem.config.js:94 — Deploy repo URL not updated
```js
repo: 'https://github.com/manhquydev/cungcontuhoc.git',
```
Should be `manhquydev/tinygeniushub.git`

---

### F4. prisma/ — Seed data with old domain emails + CDN URLs

**prisma/seeds/content-seed.ts** — 5 CDN audio URLs with `cdn.cungcontuhoc.vn`:
| Line | URL |
|------|-----|
| 160 | `https://cdn.cungcontuhoc.vn/audio/phonics/listen-b.mp3` |
| 273 | `https://cdn.cungcontuhoc.vn/audio/phonics/listen-sh.mp3` |
| 338 | `https://cdn.cungcontuhoc.vn/audio/phonics/listen-sentence-01.mp3` |
| 433 | `https://cdn.cungcontuhoc.vn/audio/math/listen-number-07.mp3` |
| 566 | `https://cdn.cungcontuhoc.vn/audio/math/listen-word-problem-01.mp3` |

➡️ **EXTERNAL_ACTION**: These are CDN URLs — must verify CDN has been migrated OR update to new CDN domain. If CDN alias still resolves, this is cosmetic-only.

**prisma/seed.ts:451:**
```ts
const email = (process.env.SEED_PARENT_EMAIL ?? "demo.parent@cungcontuhoc.io.vn").toLowerCase();
```
Should be `demo.parent@tinygeniushubvn.tech` (already set in `.env.example` line 70, but fallback is stale).

**prisma/scripts/seed-admin.ts:10:**
```ts
const ADMIN_EMAIL = process.env.ADMIN_EMAILS?.split(",")[0]?.trim() || "demo.admin@cungcontuhoc.vn";
```
Should be `demo.admin@tinygeniushubvn.tech`

**prisma/seed.ts:560,566** — Vietnamese brand text:
```ts
role: "Biên tập viên Cùng Con Tự Học",
```
Should be `"Biên tập viên TinyGenius Hub"`

---

### F5. Production/Deploy scripts — Old PM2 names, paths, DB names

| File | Lines | Issue |
|------|-------|-------|
| `scripts/verify-production.sh` | 52-54,80,85 | `pm2 status cungcontuhoc`, `pm2 logs cungcontuhoc` → `tinygeniushub-web` |
| `scripts/deploy-production.sh` | 29 | `REPO_URL="...cungcontuhoc.git"` |
| `scripts/app-setup.sh` | 36,62 | Old repo URL + `git clone $REPO_URL cungcontuhoc` dir name |
| `scripts/production/production-gate-check.sh` | 15,46 | `cungcontuhoc-worker` → `tinygeniushub-worker` |
| `scripts/production/check-trial-videos-remote.sh` | 3,4 | `/var/www/cungcontuhoc` path + `-d cungcontuhoc` DB name |
| `scripts/import-abeka-videos.ts` | 95 | `/var/www/cungcontuhoc/data/...` fallback path |
| `scripts/remove_bg.py` | 5 | Windows path `d:/project/cungcontuhoc/...` (low priority, local-only) |

---

### F6. docs/DEPLOYMENT-CHECKLIST.md — `ccth_prod` DB/user references (8 occurrences)
Lines: 208, 432, 436, 441, 445, 455-456, 489, 601  
All reference `ccth_prod` database/user. Should be `tinygeniushub_prod` or `tinygeniushub`.

> **Note:** `ccth_prod` may be the actual live DB name. Changing docs alone is cosmetic — this is tied to **actual infrastructure**. See "Cookie Prefix Decision" below.

---

## 🟡 NEEDS_DECISION — Cookie prefix `ccth_*`

> **WARNING:** Changing cookie names will LOG OUT ALL ACTIVE USERS. This is a breaking change requiring coordination.

### All `ccth_` cookie constants (16 source files):

| File | Line | Constant |
|------|------|----------|
| `src/lib/auth/better-auth.ts` | 97 | `ccth_session` |
| `src/lib/auth/session.ts` | 8 | `SESSION_COOKIE_NAME = "ccth_session"` |
| `src/lib/auth/admin-auth.ts` | 48 | `ccth_admin_session` |
| `src/modules/admin/admin-auth-service.ts` | 9 | `COOKIE_NAME = "ccth_admin_session"` |
| `src/modules/reader/reader-auth-service.ts` | 17 | `ccth_reader_session` |
| `src/modules/blog/blog-repository.ts` | 89 | `ccth_blog_like_session` |
| `src/lib/legal/cookie-consent.ts` | 3 | `ccth_cookie_consent_v1` |
| `src/modules/courses/pilot-attribution.ts` | 3 | `ccth_attr_v1` |
| `src/lib/auth/impersonation.ts` | 6-7 | `ccth_impersonated_parent_id` + `ccth_impersonating` |
| `src/components/legal/cookie-consent-actions.tsx` | 18,47 | `ccth_pending_cookie_audit_v1` + `ccth_attr_v1` |
| `src/components/courses/course-lessons-player.tsx` | 32 | `ccth_course_progress_` (localStorage key) |
| `src/app/(main)/cookie-policy/page.tsx` | 57,60,63 | Displays cookie names to users |
| `src/app/api/admin/auth/login/route.ts` | 22 | `ccth_admin_session` |
| `src/app/api/admin/auth/logout/route.ts` | 10 | `ccth_admin_session` |

### Test files referencing `ccth_` cookies (9 files):
`src/lib/auth/__tests__/session.test.ts`, `src/app/api/auth/login/route.test.ts`, `src/app/api/auth/logout/route.test.ts`, `src/app/api/reader/auth/login/route.test.ts`, `src/app/api/reader/auth/signup/route.test.ts`, `src/app/api/blog/posts/[slug]/like/route.test.ts` + 8 smoke/E2E scripts

### Options:
1. **Keep `ccth_` prefix** — Internal-only, users never see it. Rename cookie-consent UI text but keep actual cookie names.
2. **Change to `tgh_` prefix** — Breaks all sessions. Requires coordinated deploy + user communication.
3. **Hybrid** — Change non-auth cookies first (`ccth_attr_v1`, `ccth_cookie_consent_v1`, `ccth_course_progress_`, `ccth_pending_cookie_audit_v1`), keep auth cookies for now.

**Recommendation:** Option 1 (keep), with Option 3 as stretch goal. Document the decision.

---

## 🟡 NEEDS_DECISION — Zalo sharing support

`src/modules/sharing/share-link-builder.ts` and its tests still have full Zalo share integration:
```ts
export type SharePlatform = "zalo" | "facebook" | "whatsapp";
// ...
case "zalo":
  return `https://zalo.me/share/?url=...`;
```

This is NOT a social media account reference — it's a sharing convenience feature for Vietnamese parents. Zalo is Vietnam's dominant messaging app.  
**Recommendation:** Keep. It's appropriate for a Vietnamese-market EdTech product. No rebrand issue here.

---

## 🟡 NEEDS_DECISION — `ccth_prod` database naming (infrastructure)

**docs/DEPLOYMENT-CHECKLIST.md** references `ccth_prod` as the production DB/user name. The rebrand plan said "Database name: cungcontuhoc → tinygeniushub" but the actual deployed DB uses `ccth_prod` which is a different naming convention.  
**Recommendation:** Verify actual production DB name. If it's `ccth_prod`, create a separate migration plan — changing DB names is a major infra task.

---

## 🟠 MEDIUM — Documentation with old references

### Marketing docs (user/customer-facing):
| File | Line | Issue |
|------|------|-------|
| `docs/marketing/README.md` | 3 | "cungcontuhoc.vn EdTech project" |
| `docs/marketing/kol-outreach-template.md` | 104 | `@cungcontuhoc` social tag |
| `docs/marketing/blog-content-plan.md` | 27 | "bao gồm cungcontuhoc.vn" |
| `docs/marketing/content-calendar-30day.md` | 12 | "Blog cungcontuhoc.vn/blog" |

### Deployment docs:
| File | Line | Issue |
|------|------|-------|
| `docs/deployment/VPS-DEPLOYMENT-GUIDE.md` | 636 | Old repo URL |
| `docs/SSH-COMMANDS.md` | 39 | GitHub raw URL with `cungcontuhoc` |
| `docs/DEPLOYMENT-READY.md` | 5,90,94 | Old repo/URLs |
| `docs/QUICK-START.md` | 45 | `git clone ...cungcontuhoc.git` |
| `docs/DEPLOYMENT-EXECUTION-PLAN.md` | 312 | Old repo reference |
| `docs/deployment/vps-production-full-courses.md` | 17 | Repo named `cungcontuhoc` |

### Other docs:
| File | Line | Issue |
|------|------|-------|
| `docs/review/docs-accuracy-report.md` | 83 | Old DATABASE_URL with `cungcontuhoc` DB name |
| `docs/research/vietnam-market-deep-dive-2025.md` | 362 | Footnote: "ClaudeKit - cungcontuhoc project" |
| `docs/implementation-plan.md` | 8-19 | Plan filenames with `cungcontuhoc-mvp-rebuild` (historical, accurate) |

---

## 🟢 LOW_PRIORITY — Archive/handover/plans

### docs/handover/ — Windows paths (historical context only)
6 files in `docs/handover/packages/` contain `D:\project\cungcontuhoc` work context paths. These are archival agent reports — no user-facing impact. Can leave or bulk-replace if desired.

### plans/.qa-artifacts/ — Old Lighthouse reports
4 JSON files contain `logo-cungcontuhoc-horizontal.svg` URLs captured from pre-rebrand Lighthouse runs. Zero impact — historical QA artifacts.

### plans/_archive/QA-REPORT.md:85
Pre-rebrand QA report referencing old logo. Archived.

---

## 🟢 LOW_PRIORITY — docs/business/ "Cùng Con Học Tốt"

`docs/business/go-to-market-sales-playbook.md` and `docs/business/abeka-monetization-master-plan.md` use "Cùng Con Học Tốt" as a separate product name for the Abeka video platform. This appears to be an intentional sub-brand, not a rebrand miss.

---

## ✅ VERIFIED CLEAN

| Area | Status |
|------|--------|
| `src/` — all `.ts`/`.tsx` | Clean (no `cungcontuhoc`, no `@cungcontuhoc`) |
| `tests/` — test files | Clean (only `ccth_` cookie refs, expected) |
| `.github/workflows/` | Clean (all `tinygeniushub`) |
| `.env.example` | Clean |
| `docker-compose.yml` | Clean |
| `next.config.ts` | Clean |
| `tsconfig.json` | Clean |
| `Dockerfile` | Clean |
| `public/logos/` | Clean (replaced with `tinygeniushub_*`) |
| `public/sw.js` | Clean (no brand references) |
| `src/` — all brand URLs | All `tinygeniushubvn.tech` |
| `src/` — all logo refs | All `logo-tinygeniushub-*` |
| `src/app/(main)/cookie-policy/page.tsx` | Cookie names listed (correct, should show actual cookie names) |

---

## 📊 Summary by category

| Category | Count | Action |
|----------|-------|--------|
| MISSED_REFERENCE (code) | 24 | Fix immediately |
| MISSED_REFERENCE (docs) | 17 | Fix in docs update pass |
| NEEDS_DECISION | 5 | Decide cookie prefix + zalo + DB naming |
| EXTERNAL_ACTION | 2 | GitHub repo rename + CDN migration |
| LOW_PRIORITY | 9 | Archive/historical, no urgency |

## 🎯 Recommended action plan (priority order)

1. **Delete 4 old logo files** from `public/` (2 min, zero risk)
2. **Fix package.json** repo URLs (1 min, zero risk)
3. **Fix ecosystem.config.js** deploy repo URL (1 min, zero risk)
4. **Fix prisma seed files** — emails + brand text (5 min, zero risk for code, CDN URLs need verification)
5. **Fix production scripts** — PM2 names, paths (10 min, only affects future deploys)
6. **Decide cookie prefix strategy** — document decision (no code change if keeping)
7. **Update deployment docs** — repo URLs, clone commands (15 min)
8. **Update marketing docs** — domain/social references (10 min)
9. **Verify CDN migration** — are `cdn.cungcontuhoc.vn` URLs still valid? (external)
10. **GitHub repo rename** — or accept URL redirect (external, GH auto-redirects)

---

**Unresolved questions:**
1. Is `ccth_prod` the actual production DB name or was it renamed to `tinygeniushub`?
2. Are `cdn.cungcontuhoc.vn` URLs still valid or does CDN need migration?
3. Should cookie prefix change to `tgh_` or keep `ccth_`? (user-impacting decision)
4. Has GitHub repo been renamed or will it redirect?
5. Is "Cùng Con Học Tốt" an active sub-brand that should be kept in docs?

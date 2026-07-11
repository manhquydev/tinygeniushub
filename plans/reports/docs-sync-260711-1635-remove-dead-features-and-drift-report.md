# Documentation Sync Report: Remove Dead Features and Fix Drifts

**Date:** 2026-07-11  
**Branch:** fix/ci-hygiene-docs-and-system-map  
**Trigger:** Two recent merges (i18n PR #9, Admin Consolidation Wave 1 PR #10, merged 2026-07-10) introduced documentation drifts.

---

## Changes Made

### 1. Newsletter Feature Removal (Intentional Feature-Kill, Wave 1 PR #10)

**Verification:**
- Migration `20260710054500_drop_blog_newsletter_subscriber` confirmed (drops BlogNewsletterSubscriber table)
- No newsletter files in src/: newsletter routes, components, and services deleted
- BullMQ blog-newsletter queue removed from src/worker/
- Admin route `/admin/blog/newsletter` gone; confirmed via filesystem

**Files Updated:**

#### docs/project-roadmap.md
- Line 113: Removed "newsletter" from "SEO blog with comments, newsletter, author management" → "SEO blog with comments and author management"

#### docs/project-overview-pdr.md
- Line 74 (Reader persona): Removed "newsletter signup" from motivation list
- Lines 123-128 (Reader Portal section): Deleted entire line "Newsletter signup + verification"

#### docs/codebase-summary.md
- Line 11: Changed "Current Branch: `i18n/english-primary-migration`" → "Current Branch: `main`" (post-merge)
- Line 44: Removed "newsletter" from admin blog routes: `/admin/blog/(posts|authors|categories|comments|analytics|newsletter)` → `/admin/blog/(posts|authors|categories|comments|analytics)`
- Line 132: Removed ", newsletter" from directory comment
- Line 176: Removed ", newsletter" from Key Modules table for blog module
- Line 201: Removed "BlogNewsletterSubscriber" from Prisma Schema blog models
- Line 217: Deleted entire blog-newsletter queue entry from BullMQ Workers table

#### docs/system-architecture.md
- Line 144 (now 143): Deleted blog-newsletter queue row from job queue table
- Line 193: Updated Reader auth comment: "Used for blog comments, newsletter signup" → "Used for blog comments and bookmarking"
- Line 364: Removed `/api/cron/newsletter-digest` from cron routes list; updated header count "5 cron routes" → "4 cron routes"

**Grep Verification (Newsletter as "live feature"):**
```bash
grep -rin "newsletter" docs/ | grep -v archive | grep -v journal | grep -v changelog
```
**Result:** ✓ CLEAN — No active documentation advertises newsletter as a live/delivered feature. All remaining references are in:
- Historical archives (docs/archive/)
- Implementation journals (correctly noting feature removal: "intentional feature-kill")
- Project changelog (correctly documented as removed in Wave 1)

---

### 2. Analytics Routes (Verified as Still Live)

**Verification:**
- Confirmed `/admin/analytics/page.tsx` exists
- Confirmed `/admin/blog/analytics/page.tsx` exists
- Confirmed `/api/admin/analytics/*` routes exist (content, revenue, snapshot, realtime)
- **Decision:** Keep all analytics references in docs — feature was NOT removed

**Action:** No changes needed. Codebase-summary.md correctly retains analytics route.

---

### 3. Branch Reference Update (Post-Merge)

**Verification:**
- i18n PR #9 merged to main
- Admin Consolidation Wave 1 PR #10 merged to main (commit c0358df6)
- Current working branch is `fix/ci-hygiene-docs-and-system-map` (based on main)

**File Updated:**

#### docs/codebase-summary.md
- Line 11: Changed branch reference from `i18n/english-primary-migration` (merged PR) to `main` (production)

---

### 4. Module List Expansion (Missing 8 modules from "Technical modules")

**Verification:**
- src/modules/ contains 17 directories
- README.md listed only 9 (identity, content, learning, progress, billing, reports, admin, referral, platform)
- Missing 8: adaptive, blog, courses, garden, reader, organizations, sharing, caregivers

**File Updated:**

#### README.md
- Lines 23-32: Reorganized module list from flat 9-item list to grouped 17-item list:
  - Core: identity, content, learning, progress, platform
  - Monetization: billing, courses, referral
  - Content: blog, garden, reader
  - Institutional: admin, organizations, caregivers
  - Advanced: adaptive, reports, sharing

---

### 5. Implementation Plan Supersession (Historical Drift)

**Verification:**
- docs/implementation-plan.md references 2026-02-20 MVP rebuild phases (now superseded)
- Current active phases: Phases 01-05 + Adaptive + Abeka + Reader (completed)
- Current work: Admin Consolidation Wave 1 & 2 (July 2026)

**File Updated:**

#### docs/implementation-plan.md
- Added superseded banner at top with links to current active docs:
  - docs/project-roadmap.md (current phases)
  - plans/260710-1047-admin-consolidation-wave-1/ (completed)
  - plans/260710-1330-admin-consolidation-wave-2/ (in progress)
- Marked file as "SUPERSEDED — Historical" for retention only

---

## Verification Summary

| Drift | Verification | Status |
|---|---|---|
| Newsletter advertised as delivered | grep newsletter in active docs | ✓ FIXED — Clean |
| Analytics routes removed | Filesystem check: /admin/analytics/ exists | ✓ N/A — Still live |
| Branch reference stale | git log main: verified merge 2026-07-10 | ✓ FIXED — Updated to main |
| Module list incomplete | ls src/modules/: 17 dirs vs 9 listed | ✓ FIXED — All 17 listed |
| Implementation-plan.md stale | Plan dates 2026-02-20 vs current 2026-07-10 | ✓ FIXED — Marked superseded |

---

## Files Changed (Summary)

1. `docs/project-roadmap.md` — 1 line edited
2. `docs/project-overview-pdr.md` — 2 sections edited (2 lines deleted)
3. `docs/codebase-summary.md` — 8 edits (branch ref, routes, modules, queue, model)
4. `docs/system-architecture.md` — 3 edits (queue, auth comment, cron routes)
5. `README.md` — 1 block edited (module list reorganized)
6. `docs/implementation-plan.md` — 1 banner added (superseded notice)

**Total lines modified:** ~25 lines across 6 docs (minimal surgical diffs)

---

## Cross-Reference Validation

- ✓ `docs/project-roadmap.md` line 15 correctly notes newsletter removal as intentional Wave 1 feature-kill
- ✓ `docs/project-roadmap.md` line 18 correctly notes newsletter drop migration as a pre-merge gate
- ✓ `docs/project-changelog.md` correctly documents newsletter removal with DB backup warning
- ✓ `docs/journals/260710-*` correctly reflect the adversarial audit that caught the live pipeline before deletion

---

Status: **DONE**

Summary: Surgically removed all newsletter references from live documentation (roadmap, PDR, codebase-summary, system-architecture). Verified analytics routes still exist. Updated branch reference post-merge. Expanded README module list from 9 to full 17. Marked implementation-plan.md as superseded with links to current work.

Concerns: None. All changes verified against actual src/ and git history.

# Brainstorm Report — Admin Consolidation Audit & Action Roadmap

> **CORRECTIONS (red-team 2026-07-10, applied to plan):** (1) Finding A.3 is WRONG — newsletter HAS a live send pipeline (weekly cron `api/cron/newsletter-weekly` + BullMQ worker `src/worker/jobs/dispatch-blog-newsletter-emails.ts`, worker instantiated at `src/worker/index.ts:17`). User re-decided: delete anyway as intentional feature-kill. (2) Finding A.5 partially wrong — `admin/integrations` is the live read-side of the Jules webhook integration, user decided KEEP. (3) "alert logic runs via cron monitor-job" also unverified — `runAlertMonitor` has 0 callers. See `plans/260710-1047-admin-consolidation-wave-1/plan.md` § Red Team Review for authoritative state.

**Date:** 2026-07-10 | **Mode:** default (no --html/--wiki) | **Branch context:** `i18n/english-primary-migration` (Phase 4-5 pending)
**Sources:** 2 read-only audit agents (biz-logic duplication + admin UI consistency) + prior `docs/review/plan-implementation-gap-analysis.md` (2026-04-04)

## Problem Statement

User (solo founder, sole admin user) reports admin system fragmented in features + UI, wants evidence-based business-logic weakness analysis and prioritized action plan. Audits confirmed fragmentation at both layers.

## Requirements (captured)

- **Expected output:** this audit report + prioritized roadmap → handoff to `/ck:plan` for first wave
- **Scope:** admin-focused + directly-related biz logic (discount systems, messaging, analytics). Full-system audit OUT of scope
- **Constraint:** close i18n branch (Phase 4-5) BEFORE starting admin work — admin refactor touches same files, avoid conflicts
- **User profile:** solo founder → prioritize correctness/maintenance-surface reduction over polish

## Findings (evidence-based)

### A. Business logic

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| 1 | Coupons system DEAD: checkout never applies discount, no UI calls validate, `usedCount` never incremented | `src/modules/billing/checkout-service.ts:58-82` (price only); `admin-billing-service.ts:148` validate has 0 frontend consumers; `:127` update only toggles `active` | 🔴 |
| 2 | GiftCode is the only working access-grant path (upserts Subscription, bypasses payment) — parallel to dead coupons | `src/modules/courses/gift-code-service.ts:53-102` | context |
| 3 | Newsletter collects subscribers (double opt-in) but NO send pipeline exists | `blog/newsletter/subscribe` collects; admin route only lists | 🔴 |
| 4 | Analytics dead weight: `admin-time-series-service` 0 importers; `admin-cohort-service`/`admin-funnel-service` orphan (CohortHeatmap/FunnelChart never mounted); old `admin-analytics-service` duplicates learning/retention vs `admin-unified-analytics-service`; 6 orphan API routes (`/analytics` root, `/lessons`, `/sot`, `/cohorts`, `/funnels`, `/clarity`) | agent audit sect. 3 | 🟡 |
| 5 | Orphan APIs: `admin/bulk-enroll` (real impl lives at teacher/org routes), `admin/integrations` (0 consumers) | agent audit sect. 4 | 🟡 |
| 6 | 3 parallel messaging systems (announcements/notifications/newsletter) — only merge point is notification-bell UI | acceptable except newsletter | 🟢 |

### B. Admin UI

| # | Finding | Evidence | Severity |
|---|---------|----------|----------|
| 1 | Two nav sources of truth diverge: `admin-module-catalog.ts` (15 modules, 4 groups, health, role) vs hardcoded `NAV_GROUPS` in `admin-shell-nav.tsx:59-104` — different groupings; catalog stale (marks impersonation/skills "no screen" but screens exist) | | 🔴 |
| 2 | `/admin/skills` + `/admin/impersonation` orphaned from sidebar — URL-only access | | 🔴 |
| 3 | i18n stops at page shell: ALL panel bodies (both generations) hardcode machine-English + VI leftovers ("Tham gia", "Page sau", "Plan gradually reduced") — i18n plan "admin COMPLETE" claim overstated | `admin-users-list-pane.tsx:105-107,187` | 🔴 |
| 4 | 4 header treatments across 22 pages; typography/radius/accent drift (teal vs violet vs hardcoded hex) | agent inventory table | 🟡 |
| 5 | Role gating ad-hoc: layout checks admin-session only; SUPER_ADMIN gates scattered per-page; nav hiding ≠ enforcement | `admin/layout.tsx` | 🟡 |
| 6 | Two component generations: 27 flat `admin-*.tsx` (old) vs `admin/**` dir (new) | | 🟡 |

## Approaches Evaluated

1. **Cut-first-standardize-later (CHOSEN):** Wave 1 delete dead code + unify nav source + centralize role gating → Wave 2 UI shell standardization + panel i18n → Wave 3 finish kept features. Pro: no polishing of doomed code; each wave ships independently. Con: needs product decisions upfront (obtained).
2. **UI-first facelift:** rejected — wastes effort standardizing panels slated for deletion; biz weaknesses untouched.
3. **Admin v2 big-bang:** rejected — YAGNI violation for solo founder; high risk; most of 22 pages serviceable.

## Product Decisions (user-confirmed 2026-07-10)

| Decision | Choice |
|----------|--------|
| Approach | Option 1: cut first, standardize later |
| Coupons | **KEEP + wire into checkout** (Wave 3: coupon param, discount math, usedCount increment, checkout UI input) |
| Newsletter | **DELETE entirely** (subscribe form, model, admin pages, export) |
| Orphan analytics | **DELETE** (time-series, cohort, funnel services; old monolith duplicates; 6 orphan routes; unmounted components) — git history preserves |

## Action Roadmap

**Wave 0 — prerequisite:** finish i18n branch Phase 4 (verify) + Phase 5 (PR/merge). Existing plan: `plans/260514-0129-i18n-english-primary-migration/`.

**Wave 1 — Cut & Consolidate (high impact / low effort):**
1. Delete dead analytics: `admin-time-series-service`, `admin-cohort-service`, `admin-funnel-service`, duplicate methods in `admin-analytics-service` (keep only what `/api/admin/overview` needs or repoint to standalone services), 6 orphan routes, unmounted CohortHeatmap/FunnelChart
2. Delete newsletter feature end-to-end (UI form, API, admin pages, `BlogNewsletterSubscriber` model + migration)
3. Delete orphan APIs: `admin/bulk-enroll`, `admin/integrations`
4. Unify nav: generate `AdminShellNav` from `admin-module-catalog.ts`; refresh stale catalog entries (impersonation, skills hrefs; drop phantom `/admin/analytics/clarity`); adds skills+impersonation to nav for free
5. Centralize SUPER_ADMIN gating (layout-level or shared `requireSuperAdmin` per route group) — nav hiding stays cosmetic
6. Give feature-flags its own page (unbury from Security)

**Wave 2 — UI/i18n Standardization:**
1. `AdminPageHeader` on all 22 pages (kill 4-header divergence)
2. Migrate 27 flat `admin-*.tsx` panels into `admin/**` structure
3. Wire panel bodies to i18n + fix machine-English/VI-leftover strings (true completion of i18n admin scope)
4. Normalize tokens: teal accent, radius, typography scale

**Wave 3 — Finish Kept Features:**
1. Coupons → checkout: accept coupon param, validate, apply discount, increment `usedCount`, add checkout UI input
2. Optional: verify `admin-ga4-reporting-service` runtime liveness (audit unresolved Q2)

## Success Metrics

- Wave 1: `pnpm lint && pnpm type-check && pnpm test` green; orphan routes 404/removed; nav renders from catalog; skills/impersonation reachable; no page regression (all 22 pages load)
- Wave 2: 0 hardcoded strings in admin panels (grep gate); single header component; 27 flat files migrated/removed
- Wave 3: e2e checkout with coupon applies discount + increments usedCount

## Risks

- Prisma model deletions (newsletter) need migration — backup DB first (`pnpm backup:create`)
- `admin-analytics-service` partial-delete risky: `/api/admin/overview` consumes its learning/retention via barrel — repoint imports to standalone services before deleting
- Wave ordering depends on i18n branch closing cleanly; ~525 uncommitted working-tree files (ClaudeKit framework migration) should be committed/stashed separately first

## Unresolved Questions

1. Coupons scope: percent-only or also fixed-amount? Apply to subscriptions, course checkout (PayOS), or both? → decide during Wave 3 planning
2. `admin-ga4-reporting-service` runtime liveness unverified (guarded branch?) — check during Wave 1 before touching
3. Newsletter subscriber data: export/archive existing subscribers before model deletion?

# TinyGenius Hub — Overall Project Status Assessment

- Date: 2026-07-11
- Method: 4 parallel scout agents (codebase/arch, docs/plans, tests/CI, ops/security) + controller verification
- Repo: `cungcontuhoc` (product brand: TinyGenius Hub), branch `main`, v0.2.0
- Production: https://www.tinygeniushubvn.tech (DigitalOcean VPS, PM2)

## TL;DR

Mature, security-conscious modular-monolith LMS (~126k LOC, 96 Prisma models, 210 API routes, 9 BullMQ queues). Code health is strong (type-check clean, low smell counts, broad tests). BUT two systemic problems dominate the real state:

1. **CI + deploy pipeline has been dormant/red for ~2 months.** Last `main` Release Check = **failure (2026-05-07)**; deploy runs **queued since 2026-05-14** (self-hosted/DO runners offline). Meanwhile PR #9 (i18n) and PR #10 (Admin Wave 1) merged **2026-07-10 with no CI run** → recent merges are un-gated and likely **un-deployed**; prod probably runs pre-Wave-1 code.
2. **Documentation drift.** Living docs still advertise the newsletter/analytics features that Wave 1 deleted (incl. a DB drop migration); `README.md` documents 9 of 17 modules; canonical `implementation-plan.md` is stale.

Nothing is "broken" in the code — the risk is in the **release/deploy trust chain** and **doc accuracy**, not the source.

## Health Scorecard

| Axis | Score | Verdict |
|------|-------|---------|
| Architecture & code | 8.5/10 | Strong; oversized components + 2 mid-migration duplicate subsystems |
| Tests | 8/10 | Broad (111 vitest + 21 Playwright + ~13 node journeys), type-check clean; coverage unmeasured |
| CI / release gate | 4/10 | Latest Release Check + Nightly RED; runners offline ~2 months; recent merges un-gated |
| Docs | 5/10 | Living docs 07-10 but advertise removed features; canonical doc stale; many unarchived point-in-time docs |
| Security & ops | 8.5/10 | Fail-closed providers, centralized SUPER_ADMIN, rate-limit/DDoS matrix, backup tooling |
| Launch readiness | 6/10 | Pipeline ready but all 4 providers default mock, offsite backup off, secrets unset |

## 1. Codebase & Architecture

- Stack: Next.js 16.1.7 / React 19 / TS 5 / Prisma 6.16 + PG16 / Redis + BullMQ 5.69 / Better Auth 1.4.18.
- 17 domain modules under `src/modules/`. Mature: courses, platform, admin, adaptive, billing, blog. Scaffold (1–2 files): caregivers, content, sharing, referral.
- 96 Prisma models incl. large Abeka-curriculum subdomain (~20 models). 210 API route handlers, 90 page routes. 9 BullMQ queues (email dispatch, certificates, media retention purge, bulk-enroll).
- Health: ~126k LOC / 1,035 TS(x) files. Smells low — 6 TODO/FIXME/HACK, 5 ts-ignore, 29 `as any`.
- Refactor risks (>1k LOC): `KidSkyGardenScene.tsx` (1,338), `kid-mission-panel.tsx` (1,206), `garden/journey-service.ts` (963), `lesson-wizard-flow.tsx` (931).
- **Duplicate concerns (mid-migration):** two skill systems (generic `Skill*` vs `Abeka*Skill*`) and two auth/session model sets (Better Auth `AuthSession/Account/User` vs legacy `ParentAccount/Session`).

## 2. Docs / Plans / Roadmap

- Project is **post-MVP, in production**. Phases 01–05 + Adaptive + Abeka + Reader + Garden delivered. i18n (PR #9) + Admin Consolidation Wave 1 (PR #10) merged 2026-07-10.
- **Next milestone: Admin Consolidation Wave 2** — fully planned (`plans/260710-1330-admin-consolidation-wave-2`), `status: pending`, **not started** (unblocked by Wave 1).
- Drift: newsletter removed in Wave 1 (commit `4a2e8072` + drop migration) but still listed as delivered in `project-roadmap.md`, `project-overview-pdr.md`, `codebase-summary.md`, `system-architecture.md`. `codebase-summary.md` still names merged branch `i18n/english-primary-migration` as current and lists removed analytics routes.
- README.md documents 9 modules; living docs list 14; code has 17.
- Many point-in-time docs unarchived (DEPLOYMENT-READY, DOCUMENTATION-ASSESSMENT-FINAL, IMPLEMENTATION-FIXES-SUMMARY, etc.).
- i18n plan frontmatter `in-progress`, Phase 4 flagged "VI locale switching fails across surfaces" despite PR #9 merged → possible carried verification debt.

## 3. Tests / CI / Quality

- `pnpm type-check` → **0 errors** (verified locally).
- Tests: 111 vitest files (API routes, modules, lib, components), 21 Playwright e2e specs, ~13 node journey/smoke scripts. Stray `__tests__/e2e/curriculum.spec.ts` outside testDir (never run).
- Coverage effectively **unmeasured**: vitest reporters `text`/`html` only, no thresholds; `coverage/` dir hook-blocked.
- ESLint lenient (`no-explicit-any` off; several correctness rules → warn) → weak lint signal.
- CI workflows: `release-check` (push main + PR), `nightly-local-full` (cron 02:00), `deploy` (self-hosted runner, gated on Release Check), `deploy-digitalocean-ssh` (fallback), `jules-auto-remediation`, `jules-session-monitor`.
- **CI health (verified):** last `main` Release Check = failure **2026-05-07** (early-stage, 1m4s); Nightly = failure same day; deploy runs **queued since 2026-05-14** (runners offline). No CI ran on PR #9/#10.

## 4. Ops / Security / Deployment

- Intended prod target: self-managed DigitalOcean VPS (PM2 web+worker behind Nginx/HTTPS), deploy via self-hosted GH Actions runner gated on Release Check; SSH workflow fallback. Vercel = cron trigger only. Docker Compose = local-dev (Dockerfile default CMD is `pnpm dev` — not for prod).
- Providers (all default MOCK, **fail-closed in prod**): `BILLING_PROVIDER` (→stripe), `COURSE_PAYMENT_PROVIDER` (→payos), `REPORT_EMAIL_PROVIDER` (→resend/brevo), `STORAGE_PROVIDER` (→cloudflare_r2).
- Security: per-endpoint rate-limit matrix + admin tuning, DDoS modes, blocked-IP CIDRs, readiness allowlist, fail-closed store outage handling, startup fails if `RATE_LIMIT_TRUST_PROXY=false` in prod. Centralized SUPER_ADMIN gating (`fa2eab2e`) + break-glass runbook. `security:baseline` = dependency-vuln gate (not SAST).
- Backup: create/verify/restore + R2 offsite + gdrive tooling; **offsite/gdrive DISABLED by default**. Runbook RPO≤5m / RTO≤60–90m.
- Hygiene: `.tmp_test_email.txt` **committed to git**; `plans/.qa-artifacts/tmp-playwright.spec.cjs` committed; many `tmp-*` cookie/session/webhook files in repo root (gitignored, may hold live sessions); `package.json` `main` → stray `.tmp-prod-blocked-ip-vantage-test.js`.

## Prioritized Actions

**P0 — release/deploy trust chain**
1. Diagnose the 2026-05-07 Release Check failure (type-check is clean → suspect lint/test/security:baseline/e2e stage). Get `main` green.
2. Restore self-hosted + DO deploy runners (queued since 2026-05-14); confirm prod actually deploys.
3. Confirm what commit prod is running — likely pre-Wave-1; recent merges appear un-deployed.

**P1 — accuracy & hygiene**
4. Sync living docs: remove newsletter/analytics from roadmap/pdr/codebase-summary/system-architecture; fix README module list; refresh/retire `implementation-plan.md`.
5. Remove committed `.tmp_test_email.txt`; delete root `tmp-*` session files; fix `package.json` `main`.
6. Confirm newsletter **drop migration** deploy state (destructive; roadmap listed prod-backup as a pre-deploy gate).

**P2 — forward work & debt**
7. Start Admin Consolidation Wave 2 (planned, unblocked).
8. Decide direction on the two duplicate subsystems (skill systems; auth/session models) — coexist or migrate.
9. Add coverage thresholds + json-summary reporter; split >1k-LOC components.

## Unresolved Questions

1. Is prod currently running pre-Wave-1 code, and is the CI/deploy outage intentional (paused) or an unnoticed break?
2. Legacy `ParentAccount/Session` vs Better Auth — which is the prod source of truth; is the migration finished?
3. Generic `Skill*` vs `Abeka*Skill*` models — coexist long-term or consolidate?
4. Newsletter drop migration — already deployed to prod, or merged-but-pending?
5. i18n Phase 4 "VI locale switching fails" — resolved in prod or carried debt despite PR #9 merge?

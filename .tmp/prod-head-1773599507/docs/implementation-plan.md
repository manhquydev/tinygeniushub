# Implementation Plan (Execution Snapshot)

## Source of Truth
- Primary source: `docs/handover/handover-master-agent-ready.md`
- This file summarizes the current execution plan and implementation state.

## Active Plan Files
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/plan.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-01-foundation-architecture.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-02-core-modules.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-03-critical-workflows.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-04-ui-qa-ops.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-05-release-gates-email-delivery.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-06-ci-hardening-release-evidence.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-07-observability-health-probes.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-08-p0-end-to-end-journey-coverage.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-09-backend-db-integrity-hardening.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-10-better-auth-migration.md`
- `plans/2026-02-20-cungcontuhoc-mvp-rebuild/phase-11-mvp-gap-closure-production-readiness.md`

## What Is Implemented
1. Foundation stack: Next.js 16, TypeScript, Prisma, PostgreSQL schema, Redis/BullMQ worker scaffold.
2. Domain modules: identity, content, learning, progress, billing, reports, admin, referral, platform.
3. Locked rules: child profile limit by plan, idempotent lesson completion, reward uniqueness, webhook idempotency.
4. Core UI routes: home, pricing, auth, parent dashboard/children/reports, kid today mission.
5. Weekly report delivery: in-app generation + queued email dispatch pipeline (mock email sender).
6. Quality gates: lint, type-check, test, build, e2e smoke, security baseline, perf sanity.
7. CI policy gate: GitHub Actions workflow executes `pnpm release:check` and uploads security/perf evidence artifacts.
8. Observability baseline: structured JSON logger, health endpoint (`/api/health`), readiness endpoint (`/api/health/ready`) with DB/Redis checks.
9. P0 e2e journey: dedicated `pnpm test:e2e:p0` flow validates signup -> child creation -> lesson completion (idempotency) -> report generation -> email dispatch.
10. CSRF origin guard for authenticated write routes (children, lesson completion, report generation/email dispatch, logout).
11. Backend/DB integrity hardening: unique-constraint race fallback for completion + webhook flows, plus weekly report queue index migration.
12. Better Auth migration: Prisma-backed auth tables, legacy parent/account backfill, and Better Auth-powered signup/login/logout + session resolution.
13. Billing checkout baseline: authenticated checkout session API with provider adapter abstraction (`mock_gateway` default).
14. Admin/referral baseline: admin-guarded operational dashboard + referral code generation/claim APIs.
15. Admin backend APIs: overview, payment/webhook inspection, and lesson trial-flag update with admin guard + audit log.
16. Evidence media upload baseline: signed upload URL API with storage provider abstraction (`mock_r2` and `cloudflare_r2` adapters).
17. Data-integrity e2e baseline: `pnpm test:e2e:integrity` validates signup atomic records, completion/reward idempotency, weekly report uniqueness, and webhook/payment invariants.
18. Auth timing hardening baseline: `pnpm test:e2e:auth-timing` validates unknown-account vs wrong-password timing distribution (minimum failure duration + median/p95 delta thresholds).
19. Video-watch backend hardening tests: integration-style unit tests now validate session issuance, heartbeat sequencing, completion gating, and watch-completion audit flow in `src/modules/learning/__tests__/video-watch-service.test.ts`.
20. Lesson completion backend hardening tests: transaction-focused tests now validate idempotency, trial restriction, unique-race fallback, retention policy, and streak/progress updates in `src/modules/learning/__tests__/completion-service.test.ts`.
21. Admin/progress/referral/session backend hardening tests: service-level tests now validate overview aggregation, child CRUD limits, evidence upload session checks, referral idempotency/race fallback, and auth session parent resolution.
22. Auth session lifecycle e2e baseline: `pnpm test:e2e:auth-session` validates rotation, single-session invalidation, multi-session isolation, and re-login freshness.
23. Staging-provider contract e2e baseline: `pnpm test:e2e:staging-providers` validates checkout, signed webhook processing, admin payment visibility, and weekly email delivery contract checks.
24. Coverage gate milestone reached: backend statements coverage now exceeds handover threshold (`81.13%` vs target `>=80%`).

## Remaining Expansion Work
1. Integrate production payment provider adapter and signature schema (current checkout provider is `mock_gateway` baseline).
2. Complete media upload pipeline hardening (upload completion verification, object existence reconciliation, orphan cleanup runbook).
3. Add full observability stack (Sentry + tracing + metrics dashboards + alert policies).
4. Configure repository branch protection to enforce required checks (`release-check`).
5. Expand admin/referral baseline into full moderation/CMS/payout workflows.
6. Remediate transitive dependency vulnerabilities and tighten security gate threshold.

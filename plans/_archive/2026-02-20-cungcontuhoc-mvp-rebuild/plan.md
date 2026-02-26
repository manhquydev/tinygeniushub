---
title: "Cung Con Tu Hoc MVP Rebuild Plan"
description: "Build the modular-monolith MVP foundation with locked business rules and core parent/child flows."
status: in-progress
priority: P1
effort: 40h
issue: 0
branch: main
tags: [feature, frontend, backend, database, api, auth, qa, ops]
created: 2026-02-20
---

# Cung Con Tu Hoc MVP Rebuild Plan

## Overview
This plan rebuilds the project from scratch with a production-oriented modular monolith based on the handover source of truth. Scope focuses on MVP flows and locked integrity rules.

## Phases
| # | Phase | Status | Effort | Link |
|---|---|---|---|---|
| 1 | Foundation & Architecture | Completed | 6h | [phase-01](./phase-01-foundation-architecture.md) |
| 2 | Identity, Child Profiles, Content | Completed | 8h | [phase-02-core-modules.md](./phase-02-core-modules.md) |
| 3 | Learning, Progress, Reports, Billing Integrity | Completed | 12h | [phase-03-critical-workflows.md](./phase-03-critical-workflows.md) |
| 4 | UI Flows, QA, Ops Baseline | Completed | 8h | [phase-04-ui-qa-ops.md](./phase-04-ui-qa-ops.md) |
| 5 | Release Gates & Report Email Delivery | Completed | 6h | [phase-05-release-gates-email-delivery.md](./phase-05-release-gates-email-delivery.md) |
| 6 | CI Hardening & Release Evidence | Completed | 4h | [phase-06-ci-hardening-release-evidence.md](./phase-06-ci-hardening-release-evidence.md) |
| 7 | Observability Baseline & Health Probes | Completed | 4h | [phase-07-observability-health-probes.md](./phase-07-observability-health-probes.md) |
| 8 | P0 End-to-End Journey Coverage | Completed | 5h | [phase-08-p0-end-to-end-journey-coverage.md](./phase-08-p0-end-to-end-journey-coverage.md) |
| 9 | Backend & DB Integrity Hardening | Completed | 4h | [phase-09-backend-db-integrity-hardening.md](./phase-09-backend-db-integrity-hardening.md) |
| 10 | Better Auth Migration | Completed | 6h | [phase-10-better-auth-migration.md](./phase-10-better-auth-migration.md) |
| 11 | MVP Gap Closure & Production Readiness | Planned | 24h | [phase-11-mvp-gap-closure-production-readiness.md](./phase-11-mvp-gap-closure-production-readiness.md) |

## Locked Business Rules Covered
- Child profile limit by plan (3 for Standard/trial, 5 for Family+).
- Trial users can only access trial-enabled lessons.
- Lesson completion is idempotent and retry-safe.
- One reward grant per child per lesson.
- Billing webhook processing is idempotent and auditable.
- Auto-charge eligibility logic is scoped to active, auto-renew subscriptions.
- Weekly report generation is deterministic and timezone-aware (Asia/Bangkok).

## Risks & Assumptions
- Payment provider integration is mocked via webhook contract first; provider-specific SDK wiring is next sprint.
- Better Auth is now integrated with Prisma-backed auth tables and legacy parent-account backfill.
- Security/perf checks are now enforced in CI; branch protection policy still needs repository-level configuration.
- Admin and referral modules are currently scaffolds and need operational workflows.
- Security baseline currently reports high/moderate vulnerabilities in transitive dependencies and should be tracked in release risk.

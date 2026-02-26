# Phase 06 - CI Hardening & Release Evidence

## Objective
Promote local release gates into enforced CI checks and persist security/perf evidence for each run.

## Deliverables
- GitHub Actions workflow that runs on push and pull request.
- CI pipeline executes `pnpm release:check` (lint, type-check, test, e2e smoke, security baseline, perf sanity).
- Workflow uploads generated artifacts:
  - `reports/security/latest-summary.md`
  - `reports/security/security-baseline-*.json`
  - `reports/perf/latest.json`
- CI summary includes direct pointers to generated report files in artifacts.

## Acceptance Criteria
- Workflow succeeds on a clean repository state with Node 20 + pnpm.
- Any `release:check` failure fails the CI job.
- Security/perf reports are downloadable from workflow artifacts for every run.

## Status
- Completed on 2026-02-20.

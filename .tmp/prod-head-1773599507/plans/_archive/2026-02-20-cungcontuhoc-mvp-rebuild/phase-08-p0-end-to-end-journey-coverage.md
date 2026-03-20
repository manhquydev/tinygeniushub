# Phase 08 - P0 End-to-End Journey Coverage

## Objective
Move from smoke-only e2e to real P0 business journey validation against live dependencies.

## Deliverables
- Full journey e2e script for:
  - parent signup
  - child profile creation
  - lesson mission fetch
  - lesson completion with idempotency re-submit
  - weekly report generation
  - weekly report email dispatch
- Weekly reports read API does not mutate delivery state for already sent reports.
- New script command `pnpm test:e2e:p0`.
- CI workflow updated to start PostgreSQL/Redis and run migrate + seed before P0 e2e.

## Acceptance Criteria
- P0 journey passes locally with Docker dependencies running.
- CI runs P0 journey with deterministic setup.
- `release:check` still passes and remains the lightweight fast gate.

## Status
- Completed on 2026-02-20.

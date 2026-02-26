# Phase 05 - Release Gates & Report Email Delivery

## Objective
Close key handover gaps around quality gates and weekly report email delivery.

## Deliverables
- Weekly report email delivery service (queue consumer + opt-in enforcement + status updates).
- Worker orchestration for report email dispatch.
- API endpoint for manual parent-triggered report email dispatch.
- Release gate scripts:
  - `pnpm test:e2e`
  - `pnpm security:baseline`
  - `pnpm perf:sanity`
  - `pnpm release:check`

## Acceptance Criteria
- Queued weekly reports can transition to `SENT` / `BOUNCED` by worker job.
- Parent can trigger manual report email delivery for their own account.
- E2E smoke, security baseline, and perf sanity scripts are executable.
- `pnpm release:check` runs end-to-end successfully in local environment.

## Status
- Completed on 2026-02-20.

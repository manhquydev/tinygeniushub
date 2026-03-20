# Phase 03 - Critical Workflows

## Objective
Implement high-integrity flows: lesson completion, rewards, reports, and webhook reconciliation.

## Deliverables
- Idempotent lesson completion endpoint (retry-safe).
- Reward grant uniqueness guarantee per child+lesson.
- Weekly report aggregation service and API.
- Idempotent billing webhook ingestion with audit log.

## Acceptance Criteria
- Duplicate completion requests do not create duplicate rewards.
- Duplicate webhooks do not create duplicate payment records.
- Weekly report data can be regenerated deterministically.

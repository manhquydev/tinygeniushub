# Phase 01: Freeze, Baseline, Decision Lock

## Context Links
- `docs/DATABASE-MIGRATION-PLAN.md`
- `docs/deployment/PRODUCTION-MIGRATION-COMMANDS.md`
- `docs/business/abeka-course-package-design.md`
- `prisma/seeders/curriculum-packages.ts`

## Overview
- Priority: Critical
- Status: Pending
- Goal: Lock one approved data definition before any further mutation.

## Key Insights
- Current docs are inconsistent on package definitions.
- Without decision lock, any reseed/import can make drift worse.

## Requirements
- One canonical package spec (code, grades, subjects, videoCount, pricing, description).
- One canonical description quality policy.
- Rollout start timestamp for delta tracking.

## Architecture
- Decision artifact in docs -> implementation seeder -> verification SQL/API.

## Related Code Files
- Modify: `docs/deployment/PRODUCTION-MIGRATION-COMMANDS.md`
- Modify: `docs/business/abeka-course-package-design.md`
- Modify: `prisma/seeders/curriculum-packages.ts`

## Implementation Steps
1. Freeze current production snapshot (DB + API + UI status).
2. Produce canonical package matrix (8 rows exact).
3. Define description quality thresholds.
4. Approve “legacy course retention vs cleanup” policy.

## Todo List
- [ ] Snapshot pre-change state
- [ ] Canonical matrix approved
- [ ] Quality policy approved
- [ ] Migration safety constraints approved

## Success Criteria
- All stakeholders use one source of truth.
- No ambiguous package mapping remains.

## Risk Assessment
- Risk: another partial deploy before lock.
- Mitigation: temporary change freeze on data pipeline.

## Security Considerations
- No secret exposure in docs or reports.
- Backup paths and credentials kept internal.

## Next Steps
- Start Phase 02 only after formal approval of canonical matrix.
